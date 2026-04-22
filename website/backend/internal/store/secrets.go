package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

// AppSecretMeta is the safe-for-display metadata — no raw value.
type AppSecretMeta struct {
	Key       string    `json:"key"`
	Group     string    `json:"group"`
	IsSet     bool      `json:"isSet"`
	LastFour  string    `json:"lastFour,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
	UpdatedBy int64     `json:"updatedBy,omitempty"`
}

type AppSecretAudit struct {
	ID          int64     `json:"id"`
	Key         string    `json:"key"`
	Action      string    `json:"action"`
	ActorUserID int64     `json:"actorUserId"`
	IP          string    `json:"ip,omitempty"`
	UA          string    `json:"ua,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// AllowedSecretKeys is the curated list of secrets the admin panel exposes.
// Keys not in this list cannot be set via the admin API.
var AllowedSecretKeys = map[string]string{
	// Stripe
	"STRIPE_SECRET_KEY":      "stripe",
	"STRIPE_WEBHOOK_SECRET":  "stripe",
	"STRIPE_PUBLISHABLE_KEY": "stripe",
	// Ping++
	"PINGXX_APP_ID":         "pingxx",
	"PINGXX_SECRET_KEY":     "pingxx",
	"PINGXX_WEBHOOK_SECRET": "pingxx",
	"PINGXX_PRIVATE_KEY":    "pingxx",
	// PayPal
	"PAYPAL_CLIENT_ID":      "paypal",
	"PAYPAL_CLIENT_SECRET":  "paypal",
	"PAYPAL_WEBHOOK_ID":     "paypal",
	"PAYPAL_ENV":            "paypal", // "sandbox" | "live"
	// SMTP
	"SMTP_HOST":     "smtp",
	"SMTP_PORT":     "smtp",
	"SMTP_USER":     "smtp",
	"SMTP_PASSWORD": "smtp",
	"SMTP_FROM":     "smtp",
	// Captcha
	"TURNSTILE_SITE_KEY":           "captcha",
	"TURNSTILE_SECRET_KEY":         "captcha",
	"TENCENT_CAPTCHA_APP_ID":       "captcha",
	"TENCENT_CAPTCHA_SECRET_KEY":   "captcha",
	"CAPTCHA_PROVIDER":             "captcha",
}

// PublishableSecretKeys are non-secret values that ship to the browser
// via GET /api/public/config.
var PublishableSecretKeys = []string{
	"STRIPE_PUBLISHABLE_KEY",
	"TURNSTILE_SITE_KEY",
	"TENCENT_CAPTCHA_APP_ID",
	"CAPTCHA_PROVIDER",
	"PAYPAL_CLIENT_ID",
	"PAYPAL_ENV",
}

// secretsCache is a process-local cache of decrypted secret values so
// request-path calls (Stripe webhook, etc.) don't hit the DB + cipher
// for every request. Invalidated on write/delete.
type secretsCache struct {
	mu sync.RWMutex
	m  map[string]string
}

var _secretsCache = &secretsCache{m: make(map[string]string)}

func (c *secretsCache) get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	v, ok := c.m[key]
	return v, ok
}

func (c *secretsCache) set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.m[key] = value
}

func (c *secretsCache) delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.m, key)
}

// SetAppSecret encrypts and upserts a secret. The raw value is never returned after this call.
func (s *Store) SetAppSecret(ctx context.Context, key, value string, actorUserID int64, ip, ua string) error {
	key = strings.TrimSpace(key)
	if key == "" {
		return errors.New("key is required")
	}
	group, ok := AllowedSecretKeys[key]
	if !ok {
		return fmt.Errorf("unknown secret key: %s", key)
	}
	value = strings.TrimSpace(value)
	if value == "" {
		return errors.New("value is required")
	}
	if s.enc == nil || !s.enc.IsEnabled() {
		return errors.New("encryption is not configured")
	}

	encrypted := s.enc.Encrypt(value)
	lastFour := ""
	if len(value) >= 4 {
		lastFour = value[len(value)-4:]
	} else {
		lastFour = value
	}
	now := time.Now().UTC().Format(time.RFC3339)

	// Upsert. SQLite supports ON CONFLICT.
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO app_secrets (key, group_name, encrypted_value, last_four, updated_at, updated_by)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET
			group_name = excluded.group_name,
			encrypted_value = excluded.encrypted_value,
			last_four = excluded.last_four,
			updated_at = excluded.updated_at,
			updated_by = excluded.updated_by;
	`, key, group, encrypted, lastFour, now, actorUserID)
	if err != nil {
		return err
	}

	// Audit
	action := "update"
	var existed int
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM app_secret_audit WHERE key = ? AND action IN ('set','update');`, key).Scan(&existed)
	if existed <= 1 {
		action = "set"
	}
	_, _ = s.db.ExecContext(ctx, `
		INSERT INTO app_secret_audit (key, action, actor_user_id, ip, ua, created_at)
		VALUES (?, ?, ?, ?, ?, ?);
	`, key, action, actorUserID, ip, ua, now)

	// Invalidate + prime cache.
	_secretsCache.set(key, value)
	return nil
}

