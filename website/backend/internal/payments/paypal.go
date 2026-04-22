package payments

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// ── PayPal Orders v2 ───────────────────────────────────────────────────
// https://developer.paypal.com/docs/api/orders/v2/

const (
	paypalEnvSandbox = "sandbox"
	paypalEnvLive    = "live"
	paypalBaseSandbox = "https://api-m.sandbox.paypal.com"
	paypalBaseLive    = "https://api-m.paypal.com"
)

type PayPalClient struct {
	clientID     string
	clientSecret string
	env          string
	http         *http.Client

	tokenMu sync.Mutex
	token   string
	tokenExp time.Time
}

func NewPayPalClient(clientID, clientSecret, env string) *PayPalClient {
	env = strings.ToLower(strings.TrimSpace(env))
	if env != paypalEnvLive {
		env = paypalEnvSandbox
	}
	return &PayPalClient{
		clientID:     clientID,
		clientSecret: clientSecret,
		env:          env,
		http:         &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *PayPalClient) baseURL() string {
	if c.env == paypalEnvLive {
		return paypalBaseLive
	}
	return paypalBaseSandbox
}

// getToken fetches and caches an OAuth2 bearer token. PayPal access tokens
// are valid for ~9 hours; we renew 1 minute before expiry.
func (c *PayPalClient) getToken(ctx context.Context) (string, error) {
	c.tokenMu.Lock()
	defer c.tokenMu.Unlock()
	if c.token != "" && time.Now().Before(c.tokenExp.Add(-1*time.Minute)) {
		return c.token, nil
	}
	if c.clientID == "" || c.clientSecret == "" {
		return "", errors.New("paypal: client_id / client_secret not configured")
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL()+"/v1/oauth2/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(c.clientID, c.clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("paypal: token failed (%d): %s", res.StatusCode, truncate(string(body), 400))
	}
	var out struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return "", err
	}
	c.token = out.AccessToken
	c.tokenExp = time.Now().Add(time.Duration(out.ExpiresIn) * time.Second)
	return c.token, nil
}

// ── Orders ─────────────────────────────────────────────────────────────

type PayPalCreateOrderInput struct {
	AmountCents    int64
	Currency       string  // "USD"
	InvoiceID      string  // our order number
	Description    string
	ReturnURL      string  // where PayPal sends after approval
	CancelURL      string  // where PayPal sends after cancel
	BrandName      string  // shown on PayPal checkout
	CustomID       string  // passed through to webhook
}

type PayPalOrder struct {
	ID     string          `json:"id"`
	Status string          `json:"status"`
	Links  []PayPalLink    `json:"links"`
}

type PayPalLink struct {
	Href   string `json:"href"`
	Rel    string `json:"rel"`
	Method string `json:"method"`
}

func (o *PayPalOrder) ApproveURL() string {
	for _, l := range o.Links {
		if l.Rel == "approve" || l.Rel == "payer-action" {
			return l.Href
		}
	}
	return ""
}

func (c *PayPalClient) CreateOrder(ctx context.Context, in PayPalCreateOrderInput) (*PayPalOrder, error) {
	token, err := c.getToken(ctx)
	if err != nil {
		return nil, err
	}
	if in.Currency == "" {
		in.Currency = "USD"
	}

	amount := fmt.Sprintf("%d.%02d", in.AmountCents/100, in.AmountCents%100)

	payload := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"reference_id": in.InvoiceID,
				"invoice_id":   in.InvoiceID,
				"description":  in.Description,
				"custom_id":    in.CustomID,
				"amount": map[string]interface{}{
					"currency_code": in.Currency,
					"value":         amount,
				},
			},
		},
		"payment_source": map[string]interface{}{
			"paypal": map[string]interface{}{
				"experience_context": map[string]interface{}{
					"brand_name":          in.BrandName,
					"landing_page":        "LOGIN",
					"user_action":         "PAY_NOW",
					"shipping_preference": "NO_SHIPPING",
					"return_url":          in.ReturnURL,
					"cancel_url":          in.CancelURL,
				},
			},
		},
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL()+"/v2/checkout/orders", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("paypal: create order (%d): %s", res.StatusCode, truncate(string(respBody), 500))
	}
	var out PayPalOrder
	if err := json.Unmarshal(respBody, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

type PayPalCapture struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	PurchaseUnits []struct {
		Payments struct {
			Captures []struct {
				ID     string `json:"id"`
				Status string `json:"status"`
				Amount struct {
					CurrencyCode string `json:"currency_code"`
					Value        string `json:"value"`
				} `json:"amount"`
			} `json:"captures"`
		} `json:"payments"`
	} `json:"purchase_units"`
}

// CaptureOrder finalizes an approved order. Call after the user is redirected
// back to our return_url with ?token=<orderID>.
func (c *PayPalClient) CaptureOrder(ctx context.Context, orderID string) (*PayPalCapture, error) {
	token, err := c.getToken(ctx)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL()+"/v2/checkout/orders/"+url.PathEscape(orderID)+"/capture", strings.NewReader("{}"))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("paypal: capture (%d): %s", res.StatusCode, truncate(string(body), 500))
	}
	var out PayPalCapture
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// VerifyWebhookSignature calls PayPal's verification endpoint.
// https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
func (c *PayPalClient) VerifyWebhookSignature(ctx context.Context, headers http.Header, body []byte, webhookID string) error {
	if webhookID == "" {
		return errors.New("paypal: webhook_id not configured")
	}
	token, err := c.getToken(ctx)
	if err != nil {
		return err
	}

	var rawEvent json.RawMessage = body
	payload := map[string]interface{}{
		"auth_algo":         headers.Get("Paypal-Auth-Algo"),
		"cert_url":          headers.Get("Paypal-Cert-Url"),
		"transmission_id":   headers.Get("Paypal-Transmission-Id"),
		"transmission_sig":  headers.Get("Paypal-Transmission-Sig"),
		"transmission_time": headers.Get("Paypal-Transmission-Time"),
		"webhook_id":        webhookID,
		"webhook_event":     rawEvent,
	}
	bodyBytes, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL()+"/v1/notifications/verify-webhook-signature", bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("paypal: verify (%d): %s", res.StatusCode, truncate(string(respBody), 400))
	}
	var out struct {
		VerificationStatus string `json:"verification_status"`
	}
	if err := json.Unmarshal(respBody, &out); err != nil {
		return err
	}
	if out.VerificationStatus != "SUCCESS" {
		return fmt.Errorf("paypal: webhook verification status: %s", out.VerificationStatus)
	}
	return nil
}

type PayPalEvent struct {
	ID           string          `json:"id"`
	EventType    string          `json:"event_type"`
	ResourceType string          `json:"resource_type"`
	Resource     json.RawMessage `json:"resource"`
}
