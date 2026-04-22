// Package payments provides thin clients for the payment gateways GCSS
// supports. We deliberately use the raw REST APIs instead of vendor SDKs to
// keep the binary small and the integration transparent.
package payments

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// ── Stripe ─────────────────────────────────────────────────────────────

const stripeBaseURL = "https://api.stripe.com/v1"

type StripeClient struct {
	secretKey string
	http      *http.Client
}

func NewStripeClient(secretKey string) *StripeClient {
	return &StripeClient{
		secretKey: secretKey,
		http:      &http.Client{Timeout: 30 * time.Second},
	}
}

type StripeCheckoutLineItem struct {
	Name        string
	Description string
	AmountCents int64
	Currency    string
	Quantity    int
}

type CreateCheckoutSessionInput struct {
	SuccessURL   string
	CancelURL    string
	CustomerEmail string
	ClientReferenceID string // our order ID
	LineItems    []StripeCheckoutLineItem
	Metadata     map[string]string
}

type StripeCheckoutSession struct {
	ID            string `json:"id"`
	URL           string `json:"url"`
	PaymentStatus string `json:"payment_status"`
	Status        string `json:"status"`
	PaymentIntent string `json:"payment_intent"`
	AmountTotal   int64  `json:"amount_total"`
	Currency      string `json:"currency"`
}

// CreateCheckoutSession creates a Stripe Checkout Session using the classic
// `price_data` inline-price mode so we don't need pre-registered SKUs.
// Mode is "payment" — one-time charge. For subscriptions, add mode=subscription.
func (c *StripeClient) CreateCheckoutSession(ctx context.Context, in CreateCheckoutSessionInput) (*StripeCheckoutSession, error) {
	if c.secretKey == "" {
		return nil, errors.New("stripe: secret key not configured")
	}
	if in.SuccessURL == "" || in.CancelURL == "" {
		return nil, errors.New("stripe: success_url and cancel_url are required")
	}
	if len(in.LineItems) == 0 {
		return nil, errors.New("stripe: at least one line item is required")
	}

	form := url.Values{}
	form.Set("mode", "payment")
	form.Set("success_url", in.SuccessURL)
	form.Set("cancel_url", in.CancelURL)
	if in.CustomerEmail != "" {
		form.Set("customer_email", in.CustomerEmail)
	}
	if in.ClientReferenceID != "" {
		form.Set("client_reference_id", in.ClientReferenceID)
	}
	form.Set("payment_method_types[0]", "card")
	form.Set("invoice_creation[enabled]", "true")

	for i, li := range in.LineItems {
		cur := strings.ToLower(li.Currency)
		if cur == "" {
			cur = "usd"
		}
		qty := li.Quantity
		if qty <= 0 {
			qty = 1
		}
		form.Set(fmt.Sprintf("line_items[%d][price_data][currency]", i), cur)
		form.Set(fmt.Sprintf("line_items[%d][price_data][unit_amount]", i), strconv.FormatInt(li.AmountCents, 10))
		form.Set(fmt.Sprintf("line_items[%d][price_data][product_data][name]", i), li.Name)
		if li.Description != "" {
			form.Set(fmt.Sprintf("line_items[%d][price_data][product_data][description]", i), li.Description)
		}
		form.Set(fmt.Sprintf("line_items[%d][quantity]", i), strconv.Itoa(qty))
	}

	for k, v := range in.Metadata {
		form.Set(fmt.Sprintf("metadata[%s]", k), v)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, stripeBaseURL+"/checkout/sessions", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Stripe-Version", "2024-04-10")

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("stripe: checkout session failed (%d): %s", res.StatusCode, truncate(string(body), 500))
	}
	var sess StripeCheckoutSession
	if err := json.Unmarshal(body, &sess); err != nil {
		return nil, fmt.Errorf("stripe: decode response: %w", err)
	}
	return &sess, nil
}

// RetrieveCheckoutSession fetches the current state of a Checkout Session.
func (c *StripeClient) RetrieveCheckoutSession(ctx context.Context, sessionID string) (*StripeCheckoutSession, error) {
	if c.secretKey == "" {
		return nil, errors.New("stripe: secret key not configured")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, stripeBaseURL+"/checkout/sessions/"+url.PathEscape(sessionID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("stripe: retrieve session (%d): %s", res.StatusCode, truncate(string(body), 500))
	}
	var sess StripeCheckoutSession
	if err := json.Unmarshal(body, &sess); err != nil {
		return nil, err
	}
	return &sess, nil
}

// VerifyStripeSignature validates the Stripe-Signature header per
// https://stripe.com/docs/webhooks/signatures
// - header format: "t=<timestamp>,v1=<signature>,v1=<signature2>,..."
// - signed payload: "<timestamp>.<payload>"
// - expected signature: HMAC-SHA256(secret, signedPayload)
//
// tolerance is the max age of the event we accept (default 5 minutes).
func VerifyStripeSignature(payload []byte, sigHeader, secret string, tolerance time.Duration) error {
	if secret == "" {
		return errors.New("stripe: webhook secret not configured")
	}
	if tolerance <= 0 {
		tolerance = 5 * time.Minute
	}

	parts := strings.Split(sigHeader, ",")
	var timestamp int64
	var sigs []string
	for _, p := range parts {
		kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			timestamp, _ = strconv.ParseInt(kv[1], 10, 64)
		case "v1":
			sigs = append(sigs, kv[1])
		}
	}
	if timestamp == 0 || len(sigs) == 0 {
		return errors.New("stripe: malformed signature header")
	}

	eventTime := time.Unix(timestamp, 0)
	if time.Since(eventTime) > tolerance {
		return errors.New("stripe: webhook timestamp outside tolerance")
	}

	signed := fmt.Sprintf("%d.%s", timestamp, string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signed))
	expected := hex.EncodeToString(mac.Sum(nil))

	for _, s := range sigs {
		if hmac.Equal([]byte(s), []byte(expected)) {
			return nil
		}
	}
	return errors.New("stripe: signature mismatch")
}

// StripeEvent is a minimal Stripe event envelope — we only care about the type
// and the object's id for now.
type StripeEvent struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Data struct {
		Object json.RawMessage `json:"object"`
	} `json:"data"`
}

type StripeCheckoutSessionCompleted struct {
	ID                string `json:"id"`
	ClientReferenceID string `json:"client_reference_id"`
	PaymentIntent     string `json:"payment_intent"`
	PaymentStatus     string `json:"payment_status"`
	Invoice           string `json:"invoice"`
	AmountTotal       int64  `json:"amount_total"`
	Currency          string `json:"currency"`
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
