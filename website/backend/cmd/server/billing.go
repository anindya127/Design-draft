package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"gcss-backend/internal/payments"
	"gcss-backend/internal/store"
)

// ── Public catalog ─────────────────────────────────────────────────────

func (s *server) handlePublicCatalog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	ctx := r.Context()
	cycles, err := s.store.ListBillingCycles(ctx, true)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	supports, err := s.store.ListSupportTiers(ctx, true)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	servers, err := s.store.ListServerTiers(ctx, true)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"billingCycles": cycles,
		"supportTiers":  supports,
		"serverTiers":   servers,
	})
}

// ── Admin catalog CRUD ─────────────────────────────────────────────────

func (s *server) handleAdminBillingCycles(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListBillingCycles(ctx, false)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
	case http.MethodPost:
		var b store.BillingCycle
		if err := decodeJSON(r, &b); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		saved, err := s.store.UpsertBillingCycle(ctx, b)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminBillingCycleItem(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/products/billing-cycles/")
	idStr = strings.Trim(idStr, "/")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	if id <= 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodPut, http.MethodPost:
		var b store.BillingCycle
		if err := decodeJSON(r, &b); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		b.ID = id
		saved, err := s.store.UpsertBillingCycle(ctx, b)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	case http.MethodDelete:
		if err := s.store.DeleteBillingCycle(ctx, id); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminSupportTiers(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListSupportTiers(ctx, false)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
	case http.MethodPost:
		var t store.SupportTier
		if err := decodeJSON(r, &t); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		saved, err := s.store.UpsertSupportTier(ctx, t)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminSupportTierItem(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/products/support-tiers/")
	idStr = strings.Trim(idStr, "/")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	if id <= 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodPut, http.MethodPost:
		var t store.SupportTier
		if err := decodeJSON(r, &t); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		t.ID = id
		saved, err := s.store.UpsertSupportTier(ctx, t)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	case http.MethodDelete:
		if err := s.store.DeleteSupportTier(ctx, id); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminServerTiers(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListServerTiers(ctx, false)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
	case http.MethodPost:
		var t store.ServerTier
		if err := decodeJSON(r, &t); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		saved, err := s.store.UpsertServerTier(ctx, t)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminServerTierItem(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/products/server-tiers/")
	idStr = strings.Trim(idStr, "/")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	if id <= 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodPut, http.MethodPost:
		var t store.ServerTier
		if err := decodeJSON(r, &t); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		t.ID = id
		saved, err := s.store.UpsertServerTier(ctx, t)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	case http.MethodDelete:
		if err := s.store.DeleteServerTier(ctx, id); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

// ── Promo codes ────────────────────────────────────────────────────────

func (s *server) handleAdminPromoCodes(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListPromoCodes(ctx)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
	case http.MethodPost:
		var p store.PromoCode
		if err := decodeJSON(r, &p); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		saved, err := s.store.UpsertPromoCode(ctx, p)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handleAdminPromoCodeItem(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/promo-codes/")
	idStr = strings.Trim(idStr, "/")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	if id <= 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()
	switch r.Method {
	case http.MethodPut, http.MethodPost:
		var p store.PromoCode
		if err := decodeJSON(r, &p); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		p.ID = id
		saved, err := s.store.UpsertPromoCode(ctx, p)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"item": saved})
	case http.MethodDelete:
		if err := s.store.DeletePromoCode(ctx, id); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
	}
}

func (s *server) handlePromoApply(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	var req struct {
		Code string `json:"code"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	p, err := s.store.FindValidPromoCode(r.Context(), req.Code)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"code":          p.Code,
		"discountType":  p.DiscountType,
		"discountValue": p.DiscountValue,
	})
}

// ── Checkout ───────────────────────────────────────────────────────────

type checkoutRequest struct {
	BillingCycleID int64                  `json:"billingCycleId"`
	SupportTierID  int64                  `json:"supportTierId"`
	ServerTierID   int64                  `json:"serverTierId"`
	SupportDays    int                    `json:"supportDays"` // for per_day pricing
	PromoCode      string                 `json:"promoCode"`
	BillingAddress map[string]interface{} `json:"billingAddress"`
	Provider       string                 `json:"provider"` // stripe | pingxx | paypal
	SuccessURL     string                 `json:"successUrl"`
	CancelURL      string                 `json:"cancelUrl"`
}

func (s *server) handleCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	ctx := r.Context()

	var req checkoutRequest
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if req.Provider == "" {
		req.Provider = "stripe"
	}
	if req.SuccessURL == "" || req.CancelURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "successUrl and cancelUrl are required"})
		return
	}

	// Load catalog items for pricing.
	cycles, _ := s.store.ListBillingCycles(ctx, true)
	supports, _ := s.store.ListSupportTiers(ctx, true)
	servers, _ := s.store.ListServerTiers(ctx, true)

	var billingCycle *store.BillingCycle
	for i := range cycles {
		if cycles[i].ID == req.BillingCycleID {
			billingCycle = &cycles[i]
			break
		}
	}
	var supportTier *store.SupportTier
	for i := range supports {
		if supports[i].ID == req.SupportTierID {
			supportTier = &supports[i]
			break
		}
	}
	var serverTier *store.ServerTier
	for i := range servers {
		if servers[i].ID == req.ServerTierID {
			serverTier = &servers[i]
			break
		}
	}
	if billingCycle == nil || serverTier == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid billing cycle or server tier"})
		return
	}

	// Compute subtotal. Server-authoritative — never trust client prices.
	subtotal := serverTier.PriceCents
	if supportTier != nil {
		switch supportTier.PricingType {
		case "per_day":
			days := req.SupportDays
			if days <= 0 {
				days = billingCycle.Years * 365
			}
			subtotal += supportTier.PriceCents * int64(days)
		default:
			subtotal += supportTier.PriceCents
		}
	}
	// Apply billing cycle multiplier (e.g. multi-year discounts).
	subtotal = int64(float64(subtotal*int64(billingCycle.Years)) * billingCycle.Multiplier)

	// Apply promo code.
	discount := int64(0)
	var promoCodeID *int64
	if strings.TrimSpace(req.PromoCode) != "" {
		p, err := s.store.FindValidPromoCode(ctx, req.PromoCode)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if p.DiscountType == "percent" {
			discount = subtotal * p.DiscountValue / 100
		} else {
			discount = p.DiscountValue
		}
		if discount > subtotal {
			discount = subtotal
		}
		id := p.ID
		promoCodeID = &id
	}
	total := subtotal - discount
	if total < 50 {
		// Stripe minimum charge is $0.50 USD
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "total amount is below minimum"})
		return
	}

	// Build product label.
	var labelParts []string
	labelParts = append(labelParts, serverTier.LabelEN)
	if supportTier != nil && supportTier.PriceCents > 0 {
		labelParts = append(labelParts, supportTier.LabelEN)
	}
	labelParts = append(labelParts, billingCycle.LabelEN)
	productLabel := strings.Join(labelParts, " + ")

	// Serialize billing address.
	billingAddr, _ := json.Marshal(req.BillingAddress)
	if billingAddr == nil {
		billingAddr = []byte("{}")
	}

	// Create order record.
	bcID, stID, srvID := billingCycle.ID, int64(0), serverTier.ID
	var stPtr *int64
	if supportTier != nil {
		stID = supportTier.ID
		stPtr = &stID
	}
	order, err := s.store.CreateOrder(ctx, store.NewOrderInput{
		UserID:             user.ID,
		BillingCycleID:     &bcID,
		SupportTierID:      stPtr,
		ServerTierID:       &srvID,
		PromoCodeID:        promoCodeID,
		ProductLabel:       productLabel,
		SubtotalCents:      subtotal,
		DiscountCents:      discount,
		TotalCents:         total,
		Currency:           "USD",
		BillingAddressJSON: string(billingAddr),
		Provider:           req.Provider,
	})
	if err != nil {
		log.Printf("CreateOrder error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create order"})
		return
	}

	// Dispatch to provider.
	switch req.Provider {
	case "stripe":
		s.createStripeCheckout(w, r, order, productLabel, total, req)
		return
	case "paypal":
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "paypal integration coming in phase 3"})
		return
	case "pingxx":
		writeJSON(w, http.StatusNotImplemented, map[string]string{"error": "pingxx integration coming in phase 3"})
		return
	default:
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported provider"})
	}
}

func (s *server) createStripeCheckout(w http.ResponseWriter, r *http.Request, order *store.Order, productLabel string, total int64, req checkoutRequest) {
	ctx := r.Context()
	secretKey, err := s.store.GetAppSecret(ctx, "STRIPE_SECRET_KEY")
	if err != nil || secretKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "billing_not_configured", "message": "Stripe is not configured. Admin must set STRIPE_SECRET_KEY in /admin/settings."})
		return
	}

	client := payments.NewStripeClient(secretKey)
	sess, err := client.CreateCheckoutSession(ctx, payments.CreateCheckoutSessionInput{
		SuccessURL:        req.SuccessURL + "?order=" + order.OrderNumber + "&session_id={CHECKOUT_SESSION_ID}",
		CancelURL:         req.CancelURL + "?order=" + order.OrderNumber,
		ClientReferenceID: order.OrderNumber,
		LineItems: []payments.StripeCheckoutLineItem{
			{
				Name:        productLabel,
				Description: fmt.Sprintf("GCSS order %s", order.OrderNumber),
				AmountCents: total,
				Currency:    "usd",
				Quantity:    1,
			},
		},
		Metadata: map[string]string{
			"order_id":     strconv.FormatInt(order.ID, 10),
			"order_number": order.OrderNumber,
			"user_id":      strconv.FormatInt(order.UserID, 10),
		},
	})
	if err != nil {
		log.Printf("Stripe checkout error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "failed to create checkout session", "message": err.Error()})
		return
	}

	if err := s.store.SetOrderProviderSession(ctx, order.ID, sess.ID); err != nil {
		log.Printf("SetOrderProviderSession error: %v", err)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"url":         sess.URL,
		"sessionId":   sess.ID,
		"orderNumber": order.OrderNumber,
	})
}

// ── Stripe webhook ─────────────────────────────────────────────────────

func (s *server) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	ctx := r.Context()

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1MB limit
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
		return
	}

	secret, err := s.store.GetAppSecret(ctx, "STRIPE_WEBHOOK_SECRET")
	if err != nil || secret == "" {
		log.Printf("Stripe webhook rejected: STRIPE_WEBHOOK_SECRET not configured")
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "webhook_secret_missing"})
		return
	}

	sigHeader := r.Header.Get("Stripe-Signature")
	if err := payments.VerifyStripeSignature(body, sigHeader, secret, 0); err != nil {
		log.Printf("Stripe webhook signature invalid: %v", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
		return
	}

	var event payments.StripeEvent
	if err := json.Unmarshal(body, &event); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to parse event"})
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var sess payments.StripeCheckoutSessionCompleted
		if err := json.Unmarshal(event.Data.Object, &sess); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to parse session"})
			return
		}
		if sess.PaymentStatus != "paid" && sess.PaymentStatus != "no_payment_required" {
			log.Printf("Stripe webhook: session %s not paid (status=%s)", sess.ID, sess.PaymentStatus)
			writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
			return
		}
		order, err := s.store.GetOrderBySession(ctx, sess.ID)
		if err != nil || order == nil {
			log.Printf("Stripe webhook: order not found for session %s", sess.ID)
			writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
			return
		}
		if order.Status == "paid" {
			writeJSON(w, http.StatusOK, map[string]string{"status": "already_paid"})
			return
		}

		// Fetch full session to get hosted_invoice_url.
		secretKey, _ := s.store.GetAppSecret(ctx, "STRIPE_SECRET_KEY")
		hostedURL := ""
		if secretKey != "" && sess.Invoice != "" {
			// Best-effort: not blocking on failure.
			if full, err := payments.NewStripeClient(secretKey).RetrieveCheckoutSession(ctx, sess.ID); err == nil && full != nil {
				// hosted_invoice_url is on the invoice object, not session — skip for now.
				_ = full
			}
		}

		if err := s.store.MarkOrderPaid(ctx, order.ID, sess.PaymentIntent, hostedURL); err != nil {
			log.Printf("MarkOrderPaid error: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to mark paid"})
			return
		}
		log.Printf("Stripe webhook: order %s marked paid", order.OrderNumber)
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	default:
		// Acknowledge but ignore other events.
		writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
	}
}

// ── User-facing: invoices + orders ────────────────────────────────────

func (s *server) handleUserInvoices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	items, err := s.store.ListInvoicesForUser(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invoices": items})
}

func (s *server) handleUserOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	items, err := s.store.ListOrdersForUser(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"orders": items})
}

// ── Lookup by order number (for success page after Stripe redirect) ───

func (s *server) handleOrderByNumber(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	num := strings.TrimPrefix(r.URL.Path, "/api/user/orders/")
	num = strings.Trim(num, "/")
	if num == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	// Find by order_number.
	orders, err := s.store.ListOrdersForUser(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	for _, o := range orders {
		if o.OrderNumber == num {
			writeJSON(w, http.StatusOK, map[string]interface{}{"order": o})
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "order not found"})
}

// guard so "errors" and "strings" import pruning doesn't remove used packages
var _ = errors.New
