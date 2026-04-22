package main

import (
    "bytes"
	"bufio"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"gcss-backend/internal/store"
)

// ── Rate Limiter (in-memory, per-IP) ────────────────────────────

type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	interval time.Duration
	burst    int
}

type bucket struct {
	tokens    int
	lastReset time.Time
}

func newRateLimiter(interval time.Duration, burst int) *rateLimiter {
	return &rateLimiter{
		buckets:  make(map[string]*bucket),
		interval: interval,
		burst:    burst,
	}
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	b, ok := rl.buckets[key]
	now := time.Now()
	if !ok {
		rl.buckets[key] = &bucket{tokens: rl.burst - 1, lastReset: now}
		return true
	}

	if now.Sub(b.lastReset) >= rl.interval {
		b.tokens = rl.burst - 1
		b.lastReset = now
		return true
	}

	if b.tokens > 0 {
		b.tokens--
		return true
	}
	return false
}

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type ContactRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	PhoneCode string `json:"phoneCode"`
	Phone     string `json:"phone"`
	Country   string `json:"country"`
	Message   string `json:"message"`
	Locale    string `json:"locale,omitempty"`
}

type PaymentRequest struct {
	Method  string `json:"method"`
	Country string `json:"country"`
	Email   string `json:"email"`
	Locale  string `json:"locale,omitempty"`
}

type LanguageRequest struct {
	Name   string `json:"name"`
	Email  string `json:"email"`
	Locale string `json:"locale,omitempty"`
}

type StoredRecord struct {
	Type      string      `json:"type"`
	CreatedAt time.Time   `json:"createdAt"`
	IP        string      `json:"ip,omitempty"`
	UA        string      `json:"ua,omitempty"`
	Payload   interface{} `json:"payload"`
}

type server struct {
	allowedOrigins map[string]struct{}
	allowAnyOrigin bool
	dataFile       string
	uploadDir      string
	store          *store.Store
	authLimiter    *rateLimiter // rate limit login/register/reset
}

