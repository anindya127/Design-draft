package main

import (
	"encoding/json"
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
	cycles, err := s.store.ListBillingCycles(ctx, true)
	if err != nil {
		log.Printf("ListBillingCycles error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "catalog_unavailable"})
		return
	}
	supports, err := s.store.ListSupportTiers(ctx, true)
	if err != nil {
		log.Printf("ListSupportTiers error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "catalog_unavailable"})
		return
	}
	servers, err := s.store.ListServerTiers(ctx, true)
	if err != nil {
		log.Printf("ListServerTiers error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "catalog_unavailable"})
		return
	}

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
		s.createPayPalCheckout(w, r, order, productLabel, total, req)
		return
	case "pingxx":
		s.createPingxxCheckout(w, r, order, productLabel, total, req)
		return
	default:
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported provider"})
	}
}

// ── PayPal Orders v2 ───────────────────────────────────────────────────

func (s *server) createPayPalCheckout(w http.ResponseWriter, r *http.Request, order *store.Order, productLabel string, total int64, req checkoutRequest) {
	ctx := r.Context()
	clientID, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_ID")
	clientSecret, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_SECRET")
	env, _ := s.store.GetAppSecret(ctx, "PAYPAL_ENV")
	if clientID == "" || clientSecret == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "billing_not_configured", "message": "PayPal is not configured. Admin must set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in /admin/settings."})
		return
	}

	client := payments.NewPayPalClient(clientID, clientSecret, env)
	ppOrder, err := client.CreateOrder(ctx, payments.PayPalCreateOrderInput{
		AmountCents: total,
		Currency:    "USD",
		InvoiceID:   order.OrderNumber,
		Description: productLabel,
		BrandName:   "GCSS",
		CustomID:    strconv.FormatInt(order.ID, 10),
		// PayPal appends ?token=<orderID>&PayerID=<...> to return_url on
		// approval. The success page reads either ?token= or ?paypal_order=
		// and triggers capture.
		ReturnURL: req.SuccessURL + "?order=" + order.OrderNumber,
		CancelURL: req.CancelURL + "?order=" + order.OrderNumber,
	})
	if err != nil {
		log.Printf("PayPal create order error: %v", err)
		// Raw provider error is logged above; respond with a generic message so we
		// don't leak API keys / internal error codes to the browser.
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error":   "paypal_failed",
			"message": "PayPal couldn't create the order. Please try a different payment method or try again later.",
		})
		return
	}

	// Stash the PayPal order id so the webhook can look up our order.
	if err := s.store.SetOrderProviderSession(ctx, order.ID, ppOrder.ID); err != nil {
		log.Printf("SetOrderProviderSession error: %v", err)
	}

	approveURL := ppOrder.ApproveURL()
	if approveURL == "" {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "PayPal approve URL missing"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"url":         approveURL,
		"sessionId":   ppOrder.ID,
		"orderNumber": order.OrderNumber,
	})
}

