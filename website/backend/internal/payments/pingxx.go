package payments

// ── Ping++ (Alipay / WeChat Pay) ───────────────────────────────────────
// https://www.pingxx.com/api/
// Implements the 2022-07-01 signature scheme with RSA-SHA256.
//
// Flow:
//   1. POST /v1/charges creates a charge. Response includes a "credential"
//      object that the frontend uses to launch the actual payment (QR code
//      for alipay_qr / wx_pub_qr, or a deep link for alipay_wap / wx_wap).
//   2. Customer pays on Alipay / WeChat.
//   3. Ping++ sends a charge.succeeded webhook event we verify + mark paid.

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const pingxxBaseURL = "https://api.pingxx.com"

type PingxxClient struct {
	appID      string
	secretKey  string
	privateKey *rsa.PrivateKey
	http       *http.Client
}

func NewPingxxClient(appID, secretKey, privateKeyPEM string) (*PingxxClient, error) {
	if appID == "" || secretKey == "" || privateKeyPEM == "" {
		return nil, errors.New("pingxx: app_id, secret_key, and private_key are required")
	}
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, errors.New("pingxx: invalid PEM private key")
	}
	var key *rsa.PrivateKey
	if k, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		if rk, ok := k.(*rsa.PrivateKey); ok {
			key = rk
		} else {
			return nil, errors.New("pingxx: PKCS8 key is not RSA")
		}
	} else if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		key = k
	} else {
		return nil, fmt.Errorf("pingxx: parse private key: %w", err)
	}

	return &PingxxClient{
		appID:      appID,
		secretKey:  secretKey,
		privateKey: key,
		http:       &http.Client{Timeout: 30 * time.Second},
	}, nil
}

// signRequest builds the v2022-07-01 signature.
// canonical = URI + "\n" + method + "\n" + timestamp + "\n" + query + "\n" + body + "\n"
func (c *PingxxClient) signRequest(method, uri, query string, body []byte, timestamp int64) (string, error) {
	canonical := fmt.Sprintf("%s\n%s\n%d\n%s\n%s\n", uri, strings.ToUpper(method), timestamp, query, string(body))
	h := sha256.New()
	h.Write([]byte(canonical))
	sig, err := rsa.SignPKCS1v15(rand.Reader, c.privateKey, crypto.SHA256, h.Sum(nil))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(sig), nil
}

type PingxxCharge struct {
	ID        string                 `json:"id"`
	Object    string                 `json:"object"`
	Channel   string                 `json:"channel"`
	Amount    int64                  `json:"amount"`
	Currency  string                 `json:"currency"`
	OrderNo   string                 `json:"order_no"`
	Paid      bool                   `json:"paid"`
	App       map[string]interface{} `json:"app"`
	Subject   string                 `json:"subject"`
	Body      string                 `json:"body"`
	Credential map[string]interface{} `json:"credential"`
	Metadata  map[string]string      `json:"metadata"`
}

type PingxxCreateChargeInput struct {
	OrderNo   string  // our order number (max 64 chars, unique)
	AmountCents int64
	Currency  string  // "cny" for Alipay/WeChat in China, "usd" for cross-border
	Channel   string  // alipay_pc_direct | alipay_qr | alipay_wap | wx_pub_qr | wx_wap
	Subject   string
	Body      string
	ClientIP  string  // customer's IP
	ExtraTimeExpire int64  // seconds from now (default: 3600)
	Metadata  map[string]string
	Extra     map[string]interface{}  // channel-specific extras (e.g. success_url for alipay_pc_direct)
}

func (c *PingxxClient) CreateCharge(ctx context.Context, in PingxxCreateChargeInput) (*PingxxCharge, error) {
	if in.OrderNo == "" || in.AmountCents <= 0 || in.Channel == "" {
		return nil, errors.New("pingxx: order_no, amount, and channel are required")
	}
	currency := strings.ToLower(in.Currency)
	if currency == "" {
		currency = "cny"
	}
	if in.ExtraTimeExpire <= 0 {
		in.ExtraTimeExpire = 3600
	}

	payload := map[string]interface{}{
		"app":       map[string]string{"id": c.appID},
		"order_no":  in.OrderNo,
		"amount":    in.AmountCents,
		"currency":  currency,
		"channel":   in.Channel,
		"subject":   in.Subject,
		"body":      in.Body,
		"client_ip": in.ClientIP,
		"time_expire": time.Now().Unix() + in.ExtraTimeExpire,
	}
	if len(in.Metadata) > 0 {
		payload["metadata"] = in.Metadata
	}
	if len(in.Extra) > 0 {
		payload["extra"] = in.Extra
	}
	body, _ := json.Marshal(payload)

	uri := "/v1/charges"
	timestamp := time.Now().Unix()
	sig, err := c.signRequest("POST", uri, "", body, timestamp)
	if err != nil {
		return nil, fmt.Errorf("pingxx: sign: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, pingxxBaseURL+uri, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Pingplusplus-Request-Timestamp", strconv.FormatInt(timestamp, 10))
	req.Header.Set("Pingplusplus-Signature", sig)
	req.Header.Set("Pingplusplus-Signature-Version", "2022-07-01")

	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("pingxx: create charge (%d): %s", res.StatusCode, truncate(string(respBody), 500))
	}
	var out PingxxCharge
	if err := json.Unmarshal(respBody, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// VerifyPingxxWebhookSignature verifies the signature on an incoming event
// using Ping++'s published public key.
// https://www.pingxx.com/api/Webhooks.html#webhooks-secured
func VerifyPingxxWebhookSignature(payload []byte, sigBase64, publicKeyPEM string) error {
	if publicKeyPEM == "" {
		return errors.New("pingxx: webhook public key not configured")
	}
	block, _ := pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return errors.New("pingxx: invalid PEM public key")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return fmt.Errorf("pingxx: parse public key: %w", err)
	}
	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return errors.New("pingxx: public key is not RSA")
	}

	sig, err := base64.StdEncoding.DecodeString(sigBase64)
	if err != nil {
		return fmt.Errorf("pingxx: decode signature: %w", err)
	}
	h := sha256.New()
	h.Write(payload)
	if err := rsa.VerifyPKCS1v15(rsaPub, crypto.SHA256, h.Sum(nil), sig); err != nil {
		return fmt.Errorf("pingxx: signature mismatch: %w", err)
	}
	return nil
}

// PingxxEvent is the minimal envelope. The actual resource is on .Data.Object.
type PingxxEvent struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Data      struct {
		Object json.RawMessage `json:"object"`
	} `json:"data"`
	LiveMode bool `json:"livemode"`
}