func main() {
	port := getenvDefault("PORT", "8080")
	dataFile := getenvDefault("DATA_FILE", filepath.Join("data", "requests.jsonl"))
	dbPath := getenvDefault("DB_PATH", filepath.Join("data", "gcss.db"))
	uploadDir := getenvDefault("UPLOAD_DIR", filepath.Join("data", "uploads"))
	corsOrigins := getenvDefault("CORS_ORIGINS", "http://localhost:3000,https://v3.gcss.hk,https://gcss.hk,https://www.gcss.hk")

	allowedOrigins, allowAny := parseOrigins(corsOrigins)
	if err := ensureParentDir(dataFile); err != nil {
		log.Fatalf("failed to ensure data directory: %v", err)
	}
	if err := ensureParentDir(dbPath); err != nil {
		log.Fatalf("failed to ensure db directory: %v", err)
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("failed to ensure upload dir: %v", err)
	}

	encryptionSecret := getenvDefault("ENCRYPTION_SECRET", "gcss-default-secret-change-me")
	st, err := store.Open(context.Background(), dbPath, encryptionSecret)
	if err != nil {
		log.Fatalf("failed to open sqlite db: %v", err)
	}
	log.Printf("Encryption: enabled (PBKDF2 key derivation + AES-256-GCM)")
	defer func() {
		_ = st.Close()
	}()

	s := &server{
		allowedOrigins: allowedOrigins,
		allowAnyOrigin: allowAny,
		dataFile:       dataFile,
		uploadDir:      uploadDir,
		store:          st,
		authLimiter:    newRateLimiter(1*time.Minute, 10), // 10 attempts per minute per IP
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/api/contact", s.withCORS(s.handleContact))
	mux.HandleFunc("/api/requests/payment", s.withCORS(s.handlePaymentRequest))
	mux.HandleFunc("/api/requests/language", s.withCORS(s.handleLanguageRequest))
	// Auth
	mux.HandleFunc("/api/auth/register", s.withCORS(s.handleAuthRegister))
	mux.HandleFunc("/api/auth/login", s.withCORS(s.handleAuthLogin))
	mux.HandleFunc("/api/auth/me", s.withCORS(s.handleAuthMe))
	mux.HandleFunc("/api/auth/logout", s.withCORS(s.handleAuthLogout))
	mux.HandleFunc("/api/auth/password/request-reset", s.withCORS(s.handleAuthRequestPasswordReset))
	mux.HandleFunc("/api/auth/password/reset", s.withCORS(s.handleAuthResetPassword))
	mux.HandleFunc("/api/auth/profile", s.withCORS(s.handleAuthUpdateProfile))
	mux.HandleFunc("/api/auth/password/change", s.withCORS(s.handleAuthChangePassword))
	mux.HandleFunc("/api/auth/email/change-request", s.withCORS(s.handleAuthEmailChangeRequest))
	mux.HandleFunc("/api/auth/email/change-confirm", s.withCORS(s.handleAuthEmailChangeConfirm))
	// User dashboard
	mux.HandleFunc("/api/user/dashboard", s.withCORS(s.handleUserDashboard))
	// Public config (publishable keys only)
	mux.HandleFunc("/api/public/config", s.withCORS(s.handlePublicConfig))
	// Admin
	mux.HandleFunc("/api/admin/overview", s.withCORS(s.handleAdminOverview))
	mux.HandleFunc("/api/admin/blog/posts", s.withCORS(s.handleAdminBlogPosts))
	mux.HandleFunc("/api/admin/blog/posts/", s.withCORS(s.handleAdminBlogPost))
	mux.HandleFunc("/api/admin/users", s.withCORS(s.handleAdminUsers))
	mux.HandleFunc("/api/admin/users/", s.withCORS(s.handleAdminUserAction))
	mux.HandleFunc("/api/admin/forum/topics", s.withCORS(s.handleAdminForumTopics))
	mux.HandleFunc("/api/admin/forum/topics/", s.withCORS(s.handleAdminForumTopicDelete))
	mux.HandleFunc("/api/admin/forum/posts/", s.withCORS(s.handleAdminForumPostDelete))
	mux.HandleFunc("/api/admin/requests", s.withCORS(s.handleAdminRequests))
	mux.HandleFunc("/api/admin/settings", s.withCORS(s.handleAdminSettings))
	mux.HandleFunc("/api/admin/settings/", s.withCORS(s.handleAdminSettingsItem))
	mux.HandleFunc("/api/admin/settings/audit", s.withCORS(s.handleAdminSettingsAudit))
	// Admin product catalog
	mux.HandleFunc("/api/admin/products/billing-cycles", s.withCORS(s.handleAdminBillingCycles))
	mux.HandleFunc("/api/admin/products/billing-cycles/", s.withCORS(s.handleAdminBillingCycleItem))
	mux.HandleFunc("/api/admin/products/support-tiers", s.withCORS(s.handleAdminSupportTiers))
	mux.HandleFunc("/api/admin/products/support-tiers/", s.withCORS(s.handleAdminSupportTierItem))
	mux.HandleFunc("/api/admin/products/server-tiers", s.withCORS(s.handleAdminServerTiers))
	mux.HandleFunc("/api/admin/products/server-tiers/", s.withCORS(s.handleAdminServerTierItem))
	mux.HandleFunc("/api/admin/promo-codes", s.withCORS(s.handleAdminPromoCodes))
	mux.HandleFunc("/api/admin/promo-codes/", s.withCORS(s.handleAdminPromoCodeItem))
	// Public catalog + promo apply + checkout + webhook
	mux.HandleFunc("/api/products/catalog", s.withCORS(s.handlePublicCatalog))
	mux.HandleFunc("/api/promo-codes/apply", s.withCORS(s.handlePromoApply))
	mux.HandleFunc("/api/billing/checkout", s.withCORS(s.handleCheckout))
	mux.HandleFunc("/api/billing/paypal/capture", s.withCORS(s.handlePayPalCapture))
	mux.HandleFunc("/api/webhooks/stripe", s.handleStripeWebhook) // no CORS — server-to-server
	mux.HandleFunc("/api/webhooks/paypal", s.handlePayPalWebhook)
	mux.HandleFunc("/api/webhooks/pingxx", s.handlePingxxWebhook)
	// User orders + invoices
	mux.HandleFunc("/api/user/invoices", s.withCORS(s.handleUserInvoices))
	mux.HandleFunc("/api/user/invoices/", s.withCORS(s.handleUserInvoiceByNumber))
	mux.HandleFunc("/api/user/orders", s.withCORS(s.handleUserOrders))
	mux.HandleFunc("/api/user/orders/", s.withCORS(s.handleOrderByNumber))
	mux.HandleFunc("/api/admin/orders", s.withCORS(s.handleAdminOrders))
	mux.HandleFunc("/api/admin/orders/", s.withCORS(s.handleAdminOrderItem))
	// Blog
	mux.HandleFunc("/api/blog/posts", s.withCORS(s.handleBlogPosts))
	mux.HandleFunc("/api/blog/posts/", s.withCORS(s.handleBlogPost))
	// Forum
	mux.HandleFunc("/api/forum/categories", s.withCORS(s.handleForumCategories))
	mux.HandleFunc("/api/forum/topics", s.withCORS(s.handleForumTopics))
	mux.HandleFunc("/api/forum/topics/", s.withCORS(s.handleForumTopicRoutes))
	mux.HandleFunc("/api/forum/posts/", s.withCORS(s.handleForumPostRoutes))
	// Uploads
	mux.HandleFunc("/api/uploads", s.withCORS(s.handleUploads))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	addr := ":" + port
	log.Printf("GCSS backend listening on %s", addr)
	log.Printf("CORS origins: %s", corsOrigins)
	log.Printf("Data file: %s", dataFile)
	log.Printf("DB path: %s", dbPath)
	log.Printf("Upload dir: %s", uploadDir)

	// Basic timeouts for safety.
	h := http.TimeoutHandler(mux, 15*time.Second, `{"error":"timeout"}`)
	srv := &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server error: %v", err)
	}
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"name":    "gcss-backend",
		"status":  "ok",
		"healthz": "/healthz",
		"api": map[string]string{
			"contact":            "/api/contact",
			"payment_request":    "/api/requests/payment",
			"language_request":   "/api/requests/language",
			"auth_register":      "/api/auth/register",
			"auth_login":         "/api/auth/login",
			"auth_me":            "/api/auth/me",
			"auth_logout":        "/api/auth/logout",
			"auth_reset_request": "/api/auth/password/request-reset",
			"auth_reset":         "/api/auth/password/reset",
			"auth_profile":       "/api/auth/profile",
			"auth_change_pw":     "/api/auth/password/change",
			"user_dashboard":     "/api/user/dashboard",
			"admin_overview":     "/api/admin/overview",
			"blog_posts":         "/api/blog/posts",
			"blog_post":          "/api/blog/posts/{slug}",
			"forum_categories":   "/api/forum/categories",
			"forum_topics":       "/api/forum/topics?category={slug}",
			"forum_topic":        "/api/forum/topics/{categorySlug}/{topicSlug}",
			"forum_replies":      "/api/forum/topics/{categorySlug}/{topicSlug}/replies",
		},
	})
}