// handlePayPalCapture is called by the frontend success page with the PayPal
// order id that the redirect came back with. It captures the funds and marks
// the order paid. This is a defensive path; the webhook is the authoritative
// one, but capture must happen synchronously for a one-step UX.
func (s *server) handlePayPalCapture(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	var req struct {
		PayPalOrderID string `json:"paypalOrderId"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if req.PayPalOrderID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "paypalOrderId required"})
		return
	}
	ctx := r.Context()
	clientID, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_ID")
	clientSecret, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_SECRET")
	env, _ := s.store.GetAppSecret(ctx, "PAYPAL_ENV")
	if clientID == "" || clientSecret == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "billing_not_configured"})
		return
	}

	order, err := s.store.GetOrderBySession(ctx, req.PayPalOrderID)
	if err != nil || order == nil || order.UserID != user.ID {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "order not found"})
		return
	}
	if order.Status == "paid" {
		writeJSON(w, http.StatusOK, map[string]interface{}{"status": "already_paid", "order": order})
		return
	}

	client := payments.NewPayPalClient(clientID, clientSecret, env)
	cap, err := client.CaptureOrder(ctx, req.PayPalOrderID)
	if err != nil {
		log.Printf("PayPal capture error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error":   "capture_failed",
			"message": "We couldn't finalize your PayPal payment. If the funds were charged, contact support with your order number.",
		})
		return
	}
	if cap.Status != "COMPLETED" {
		writeJSON(w, http.StatusAccepted, map[string]interface{}{"status": cap.Status})
		return
	}
	captureID := ""
	if len(cap.PurchaseUnits) > 0 && len(cap.PurchaseUnits[0].Payments.Captures) > 0 {
		captureID = cap.PurchaseUnits[0].Payments.Captures[0].ID
	}
	if err := s.store.MarkOrderPaid(ctx, order.ID, captureID, ""); err != nil {
		log.Printf("MarkOrderPaid error: %v", err)
	}
	updated, _ := s.store.GetOrder(ctx, order.ID)
	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ok", "order": updated})
}

func (s *server) handlePayPalWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	ctx := r.Context()
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
		return
	}

	clientID, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_ID")
	clientSecret, _ := s.store.GetAppSecret(ctx, "PAYPAL_CLIENT_SECRET")
	env, _ := s.store.GetAppSecret(ctx, "PAYPAL_ENV")
	webhookID, _ := s.store.GetAppSecret(ctx, "PAYPAL_WEBHOOK_ID")
	if clientID == "" || webhookID == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "paypal_not_configured"})
		return
	}

	client := payments.NewPayPalClient(clientID, clientSecret, env)
	if err := client.VerifyWebhookSignature(ctx, r.Header, body, webhookID); err != nil {
		log.Printf("PayPal webhook verification failed: %v", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
		return
	}

	var event payments.PayPalEvent
	if err := json.Unmarshal(body, &event); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "parse error"})
		return
	}

	switch event.EventType {
	case "CHECKOUT.ORDER.APPROVED":
		// Customer approved; capture happens from our frontend. Ack.
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	case "PAYMENT.CAPTURE.COMPLETED":
		// This is the authoritative "paid" signal.
		var cap struct {
			ID           string `json:"id"`
			CustomID     string `json:"custom_id"`
			InvoiceID    string `json:"invoice_id"`
			Status       string `json:"status"`
			Links        []struct {
				Href string `json:"href"`
				Rel  string `json:"rel"`
			} `json:"links"`
			SupplementaryData struct {
				RelatedIDs struct {
					OrderID string `json:"order_id"`
				} `json:"related_ids"`
			} `json:"supplementary_data"`
		}
		if err := json.Unmarshal(event.Resource, &cap); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "parse resource"})
			return
		}
		ppOrderID := cap.SupplementaryData.RelatedIDs.OrderID
		if ppOrderID == "" {
			writeJSON(w, http.StatusOK, map[string]string{"status": "missing_order_id"})
			return
		}
		order, err := s.store.GetOrderBySession(ctx, ppOrderID)
		if err != nil || order == nil {
			log.Printf("PayPal webhook: order not found for paypal_order=%s", ppOrderID)
			writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
			return
		}
		if order.Status == "paid" {
			writeJSON(w, http.StatusOK, map[string]string{"status": "already_paid"})
			return
		}
		if err := s.store.MarkOrderPaid(ctx, order.ID, cap.ID, ""); err != nil {
			log.Printf("MarkOrderPaid error: %v", err)
		}
		log.Printf("PayPal webhook: order %s marked paid", order.OrderNumber)
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	default:
		writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
	}
}

// ── Ping++ (Alipay / WeChat Pay) ───────────────────────────────────────

func (s *server) createPingxxCheckout(w http.ResponseWriter, r *http.Request, order *store.Order, productLabel string, total int64, req checkoutRequest) {
	ctx := r.Context()
	appID, _ := s.store.GetAppSecret(ctx, "PINGXX_APP_ID")
	secretKey, _ := s.store.GetAppSecret(ctx, "PINGXX_SECRET_KEY")
	privateKey, _ := s.store.GetAppSecret(ctx, "PINGXX_PRIVATE_KEY")
	rateStr, _ := s.store.GetAppSecret(ctx, "PINGXX_USD_TO_CNY_RATE")
	if appID == "" || secretKey == "" || privateKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error":   "billing_not_configured",
			"message": "Ping++ is not configured. Admin must set PINGXX_APP_ID, PINGXX_SECRET_KEY, PINGXX_PRIVATE_KEY, and PINGXX_USD_TO_CNY_RATE in /admin/settings.",
		})
		return
	}

	// Ping++ charge amounts for Alipay / WeChat Pay are in CNY fen.
	// Our catalog is priced in USD cents; convert using the admin-configured
	// rate before sending. Refuse to charge if rate is not configured — this
	// prevents silently under-charging (e.g. $100 USD → 10000 fen = ¥100 ≈ $14).
	rate, parseErr := strconv.ParseFloat(strings.TrimSpace(rateStr), 64)
	if parseErr != nil || rate <= 0 {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error":   "billing_not_configured",
			"message": "Ping++ requires an admin-configured USD→CNY conversion rate. Set PINGXX_USD_TO_CNY_RATE in /admin/settings (e.g. \"7.2\").",
		})
		return
	}
	// total is USD cents. Convert to CNY fen: (USD dollars) * rate * 100 = fen.
	totalCNYFen := int64(float64(total) * rate)
	if totalCNYFen <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "amount_too_small"})
		return
	}

	// For web desktop checkout we use alipay_pc_direct by default.
	channel := "alipay_pc_direct"

	client, err := payments.NewPingxxClient(appID, secretKey, privateKey)
	if err != nil {
		log.Printf("Pingxx init failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   "pingxx_init_failed",
			"message": "Ping++ could not be initialized. Please contact support.",
		})
		return
	}
	extra := map[string]interface{}{
		"success_url": req.SuccessURL + "?order=" + order.OrderNumber,
	}

	charge, err := client.CreateCharge(ctx, payments.PingxxCreateChargeInput{
		OrderNo:     order.OrderNumber,
		AmountCents: totalCNYFen,
		Currency:    "cny",
		Channel:     channel,
		Subject:     productLabel,
		Body:        fmt.Sprintf("GCSS order %s", order.OrderNumber),
		ClientIP:    clientIP(r),
		Metadata: map[string]string{
			"order_id":     strconv.FormatInt(order.ID, 10),
			"order_number": order.OrderNumber,
		},
		Extra: extra,
	})
	if err != nil {
		log.Printf("Pingxx charge error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error":   "pingxx_charge_failed",
			"message": "Ping++ couldn't create the charge. Please try a different payment method or try again later.",
		})
		return
	}

	if err := s.store.SetOrderProviderSession(ctx, order.ID, charge.ID); err != nil {
		log.Printf("SetOrderProviderSession error: %v", err)
	}

	// For alipay_pc_direct the credential is typically a string URL but
	// some SDK versions return { url } object — handle both.
	redirectURL := ""
	if charge.Credential != nil {
		switch v := charge.Credential["alipay_pc_direct"].(type) {
		case string:
			redirectURL = v
		case map[string]interface{}:
			if u, ok := v["url"].(string); ok {
				redirectURL = u
			}
		}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"url":         redirectURL,
		"sessionId":   charge.ID,
		"orderNumber": order.OrderNumber,
		"credential":  charge.Credential,
		"channel":     channel,
	})
}

func (s *server) handlePingxxWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	ctx := r.Context()
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "read error"})
		return
	}
	// Ping++ publishes a PEM RSA public key for webhook verification.
	// Admins paste it into the PINGXX_WEBHOOK_PUBLIC_KEY slot.
	pubKey, _ := s.store.GetAppSecret(ctx, "PINGXX_WEBHOOK_PUBLIC_KEY")
	sig := r.Header.Get("X-Pingplusplus-Signature")
	if pubKey == "" || sig == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "webhook_not_configured"})
		return
	}
	if err := payments.VerifyPingxxWebhookSignature(body, sig, pubKey); err != nil {
		log.Printf("Pingxx webhook verification failed: %v", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
		return
	}

	var event payments.PingxxEvent
	if err := json.Unmarshal(body, &event); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "parse error"})
		return
	}
	if event.Type != "charge.succeeded" {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
		return
	}
	var charge payments.PingxxCharge
	if err := json.Unmarshal(event.Data.Object, &charge); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "parse resource"})
		return
	}
	if !charge.Paid {
		writeJSON(w, http.StatusOK, map[string]string{"status": "not_paid"})
		return
	}
	order, err := s.store.GetOrderBySession(ctx, charge.ID)
	if err != nil || order == nil {
		log.Printf("Pingxx webhook: order not found for charge=%s", charge.ID)
		writeJSON(w, http.StatusOK, map[string]string{"status": "ignored"})
		return
	}
	if order.Status == "paid" {
		writeJSON(w, http.StatusOK, map[string]string{"status": "already_paid"})
		return
	}
	if err := s.store.MarkOrderPaid(ctx, order.ID, charge.ID, ""); err != nil {
		log.Printf("MarkOrderPaid error: %v", err)
	}
	log.Printf("Pingxx webhook: order %s marked paid", order.OrderNumber)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
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
		writeJSON(w, http.StatusBadGateway, map[string]string{
			"error":   "stripe_failed",
			"message": "Stripe couldn't create the checkout session. Please try a different payment method or try again later.",
		})
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

		// Fetch Stripe invoice to persist the hosted URL and invoice ID
		// so the user-facing "View invoice" link works.
		secretKey, _ := s.store.GetAppSecret(ctx, "STRIPE_SECRET_KEY")
		hostedURL := ""
		stripeInvoiceID := sess.Invoice
		if secretKey != "" && sess.Invoice != "" {
			if inv, invErr := payments.NewStripeClient(secretKey).RetrieveInvoice(ctx, sess.Invoice); invErr == nil && inv != nil {
				hostedURL = inv.HostedInvoiceURL
				stripeInvoiceID = inv.ID
			} else if invErr != nil {
				log.Printf("Stripe retrieve invoice failed (non-fatal): %v", invErr)
			}
		}

		if err := s.store.MarkOrderPaidWith(ctx, order.ID, store.MarkPaidInput{
			ProviderPaymentID: sess.PaymentIntent,
			ProviderInvoiceID: stripeInvoiceID,
			HostedInvoiceURL:  hostedURL,
		}); err != nil {
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
	order, err := s.store.GetOrderByNumberForUser(r.Context(), user.ID, num)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if order == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "order not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"order": order})
}

// ── Admin: order management ────────────────────────────────────────────

func (s *server) handleAdminOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	limit := parseIntDefault(r.URL.Query().Get("limit"), 100)
	items, err := s.store.ListAllOrders(r.Context(), limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"orders":       items,
		"orderStages":  store.OrderStages,
		"serverStages": store.ServerStages,
	})
}

func (s *server) handleAdminOrderItem(w http.ResponseWriter, r *http.Request) {
	// PUT /api/admin/orders/{id}/stage
	// POST /api/admin/orders/{id}/mark-paid
	rest := strings.TrimPrefix(r.URL.Path, "/api/admin/orders/")
	rest = strings.Trim(rest, "/")
	parts := strings.Split(rest, "/")
	if len(parts) < 2 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	idStr, action := parts[0], parts[1]
	id, _ := strconv.ParseInt(idStr, 10, 64)
	if id <= 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if _, ok := s.requireAdmin(w, r); !ok {
		return
	}
	ctx := r.Context()

	switch action {
	case "stage":
		if r.Method != http.MethodPut && r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		var req struct {
			OrderStage  string `json:"orderStage"`
			ServerStage string `json:"serverStage"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := s.store.UpdateOrderStages(ctx, id, req.OrderStage, req.ServerStage); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		order, _ := s.store.GetOrder(ctx, id)
		writeJSON(w, http.StatusOK, map[string]interface{}{"order": order})
	case "mark-paid":
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		if err := s.store.AdminMarkOrderPaid(ctx, id); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		order, _ := s.store.GetOrder(ctx, id)
		writeJSON(w, http.StatusOK, map[string]interface{}{"order": order})
	default:
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown action"})
	}
}

// ── User-facing: invoice by number for the print view ──────────────────

func (s *server) handleUserInvoiceByNumber(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}
	user, ok := s.requireAuth(w, r)
	if !ok {
		return
	}
	num := strings.TrimPrefix(r.URL.Path, "/api/user/invoices/")
	num = strings.Trim(num, "/")
	if num == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	inv, err := s.store.GetInvoiceByNumberForUser(r.Context(), user.ID, num)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if inv == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "invoice not found"})
		return
	}
	// Also attach the backing order for full display.
	var order *store.Order
	if inv.OrderID != nil {
		order, _ = s.store.GetOrder(r.Context(), *inv.OrderID)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invoice": inv, "order": order, "user": user})
}