// GetAppSecret returns the decrypted value for backend use. NEVER expose via any API handler.
func (s *Store) GetAppSecret(ctx context.Context, key string) (string, error) {
	if v, ok := _secretsCache.get(key); ok {
		return v, nil
	}
	var encrypted string
	err := s.db.QueryRowContext(ctx, `SELECT encrypted_value FROM app_secrets WHERE key = ?;`, key).Scan(&encrypted)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil // not set — caller must handle
		}
		return "", err
	}
	if s.enc == nil {
		return "", errors.New("encryption is not configured")
	}
	plain := s.enc.Decrypt(encrypted)
	_secretsCache.set(key, plain)
	return plain, nil
}

// ListAppSecretsMeta returns metadata for every allowed key.
// Unset keys are included with IsSet=false so the admin UI can render the full form.
func (s *Store) ListAppSecretsMeta(ctx context.Context) ([]AppSecretMeta, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT key, group_name, last_four, updated_at, COALESCE(updated_by, 0) FROM app_secrets;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	existing := map[string]AppSecretMeta{}
	for rows.Next() {
		var m AppSecretMeta
		var updatedAt string
		if err := rows.Scan(&m.Key, &m.Group, &m.LastFour, &updatedAt, &m.UpdatedBy); err != nil {
			return nil, err
		}
		m.IsSet = true
		m.UpdatedAt, _ = parseTimeRFC3339(updatedAt)
		existing[m.Key] = m
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	out := make([]AppSecretMeta, 0, len(AllowedSecretKeys))
	for key, group := range AllowedSecretKeys {
		if m, ok := existing[key]; ok {
			out = append(out, m)
			continue
		}
		out = append(out, AppSecretMeta{Key: key, Group: group, IsSet: false})
	}
	return out, nil
}

// DeleteAppSecret clears a secret (admin forcing re-entry / killswitch).
func (s *Store) DeleteAppSecret(ctx context.Context, key string, actorUserID int64, ip, ua string) error {
	key = strings.TrimSpace(key)
	if _, ok := AllowedSecretKeys[key]; !ok {
		return fmt.Errorf("unknown secret key: %s", key)
	}
	res, err := s.db.ExecContext(ctx, `DELETE FROM app_secrets WHERE key = ?;`, key)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil // already absent
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, _ = s.db.ExecContext(ctx, `
		INSERT INTO app_secret_audit (key, action, actor_user_id, ip, ua, created_at)
		VALUES (?, 'delete', ?, ?, ?, ?);
	`, key, actorUserID, ip, ua, now)
	_secretsCache.delete(key)
	return nil
}

// ListAppSecretAudit returns the most recent audit entries.
func (s *Store) ListAppSecretAudit(ctx context.Context, limit int) ([]AppSecretAudit, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, key, action, COALESCE(actor_user_id, 0), COALESCE(ip, ''), COALESCE(ua, ''), created_at
		FROM app_secret_audit ORDER BY created_at DESC LIMIT ?;`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []AppSecretAudit
	for rows.Next() {
		var a AppSecretAudit
		var createdAt string
		if err := rows.Scan(&a.ID, &a.Key, &a.Action, &a.ActorUserID, &a.IP, &a.UA, &createdAt); err != nil {
			return nil, err
		}
		a.CreatedAt, _ = parseTimeRFC3339(createdAt)
		out = append(out, a)
	}
	return out, rows.Err()
}

// GetPublicConfig returns only publishable values for the frontend. Never includes secret keys.
func (s *Store) GetPublicConfig(ctx context.Context) (map[string]string, error) {
	out := map[string]string{}
	for _, key := range PublishableSecretKeys {
		v, err := s.GetAppSecret(ctx, key)
		if err != nil {
			return nil, err
		}
		if v != "" {
			out[key] = v
		}
	}
	return out, nil
}