func (s *server) handleContact(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	var req ContactRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Minimal validation
	if strings.TrimSpace(req.FirstName) == "" || strings.TrimSpace(req.LastName) == "" || strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Phone) == "" || strings.TrimSpace(req.Country) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing required fields"})
		return
	}

	if err := s.appendRecord(r, "contact", req); err != nil {
		log.Printf("append record failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store request"})
		return
	}

	writeJSON(w, http.StatusAccepted, map[string]string{"status": "received"})
}

func (s *server) handlePaymentRequest(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	var req PaymentRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Method) == "" || strings.TrimSpace(req.Country) == "" || strings.TrimSpace(req.Email) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing required fields"})
		return
	}

	if err := s.appendRecord(r, "payment_request", req); err != nil {
		log.Printf("append record failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store request"})
		return
	}

	writeJSON(w, http.StatusAccepted, map[string]string{"status": "received"})
}

func (s *server) handleLanguageRequest(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	var req LanguageRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing required fields"})
		return
	}

	if err := s.appendRecord(r, "language_request", req); err != nil {
		log.Printf("append record failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store request"})
		return
	}

	writeJSON(w, http.StatusAccepted, map[string]string{"status": "received"})
}

func (s *server) appendRecord(r *http.Request, typ string, payload interface{}) error {
	rec := StoredRecord{
		Type:      typ,
		CreatedAt: time.Now().UTC(),
		IP:        clientIP(r),
		UA:        r.UserAgent(),
		Payload:   payload,
	}
	// Primary storage: SQLite
	if s.store != nil {
		if err := s.store.InsertFormRequest(r.Context(), rec.Type, rec.CreatedAt, rec.IP, rec.UA, payload); err != nil {
			return err
		}
	}

	// Secondary storage: JSONL file (useful as a simple audit log)
	f, err := os.OpenFile(s.dataFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	bw := bufio.NewWriter(f)
	defer bw.Flush()

	b, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	_, err = bw.Write(append(b, '\n'))
	return err
}

func (s *server) withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if s.allowAnyOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
			} else {
				if _, ok := s.allowedOrigins[origin]; ok {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
				}
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func (s *server) handleAuthRegister(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	if !s.authLimiter.allow(clientIP(r)) {
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many requests, try again later"})
		return
	}

	var req struct {
		Username  string `json:"username"`
		Password  string `json:"password"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Company   string `json:"company"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	// Email format validation
	if !emailRe.MatchString(strings.TrimSpace(req.Email)) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email format"})
		return
	}

	// Username validation (alphanumeric + underscore, 3-30 chars)
	uname := strings.TrimSpace(req.Username)
	if len(uname) < 3 || len(uname) > 30 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username must be 3-30 characters"})
		return
	}

	user, err := s.store.CreateUser(r.Context(), req.Username, req.Email, req.FirstName, req.LastName, req.Phone, req.Company, req.Password)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	sess, err := s.store.CreateSession(r.Context(), user.ID, 30*24*time.Hour)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"user": user, "session": sess})
}

func (s *server) handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	if !s.authLimiter.allow(clientIP(r)) {
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many requests, try again later"})
		return
	}

	var req struct {
		Identifier string `json:"identifier"`
		Password   string `json:"password"`
		Captcha    *captchaRequest `json:"captcha,omitempty"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if err := verifyCaptchaIfEnabled(r.Context(), clientIP(r), req.Captcha); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
		return
	}

	user, err := s.store.AuthenticateUser(r.Context(), req.Identifier, req.Password)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, store.ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}
	sess, err := s.store.CreateSession(r.Context(), user.ID, 30*24*time.Hour)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user, "session": sess})
}

type captchaRequest struct {
	Provider string `json:"provider"`
	// Turnstile
	Token string `json:"token,omitempty"`
	// Tencent
	Ticket string `json:"ticket,omitempty"`
	Randstr string `json:"randstr,omitempty"`
}

func verifyCaptchaIfEnabled(ctx context.Context, ip string, captcha *captchaRequest) error {
	mode := strings.ToLower(strings.TrimSpace(getenvDefault("CAPTCHA_PROVIDER", "none")))
	if mode == "" {
		mode = "none"
	}
	if mode == "none" || mode == "off" || mode == "false" || mode == "0" {
		return nil
	}

	// If CAPTCHA is enabled by env, we require proof.
	if captcha == nil || strings.TrimSpace(captcha.Provider) == "" {
		return errors.New("captcha required")
	}
	provider := strings.ToLower(strings.TrimSpace(captcha.Provider))
	if mode != "auto" && provider != mode {
		return errors.New("invalid captcha provider")
	}

	// Keep verification calls bounded.
	ctx, cancel := context.WithTimeout(ctx, 6*time.Second)
	defer cancel()

	switch provider {
	case "turnstile":
		secret := strings.TrimSpace(os.Getenv("TURNSTILE_SECRET_KEY"))
		if secret == "" {
			return errors.New("captcha not configured")
		}
		token := strings.TrimSpace(captcha.Token)
		if token == "" {
			return errors.New("captcha token missing")
		}
		ok, err := verifyTurnstile(ctx, secret, token, ip)
		if err != nil {
			return errors.New("captcha verification failed")
		}
		if !ok {
			return errors.New("captcha verification failed")
		}
		return nil
	case "tencent":
		aid := strings.TrimSpace(os.Getenv("TENCENT_CAPTCHA_APP_ID"))
		secret := strings.TrimSpace(os.Getenv("TENCENT_CAPTCHA_APP_SECRET_KEY"))
		if aid == "" || secret == "" {
			return errors.New("captcha not configured")
		}
		ticket := strings.TrimSpace(captcha.Ticket)
		randstr := strings.TrimSpace(captcha.Randstr)
		if ticket == "" || randstr == "" {
			return errors.New("captcha token missing")
		}
		ok, err := verifyTencentCaptcha(ctx, aid, secret, ticket, randstr, ip)
		if err != nil {
			return errors.New("captcha verification failed")
		}
		if !ok {
			return errors.New("captcha verification failed")
		}
		return nil
	default:
		return errors.New("invalid captcha provider")
	}
}

func verifyTurnstile(ctx context.Context, secret, token, remoteIP string) (bool, error) {
	vals := url.Values{}
	vals.Set("secret", secret)
	vals.Set("response", token)
	if strings.TrimSpace(remoteIP) != "" {
		vals.Set("remoteip", remoteIP)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://challenges.cloudflare.com/turnstile/v0/siteverify", bytes.NewBufferString(vals.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	var out struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return false, err
	}
	return out.Success, nil
}

func verifyTencentCaptcha(ctx context.Context, aid, appSecretKey, ticket, randstr, userIP string) (bool, error) {
	vals := url.Values{}
	vals.Set("aid", aid)
	vals.Set("AppSecretKey", appSecretKey)
	vals.Set("Ticket", ticket)
	vals.Set("Randstr", randstr)
	if strings.TrimSpace(userIP) != "" {
		vals.Set("UserIP", userIP)
	}
	endpoint := "https://ssl.captcha.qq.com/ticket/verify?" + vals.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return false, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	var out struct {
		Response string `json:"response"`
		EvilLevel string `json:"evil_level"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return false, err
	}
	return strings.TrimSpace(out.Response) == "1", nil
}

func (s *server) handleAuthMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	token := bearerToken(r)
	user, err := s.store.GetUserBySessionToken(r.Context(), token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

func (s *server) handleAuthLogout(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}
	token := bearerToken(r)
	_ = s.store.RevokeSession(r.Context(), token)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) handleAuthRequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	if !s.authLimiter.allow(clientIP(r)) {
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many requests, try again later"})
		return
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	code, expiresAt, _, err := s.store.CreatePasswordReset(r.Context(), req.Email, 15*time.Minute)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	resp := map[string]interface{}{"status": "ok", "expiresAt": expiresAt}
	if truthyEnv("AUTH_RETURN_RESET_CODE") && code != "" {
		resp["demoCode"] = code
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *server) handleAuthResetPassword(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}
	var req struct {
		Email       string `json:"email"`
		Code        string `json:"code"`
		NewPassword string `json:"newPassword"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err := s.store.ResetPasswordWithCode(r.Context(), req.Email, req.Code, req.NewPassword); err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, store.ErrInvalidResetCode) {
			status = http.StatusUnauthorized
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// requireAuth extracts the bearer token and returns the authenticated user.
func (s *server) requireAuth(w http.ResponseWriter, r *http.Request) (*store.AuthUser, bool) {
	token := bearerToken(r)
	user, err := s.store.GetUserBySessionToken(r.Context(), token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return nil, false
	}
	return user, true
}

func (s *server) handleAuthUpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	var req struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Phone     string `json:"phone"`
		Company   string `json:"company"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	updated, err := s.store.UpdateUserProfile(r.Context(), user.ID, req.FirstName, req.LastName, req.Phone, req.Company)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": updated})
}

func (s *server) handleAuthChangePassword(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if err := s.store.ChangePassword(r.Context(), user.ID, req.CurrentPassword, req.NewPassword); err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, store.ErrInvalidCredentials) {
			status = http.StatusUnauthorized
		}
		writeJSON(w, status, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) handleUserDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	dashboard, err := s.store.GetUserDashboard(r.Context(), user.ID)
	if err != nil {
		log.Printf("GetUserDashboard error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load dashboard"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user, "dashboard": dashboard})
}

func (s *server) requireAdmin(w http.ResponseWriter, r *http.Request) (*store.AuthUser, bool) {
	token := bearerToken(r)
	user, err := s.store.GetUserBySessionToken(r.Context(), token)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return nil, false
	}
	if strings.ToLower(strings.TrimSpace(user.Role)) != "admin" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return nil, false
	}
	return user, true
}

func (s *server) handleAdminOverview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	overview, err := s.store.GetAdminOverview(r.Context())
	if err != nil {
		log.Printf("GetAdminOverview error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load overview"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"overview": overview})
}

func (s *server) handleAdminBlogPosts(w http.ResponseWriter, r *http.Request) {
	// GET  /api/admin/blog/posts       — list all posts (including drafts)
	// POST /api/admin/blog/posts       — create new post
	if r.Method == http.MethodGet {
		if _, ok := s.requireAdmin(w, r); !ok {
			return
		}
		locale := r.URL.Query().Get("locale")
		if locale == "" {
			locale = "en"
		}
		posts, err := s.store.ListAdminBlogPosts(r.Context(), locale)
		if err != nil {
			log.Printf("ListAdminBlogPosts error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list posts"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"posts": posts})
		return
	}

	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}

	var req struct {
		Locale          string   `json:"locale"`
		Slug            string   `json:"slug"`
		Title           string   `json:"title"`
		Excerpt         string   `json:"excerpt"`
		ContentMD       string   `json:"contentMd"`
		CoverURL        string   `json:"coverUrl"`
		AuthorName      string   `json:"authorName"`
		Tags            []string `json:"tags"`
		Status          string   `json:"status"`
		MetaTitle       string   `json:"metaTitle"`
		MetaDescription string   `json:"metaDescription"`
		SeoKeywords     string   `json:"seoKeywords"`
		SeoSubKeywords  string   `json:"seoSubKeywords"`
		OgImageURL      string   `json:"ogImageUrl"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	bp := store.BlogPost{
		Slug:            req.Slug,
		Title:           req.Title,
		Excerpt:         req.Excerpt,
		ContentMD:       req.ContentMD,
		CoverURL:        req.CoverURL,
		AuthorName:      req.AuthorName,
		Tags:            req.Tags,
		Status:          req.Status,
		MetaTitle:       req.MetaTitle,
		MetaDescription: req.MetaDescription,
		SeoKeywords:     req.SeoKeywords,
		SeoSubKeywords:  req.SeoSubKeywords,
		OgImageURL:      req.OgImageURL,
	}

	created, err := s.store.CreateBlogPost(r.Context(), req.Locale, bp)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"post": created})
}

func (s *server) handleAdminBlogPost(w http.ResponseWriter, r *http.Request) {
	// PUT    /api/admin/blog/posts/{slug} — update post
	// DELETE /api/admin/blog/posts/{slug} — delete post
	slug := strings.TrimPrefix(r.URL.Path, "/api/admin/blog/posts/")
	slug = strings.Trim(slug, "/")
	if slug == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}

	if r.Method == http.MethodDelete {
		if err := s.store.DeleteBlogPost(r.Context(), slug); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
		return
	}

	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var req struct {
		Locale          string   `json:"locale"`
		Slug            string   `json:"slug"`
		Title           string   `json:"title"`
		Excerpt         string   `json:"excerpt"`
		ContentMD       string   `json:"contentMd"`
		CoverURL        string   `json:"coverUrl"`
		AuthorName      string   `json:"authorName"`
		Tags            []string `json:"tags"`
		Status          string   `json:"status"`
		MetaTitle       string   `json:"metaTitle"`
		MetaDescription string   `json:"metaDescription"`
		SeoKeywords     string   `json:"seoKeywords"`
		SeoSubKeywords  string   `json:"seoSubKeywords"`
		OgImageURL      string   `json:"ogImageUrl"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	bp := store.BlogPost{
		Title:           req.Title,
		Excerpt:         req.Excerpt,
		ContentMD:       req.ContentMD,
		CoverURL:        req.CoverURL,
		AuthorName:      req.AuthorName,
		Tags:            req.Tags,
		Status:          req.Status,
		MetaTitle:       req.MetaTitle,
		MetaDescription: req.MetaDescription,
		SeoKeywords:     req.SeoKeywords,
		SeoSubKeywords:  req.SeoSubKeywords,
		OgImageURL:      req.OgImageURL,
	}

	updated, err := s.store.UpdateBlogPost(r.Context(), req.Locale, slug, bp)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"post": updated})
}

// ── Admin: User Management ──────────────────────

func (s *server) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	users, err := s.store.ListUsers(r.Context())
	if err != nil {
		log.Printf("ListUsers error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list users"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}

func (s *server) handleAdminUserAction(w http.ResponseWriter, r *http.Request) {
	// PUT /api/admin/users/{id}/role    — change role
	// PUT /api/admin/users/{id}/disable — disable/enable
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	path = strings.Trim(path, "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	var userID int64
	if _, err := fmt.Sscanf(parts[0], "%d", &userID); err != nil || userID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user id"})
		return
	}

	action := parts[1]

	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	switch action {
	case "role":
		var req struct {
			Role string `json:"role"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := s.store.SetUserRole(r.Context(), userID, req.Role); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})

	case "disable":
		var req struct {
			Disabled bool `json:"disabled"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := s.store.SetUserDisabled(r.Context(), userID, req.Disabled); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})

	default:
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown action"})
	}
}

// ── Admin: Forum Moderation ─────────────────────

func (s *server) handleAdminForumTopics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	locale := r.URL.Query().Get("locale")
	topics, err := s.store.ListAdminForumTopics(r.Context(), locale)
	if err != nil {
		log.Printf("ListAdminForumTopics error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list topics"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"topics": topics})
}

func (s *server) handleAdminForumTopicDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/forum/topics/")
	idStr = strings.Trim(idStr, "/")
	var id int64
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := s.store.DeleteForumTopic(r.Context(), id); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *server) handleAdminForumPostDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/forum/posts/")
	idStr = strings.Trim(idStr, "/")
	var id int64
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := s.store.DeleteForumPost(r.Context(), id); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ── Admin: Audit / Form Requests ────────────────

func (s *server) handleAdminRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	reqType := r.URL.Query().Get("type")
	limit := parseIntDefault(r.URL.Query().Get("limit"), 50)
	records, err := s.store.ListFormRequests(r.Context(), reqType, limit)
	if err != nil {
		log.Printf("ListFormRequests error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list requests"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"requests": records})
}

// ── Admin: app_secrets / settings ──────────────────────────────────────

func (s *server) handleAdminSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	metas, err := s.store.ListAppSecretsMeta(r.Context())
	if err != nil {
		log.Printf("ListAppSecretsMeta error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list settings"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"settings": metas})
}

func (s *server) handleAdminSettingsItem(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimPrefix(r.URL.Path, "/api/admin/settings/")
	key = strings.Trim(key, "/")
	if key == "" || key == "audit" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	admin, ok := s.requireAdmin(w, r)
	if !ok {
		return
	}
	ip := clientIP(r)
	ua := r.Header.Get("User-Agent")

	switch r.Method {
	case http.MethodPut, http.MethodPost:
		var req struct {
			Value string `json:"value"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := s.store.SetAppSecret(r.Context(), key, req.Value, admin.ID, ip, ua); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
		return
	case http.MethodDelete:
		if err := s.store.DeleteAppSecret(r.Context(), key, admin.ID, ip, ua); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "cleared"})
		return
	}
	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
}

func (s *server) handleAdminSettingsAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	limit := parseIntDefault(r.URL.Query().Get("limit"), 50)
	entries, err := s.store.ListAppSecretAudit(r.Context(), limit)
	if err != nil {
		log.Printf("ListAppSecretAudit error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list audit"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"audit": entries})
}

// ── Public config (publishable keys only) ──────────────────────────────

func (s *server) handlePublicConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	cfg, err := s.store.GetPublicConfig(r.Context())
	if err != nil {
		log.Printf("GetPublicConfig error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load config"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"config": cfg})
}

// ── Email change flow ──────────────────────────────────────────────────

func (s *server) handleAuthEmailChangeRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	var req struct {
		NewEmail string `json:"newEmail"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	code, expiresAt, err := s.store.RequestEmailChange(r.Context(), user.ID, req.NewEmail, 30*time.Minute)
	if err != nil {
		if errors.Is(err, store.ErrEmailInUse) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "email already in use"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	// In production the code is delivered via email. Until SMTP secrets are
	// configured, include the code in the response when explicitly enabled.
	payload := map[string]interface{}{"status": "sent", "expiresAt": expiresAt}
	if truthyEnv("AUTH_RETURN_RESET_CODE") {
		payload["code"] = code
	}
	writeJSON(w, http.StatusOK, payload)
}

func (s *server) handleAuthEmailChangeConfirm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	var req struct {
		Code string `json:"code"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err := s.store.ConfirmEmailChange(r.Context(), user.ID, req.Code); err != nil {
		if errors.Is(err, store.ErrEmailInUse) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "email already in use"})
			return
		}
		if errors.Is(err, store.ErrInvalidResetCode) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid or expired code"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func bearerToken(r *http.Request) string {
	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func truthyEnv(key string) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	switch v {
	case "1", "true", "yes", "y", "on":
		return true
	default:
		return false
	}
}

func (s *server) handleBlogPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	locale := r.URL.Query().Get("locale")
	tag := r.URL.Query().Get("tag")
	limit := parseIntDefault(r.URL.Query().Get("limit"), 20)

	posts, err := s.store.ListBlogPosts(r.Context(), locale, tag, limit)
	if err != nil {
		log.Printf("ListBlogPosts error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list posts"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"posts": posts})
}

func (s *server) handleBlogPost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	slug := strings.TrimPrefix(r.URL.Path, "/api/blog/posts/")
	slug = strings.Trim(slug, "/")
	if slug == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	locale := r.URL.Query().Get("locale")

	post, err := s.store.GetBlogPost(r.Context(), locale, slug)
	if err != nil {
		log.Printf("GetBlogPost error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load post"})
		return
	}
	if post == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (s *server) handleForumCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	locale := r.URL.Query().Get("locale")
	cats, err := s.store.ListForumCategories(r.Context(), locale)
	if err != nil {
		log.Printf("ListForumCategories error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list categories"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"categories": cats})
}

func (s *server) handleForumTopics(w http.ResponseWriter, r *http.Request) {
	// Routes:
	// - GET  /api/forum/topics?locale=&category=&q=&sort=&limit=
	// - POST /api/forum/topics
	if r.Method == http.MethodGet {
		locale := r.URL.Query().Get("locale")
		category := r.URL.Query().Get("category")
		q := r.URL.Query().Get("q")
		sort := r.URL.Query().Get("sort")
		limit := parseIntDefault(r.URL.Query().Get("limit"), 20)

		topics, err := s.store.ListForumTopics(r.Context(), locale, category, q, sort, limit)
		if err != nil {
			log.Printf("ListForumTopics error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list topics"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"topics": topics})
		return
	}

	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	var req struct {
		Locale     string   `json:"locale"`
		Category   string   `json:"categorySlug"`
		Title      string   `json:"title"`
		BodyMD     string   `json:"bodyMd"`
		TopicType  string   `json:"topicType"`
		Tags       []string `json:"tags"`
		AuthorName string   `json:"authorName"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	authorName := strings.TrimSpace(req.AuthorName)
	if token := bearerToken(r); token != "" {
		if u, err := s.store.GetUserBySessionToken(r.Context(), token); err == nil && u != nil {
			authorName = u.Username
		}
	}

	topic, err := s.store.CreateForumTopic(r.Context(), req.Locale, req.Category, req.Title, req.BodyMD, req.TopicType, authorName, req.Tags)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if topic == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]interface{}{"status": "received", "topic": topic})
}

func (s *server) handleForumTopicRoutes(w http.ResponseWriter, r *http.Request) {
	// Routes:
	// - GET  /api/forum/topics/{categorySlug}/{topicSlug}
	// - POST /api/forum/topics/{categorySlug}/{topicSlug}/replies
	path := strings.TrimPrefix(r.URL.Path, "/api/forum/topics/")
	path = strings.Trim(path, "/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	categorySlug := parts[0]
	topicSlug := parts[1]
	locale := r.URL.Query().Get("locale")

	if len(parts) == 2 {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		topic, posts, err := s.store.GetForumTopic(r.Context(), locale, categorySlug, topicSlug)
		if err != nil {
			log.Printf("GetForumTopic error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load topic"})
			return
		}
		if topic == nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		resp := map[string]interface{}{"topic": topic, "posts": posts}
		// Include user's votes if authenticated
		if token := bearerToken(r); token != "" {
			if u, err := s.store.GetUserBySessionToken(r.Context(), token); err == nil && u != nil {
				postIDs := make([]int64, len(posts))
				for i, p := range posts {
					postIDs[i] = p.ID
				}
				if votes, err := s.store.GetUserVotes(r.Context(), u.ID, postIDs); err == nil {
					resp["userVotes"] = votes
				}
			}
		}
		writeJSON(w, http.StatusOK, resp)
		return
	}

	if len(parts) == 3 && parts[2] == "replies" {
		if !methodOrOptions(w, r, http.MethodPost) {
			return
		}
		var req struct {
			AuthorName string `json:"authorName"`
			BodyMD     string `json:"bodyMd"`
			ParentID   *int64 `json:"parentId"`
			Locale     string `json:"locale,omitempty"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		useLocale := locale
		if strings.TrimSpace(req.Locale) != "" {
			useLocale = req.Locale
		}

		authorName := strings.TrimSpace(req.AuthorName)
		if token := bearerToken(r); token != "" {
			if u, err := s.store.GetUserBySessionToken(r.Context(), token); err == nil && u != nil {
				authorName = u.Username
			}
		}

		post, err := s.store.AddForumReply(r.Context(), useLocale, categorySlug, topicSlug, authorName, req.BodyMD, req.ParentID)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if post == nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
			return
		}
		writeJSON(w, http.StatusAccepted, map[string]interface{}{"status": "received", "post": post})
		return
	}

	writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func (s *server) handleForumPostRoutes(w http.ResponseWriter, r *http.Request) {
	// Routes:
	// - POST /api/forum/posts/{postId}/vote
	path := strings.TrimPrefix(r.URL.Path, "/api/forum/posts/")
	path = strings.Trim(path, "/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 || parts[1] != "vote" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	var postID int64
	if _, err := fmt.Sscanf(parts[0], "%d", &postID); err != nil || postID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid post id"})
		return
	}

	var req struct {
		Delta int `json:"delta"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if req.Delta != 1 && req.Delta != -1 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "delta must be 1 or -1"})
		return
	}

	// Require auth for voting
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}

	likeCount, userVote, found, err := s.store.VoteForumPost(r.Context(), user.ID, postID, req.Delta)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if !found {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ok", "likeCount": likeCount, "userVote": userVote})
}

func (s *server) handleUploads(w http.ResponseWriter, r *http.Request) {
	if !methodOrOptions(w, r, http.MethodPost) {
		return
	}

	ct := strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type")))
	if !strings.HasPrefix(ct, "multipart/form-data") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "expected multipart/form-data"})
		return
	}

	// Require auth for uploads
	if _, ok := s.requireAuth(w, r); !ok {
		return
	}

	// 25MB max payload.
	r.Body = http.MaxBytesReader(w, r.Body, 25<<20)
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid multipart form"})
		return
	}

	f, fh, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing file"})
		return
	}
	defer func() { _ = f.Close() }()

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	switch ext {
	case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm":
		// ok
	default:
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported file type"})
		return
	}

	name := fmt.Sprintf("%d%s", time.Now().UTC().UnixNano(), ext)
	path := filepath.Join(s.uploadDir, name)
	out, err := os.Create(path)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store upload"})
		return
	}
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, f); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to write upload"})
		return
	}

	// Return relative URL so it works behind any proxy/domain
	uploadURL := "/uploads/" + name
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "url": uploadURL})
}

func decodeJSON(r *http.Request, dst interface{}) error {
	// Limit body size (1MB) to avoid abuse.
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return fmt.Errorf("invalid json: %w", err)
	}
	// Ensure no trailing junk
	var extra interface{}
	if err := dec.Decode(&extra); err != io.EOF {
		if err == nil {
			return errors.New("invalid json: multiple values")
		}
		return errors.New("invalid json: trailing data")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func methodOrOptions(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return false
	}
	if subtle.ConstantTimeCompare([]byte(r.Method), []byte(method)) != 1 {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return false
	}
	return true
}

func getenvDefault(key, def string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	return v
}

func ensureParentDir(filePath string) error {
	dir := filepath.Dir(filePath)
	if dir == "." {
		return nil
	}
	return os.MkdirAll(dir, 0755)
}

func parseOrigins(csv string) (map[string]struct{}, bool) {
	m := map[string]struct{}{}
	parts := strings.Split(csv, ",")
	for _, p := range parts {
		o := strings.TrimSpace(p)
		if o == "" {
			continue
		}
		if o == "*" {
			return m, true
		}
		m[o] = struct{}{}
	}
	return m, false
}

func clientIP(r *http.Request) string {
	// If behind a trusted proxy, you can extend this to use X-Forwarded-For.
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	if ip := net.ParseIP(r.RemoteAddr); ip != nil {
		return r.RemoteAddr
	}
	return ""
}

func parseIntDefault(s string, def int) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return def
	}
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	if err != nil {
		return def
	}
	return n
}
