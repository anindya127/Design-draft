package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
)

// ── Catalog models ─────────────────────────────────────────────────────

type BillingCycle struct {
	ID         int64   `json:"id"`
	Years      int     `json:"years"`
	LabelEN    string  `json:"labelEn"`
	LabelZH    string  `json:"labelZh"`
	Multiplier float64 `json:"multiplier"`
	IsActive   bool    `json:"isActive"`
	SortOrder  int     `json:"sortOrder"`
}

type SupportTier struct {
	ID            int64  `json:"id"`
	LabelEN       string `json:"labelEn"`
	LabelZH       string `json:"labelZh"`
	DescriptionEN string `json:"descriptionEn"`
	DescriptionZH string `json:"descriptionZh"`
	PriceCents    int64  `json:"priceCents"`
	PricingType   string `json:"pricingType"` // fixed | per_day | per_month
	IsActive      bool   `json:"isActive"`
	SortOrder     int    `json:"sortOrder"`
}

type ServerTier struct {
	ID          int64  `json:"id"`
	LabelEN     string `json:"labelEn"`
	LabelZH     string `json:"labelZh"`
	MaxChargers int    `json:"maxChargers"`
	PriceCents  int64  `json:"priceCents"`
	IsActive    bool   `json:"isActive"`
	SortOrder   int    `json:"sortOrder"`
}

type PromoCode struct {
	ID              int64      `json:"id"`
	Code            string     `json:"code"`
	DiscountType    string     `json:"discountType"` // percent | fixed
	DiscountValue   int64      `json:"discountValue"`
	IsActive        bool       `json:"isActive"`
	MaxRedemptions  int        `json:"maxRedemptions"`
	RedeemedCount   int        `json:"redeemedCount"`
	ValidFrom       *time.Time `json:"validFrom,omitempty"`
	ValidUntil      *time.Time `json:"validUntil,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type Order struct {
	ID                 int64     `json:"id"`
	UserID             int64     `json:"userId"`
	OrderNumber        string    `json:"orderNumber"`
	BillingCycleID     *int64    `json:"billingCycleId,omitempty"`
	SupportTierID      *int64    `json:"supportTierId,omitempty"`
	ServerTierID       *int64    `json:"serverTierId,omitempty"`
	PromoCodeID        *int64    `json:"promoCodeId,omitempty"`
	ProductLabel       string    `json:"productLabel"`
	SubtotalCents      int64     `json:"subtotalCents"`
	DiscountCents      int64     `json:"discountCents"`
	TotalCents         int64     `json:"totalCents"`
	Currency           string    `json:"currency"`
	BillingAddressJSON string    `json:"billingAddress"`
	Provider           string    `json:"provider"`
	ProviderSessionID  string    `json:"providerSessionId,omitempty"`
	ProviderPaymentID  string    `json:"providerPaymentId,omitempty"`
	Status             string    `json:"status"`
	OrderStage         string    `json:"orderStage"`
	ServerStage        string    `json:"serverStage"`
	PaidAt             *time.Time `json:"paidAt,omitempty"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type Invoice struct {
	ID                int64      `json:"id"`
	OrderID           *int64     `json:"orderId,omitempty"`
	UserID            int64      `json:"userId"`
	InvoiceNumber     string     `json:"invoiceNumber"`
	Provider          string     `json:"provider"`
	ProviderInvoiceID string     `json:"providerInvoiceId,omitempty"`
	HostedInvoiceURL  string     `json:"hostedInvoiceUrl,omitempty"`
	ProductLabel      string     `json:"productLabel"`
	AmountCents       int64      `json:"amountCents"`
	Currency          string     `json:"currency"`
	Status            string     `json:"status"`
	PaidAt            *time.Time `json:"paidAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// ── Seed default catalog ───────────────────────────────────────────────

func (s *Store) seedCatalog(ctx context.Context) error {
	// Billing cycles — only seed if empty
	var n int
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM billing_cycles;`).Scan(&n)
	if n == 0 {
		for i, years := range []int{1, 2, 3, 4, 5} {
			label := fmt.Sprintf("%d Year", years)
			labelZH := fmt.Sprintf("%d 年", years)
			if years > 1 {
				label = fmt.Sprintf("%d Years", years)
			}
			if years == 1 {
				label = "Annually"
				labelZH = "每年"
			}
			// No multi-year discount by default — admin can edit.
			_, _ = s.db.ExecContext(ctx, `INSERT INTO billing_cycles (years, label_en, label_zh, multiplier, is_active, sort_order) VALUES (?, ?, ?, ?, 1, ?);`,
				years, label, labelZH, 1.0, i)
		}
	}

	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM support_tiers;`).Scan(&n)
	if n == 0 {
		type st struct {
			l, lz, d, dz, pt string
			p                int64
		}
		tiers := []st{
			{"No Support Needed", "无需支持", "Self-service. Use our documentation and community forum.", "自助服务，使用文档和社区论坛。", "fixed", 0},
			{"Technical Team", "技术团队", "Email support with a response within 24 business hours.", "邮件支持，工作日 24 小时内响应。", "fixed", 10000},
			{"Multi-platform After-sales Service", "多平台售后服务", "Priority chat + email support across platforms, business hours.", "工作时间内跨平台优先支持。", "per_day", 20000},
			{"Assistance with Installation Once", "一次上门安装协助", "One on-site installation visit included.", "含一次现场安装协助。", "fixed", 120000},
			{"Technical Specialized Team", "技术专家团队", "Dedicated engineer for deployment + 24/7 hotline.", "专职工程师部署 + 24/7 热线。", "fixed", 120000},
		}
		for i, t := range tiers {
			_, _ = s.db.ExecContext(ctx, `INSERT INTO support_tiers (label_en, label_zh, description_en, description_zh, price_cents, pricing_type, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?);`,
				t.l, t.lz, t.d, t.dz, t.p, t.pt, i)
		}
	}

	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM server_tiers;`).Scan(&n)
	if n == 0 {
		type tier struct {
			l, lz string
			m     int
			p     int64
		}
		tiers := []tier{
			{"1000 Charger Connection", "1000 个充电桩连接", 1000, 120000},
			{"3000 Charger Connection", "3000 个充电桩连接", 3000, 250000},
			{"5000 Charger Connection", "5000 个充电桩连接", 5000, 400000},
		}
		for i, t := range tiers {
			_, _ = s.db.ExecContext(ctx, `INSERT INTO server_tiers (label_en, label_zh, max_chargers, price_cents, is_active, sort_order) VALUES (?, ?, ?, ?, 1, ?);`,
				t.l, t.lz, t.m, t.p, i)
		}
	}
	return nil
}

// ── Catalog reads ──────────────────────────────────────────────────────

func (s *Store) ListBillingCycles(ctx context.Context, activeOnly bool) ([]BillingCycle, error) {
	q := `SELECT id, years, label_en, label_zh, multiplier, is_active, sort_order FROM billing_cycles`
	if activeOnly {
		q += ` WHERE is_active = 1`
	}
	q += ` ORDER BY sort_order ASC, id ASC;`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []BillingCycle
	for rows.Next() {
		var b BillingCycle
		var active int
		if err := rows.Scan(&b.ID, &b.Years, &b.LabelEN, &b.LabelZH, &b.Multiplier, &active, &b.SortOrder); err != nil {
			return nil, err
		}
		b.IsActive = active == 1
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *Store) ListSupportTiers(ctx context.Context, activeOnly bool) ([]SupportTier, error) {
	q := `SELECT id, label_en, label_zh, description_en, description_zh, price_cents, pricing_type, is_active, sort_order FROM support_tiers`
	if activeOnly {
		q += ` WHERE is_active = 1`
	}
	q += ` ORDER BY sort_order ASC, id ASC;`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SupportTier
	for rows.Next() {
		var t SupportTier
		var active int
		if err := rows.Scan(&t.ID, &t.LabelEN, &t.LabelZH, &t.DescriptionEN, &t.DescriptionZH, &t.PriceCents, &t.PricingType, &active, &t.SortOrder); err != nil {
			return nil, err
		}
		t.IsActive = active == 1
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) ListServerTiers(ctx context.Context, activeOnly bool) ([]ServerTier, error) {
	q := `SELECT id, label_en, label_zh, max_chargers, price_cents, is_active, sort_order FROM server_tiers`
	if activeOnly {
		q += ` WHERE is_active = 1`
	}
	q += ` ORDER BY sort_order ASC, id ASC;`
	rows, err := s.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ServerTier
	for rows.Next() {
		var t ServerTier
		var active int
		if err := rows.Scan(&t.ID, &t.LabelEN, &t.LabelZH, &t.MaxChargers, &t.PriceCents, &active, &t.SortOrder); err != nil {
			return nil, err
		}
		t.IsActive = active == 1
		out = append(out, t)
	}
	return out, rows.Err()
}

// ── Catalog writes ─────────────────────────────────────────────────────

func (s *Store) UpsertBillingCycle(ctx context.Context, b BillingCycle) (BillingCycle, error) {
	b.LabelEN = strings.TrimSpace(b.LabelEN)
	b.LabelZH = strings.TrimSpace(b.LabelZH)
	if b.LabelEN == "" || b.Years <= 0 {
		return b, errors.New("years and labelEn are required")
	}
	if b.Multiplier <= 0 {
		b.Multiplier = 1
	}
	active := 0
	if b.IsActive {
		active = 1
	}
	if b.ID > 0 {
		_, err := s.db.ExecContext(ctx, `UPDATE billing_cycles SET years=?, label_en=?, label_zh=?, multiplier=?, is_active=?, sort_order=? WHERE id=?;`,
			b.Years, b.LabelEN, b.LabelZH, b.Multiplier, active, b.SortOrder, b.ID)
		return b, err
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO billing_cycles (years, label_en, label_zh, multiplier, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?);`,
		b.Years, b.LabelEN, b.LabelZH, b.Multiplier, active, b.SortOrder)
	if err != nil {
		return b, err
	}
	b.ID, _ = res.LastInsertId()
	return b, nil
}

func (s *Store) DeleteBillingCycle(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("invalid id")
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM billing_cycles WHERE id = ?;`, id)
	return err
}

func (s *Store) UpsertSupportTier(ctx context.Context, t SupportTier) (SupportTier, error) {
	t.LabelEN = strings.TrimSpace(t.LabelEN)
	t.LabelZH = strings.TrimSpace(t.LabelZH)
	if t.LabelEN == "" {
		return t, errors.New("labelEn is required")
	}
	if t.PriceCents < 0 {
		return t, errors.New("priceCents cannot be negative")
	}
	if t.PricingType == "" {
		t.PricingType = "fixed"
	}
	active := 0
	if t.IsActive {
		active = 1
	}
	if t.ID > 0 {
		_, err := s.db.ExecContext(ctx, `UPDATE support_tiers SET label_en=?, label_zh=?, description_en=?, description_zh=?, price_cents=?, pricing_type=?, is_active=?, sort_order=? WHERE id=?;`,
			t.LabelEN, t.LabelZH, t.DescriptionEN, t.DescriptionZH, t.PriceCents, t.PricingType, active, t.SortOrder, t.ID)
		return t, err
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO support_tiers (label_en, label_zh, description_en, description_zh, price_cents, pricing_type, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
		t.LabelEN, t.LabelZH, t.DescriptionEN, t.DescriptionZH, t.PriceCents, t.PricingType, active, t.SortOrder)
	if err != nil {
		return t, err
	}
	t.ID, _ = res.LastInsertId()
	return t, nil
}

func (s *Store) DeleteSupportTier(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("invalid id")
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM support_tiers WHERE id = ?;`, id)
	return err
}

func (s *Store) UpsertServerTier(ctx context.Context, t ServerTier) (ServerTier, error) {
	t.LabelEN = strings.TrimSpace(t.LabelEN)
	t.LabelZH = strings.TrimSpace(t.LabelZH)
	if t.LabelEN == "" || t.MaxChargers <= 0 {
		return t, errors.New("labelEn and maxChargers are required")
	}
	if t.PriceCents < 0 {
		return t, errors.New("priceCents cannot be negative")
	}
	active := 0
	if t.IsActive {
		active = 1
	}
	if t.ID > 0 {
		_, err := s.db.ExecContext(ctx, `UPDATE server_tiers SET label_en=?, label_zh=?, max_chargers=?, price_cents=?, is_active=?, sort_order=? WHERE id=?;`,
			t.LabelEN, t.LabelZH, t.MaxChargers, t.PriceCents, active, t.SortOrder, t.ID)
		return t, err
	}
	res, err := s.db.ExecContext(ctx, `INSERT INTO server_tiers (label_en, label_zh, max_chargers, price_cents, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?);`,
		t.LabelEN, t.LabelZH, t.MaxChargers, t.PriceCents, active, t.SortOrder)
	if err != nil {
		return t, err
	}
	t.ID, _ = res.LastInsertId()
	return t, nil
}

func (s *Store) DeleteServerTier(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("invalid id")
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM server_tiers WHERE id = ?;`, id)
	return err
}

// ── Promo codes ────────────────────────────────────────────────────────

func (s *Store) ListPromoCodes(ctx context.Context) ([]PromoCode, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, code, discount_type, discount_value, is_active, max_redemptions, redeemed_count, valid_from, valid_until, created_at FROM promo_codes ORDER BY created_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PromoCode
	for rows.Next() {
		var p PromoCode
		var active int
		var validFrom, validUntil sql.NullString
		var createdAt string
		if err := rows.Scan(&p.ID, &p.Code, &p.DiscountType, &p.DiscountValue, &active, &p.MaxRedemptions, &p.RedeemedCount, &validFrom, &validUntil, &createdAt); err != nil {
			return nil, err
		}
		p.IsActive = active == 1
		p.CreatedAt, _ = parseTimeRFC3339(createdAt)
		if validFrom.Valid && validFrom.String != "" {
			t, _ := parseTimeRFC3339(validFrom.String)
			p.ValidFrom = &t
		}
		if validUntil.Valid && validUntil.String != "" {
			t, _ := parseTimeRFC3339(validUntil.String)
			p.ValidUntil = &t
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) UpsertPromoCode(ctx context.Context, p PromoCode) (PromoCode, error) {
	p.Code = strings.ToUpper(strings.TrimSpace(p.Code))
	if p.Code == "" {
		return p, errors.New("code is required")
	}
	if p.DiscountType != "percent" && p.DiscountType != "fixed" {
		return p, errors.New("discountType must be 'percent' or 'fixed'")
	}
	if p.DiscountValue <= 0 {
		return p, errors.New("discountValue must be positive")
	}
	if p.DiscountType == "percent" && p.DiscountValue > 100 {
		return p, errors.New("percent discount cannot exceed 100")
	}
	active := 0
	if p.IsActive {
		active = 1
	}
	var vfrom, vuntil interface{}
	if p.ValidFrom != nil {
		vfrom = p.ValidFrom.UTC().Format(time.RFC3339)
	}
	if p.ValidUntil != nil {
		vuntil = p.ValidUntil.UTC().Format(time.RFC3339)
	}
	if p.ID > 0 {
		_, err := s.db.ExecContext(ctx, `UPDATE promo_codes SET code=?, discount_type=?, discount_value=?, is_active=?, max_redemptions=?, valid_from=?, valid_until=? WHERE id=?;`,
			p.Code, p.DiscountType, p.DiscountValue, active, p.MaxRedemptions, vfrom, vuntil, p.ID)
		return p, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `INSERT INTO promo_codes (code, discount_type, discount_value, is_active, max_redemptions, redeemed_count, valid_from, valid_until, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?);`,
		p.Code, p.DiscountType, p.DiscountValue, active, p.MaxRedemptions, vfrom, vuntil, now)
	if err != nil {
		return p, err
	}
	p.ID, _ = res.LastInsertId()
	p.CreatedAt, _ = parseTimeRFC3339(now)
	return p, nil
}

func (s *Store) DeletePromoCode(ctx context.Context, id int64) error {
	if id <= 0 {
		return errors.New("invalid id")
	}
	_, err := s.db.ExecContext(ctx, `DELETE FROM promo_codes WHERE id = ?;`, id)
	return err
}

// ApplyPromoCode looks up a code and returns it if valid + active + in-window.
// Does NOT increment redeemed_count (that happens on order confirmation).
func (s *Store) FindValidPromoCode(ctx context.Context, code string) (*PromoCode, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return nil, errors.New("code is required")
	}
	row := s.db.QueryRowContext(ctx, `SELECT id, code, discount_type, discount_value, is_active, max_redemptions, redeemed_count, valid_from, valid_until, created_at FROM promo_codes WHERE code = ? LIMIT 1;`, code)
	var p PromoCode
	var active int
	var validFrom, validUntil sql.NullString
	var createdAt string
	if err := row.Scan(&p.ID, &p.Code, &p.DiscountType, &p.DiscountValue, &active, &p.MaxRedemptions, &p.RedeemedCount, &validFrom, &validUntil, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid code")
		}
		return nil, err
	}
	p.IsActive = active == 1
	if !p.IsActive {
		return nil, errors.New("code is not active")
	}
	if p.MaxRedemptions > 0 && p.RedeemedCount >= p.MaxRedemptions {
		return nil, errors.New("code has reached its redemption limit")
	}
	now := time.Now().UTC()
	if validFrom.Valid && validFrom.String != "" {
		t, _ := parseTimeRFC3339(validFrom.String)
		if now.Before(t) {
			return nil, errors.New("code is not yet valid")
		}
		p.ValidFrom = &t
	}
	if validUntil.Valid && validUntil.String != "" {
		t, _ := parseTimeRFC3339(validUntil.String)
		if now.After(t) {
			return nil, errors.New("code has expired")
		}
		p.ValidUntil = &t
	}
	p.CreatedAt, _ = parseTimeRFC3339(createdAt)
	return &p, nil
}

// ── Orders ─────────────────────────────────────────────────────────────

func generateOrderNumber() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("GCSS-%s-%s", time.Now().UTC().Format("20060102"), strings.ToUpper(hex.EncodeToString(b)))
}

type NewOrderInput struct {
	UserID             int64
	BillingCycleID     *int64
	SupportTierID      *int64
	ServerTierID       *int64
	PromoCodeID        *int64
	ProductLabel       string
	SubtotalCents      int64
	DiscountCents      int64
	TotalCents         int64
	Currency           string
	BillingAddressJSON string
	Provider           string
}

func (s *Store) CreateOrder(ctx context.Context, in NewOrderInput) (*Order, error) {
	if in.UserID <= 0 {
		return nil, errors.New("userId required")
	}
	if in.Currency == "" {
		in.Currency = "USD"
	}
	now := time.Now().UTC().Format(time.RFC3339)
	orderNum := generateOrderNumber()
	res, err := s.db.ExecContext(ctx, `
		INSERT INTO orders (user_id, order_number, billing_cycle_id, support_tier_id, server_tier_id, promo_code_id, product_label, subtotal_cents, discount_cents, total_cents, currency, billing_address_json, provider, status, order_stage, server_stage, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', 'not_started', ?, ?);
	`, in.UserID, orderNum, in.BillingCycleID, in.SupportTierID, in.ServerTierID, in.PromoCodeID, in.ProductLabel, in.SubtotalCents, in.DiscountCents, in.TotalCents, in.Currency, in.BillingAddressJSON, in.Provider, now, now)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return s.GetOrder(ctx, id)
}

func (s *Store) GetOrder(ctx context.Context, id int64) (*Order, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, order_number, billing_cycle_id, support_tier_id, server_tier_id, promo_code_id, product_label, subtotal_cents, discount_cents, total_cents, currency, billing_address_json, provider, COALESCE(provider_session_id, ''), COALESCE(provider_payment_id, ''), status, order_stage, server_stage, paid_at, created_at, updated_at
		FROM orders WHERE id = ?;
	`, id)
	return scanOrder(row)
}

func (s *Store) GetOrderBySession(ctx context.Context, sessionID string) (*Order, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, order_number, billing_cycle_id, support_tier_id, server_tier_id, promo_code_id, product_label, subtotal_cents, discount_cents, total_cents, currency, billing_address_json, provider, COALESCE(provider_session_id, ''), COALESCE(provider_payment_id, ''), status, order_stage, server_stage, paid_at, created_at, updated_at
		FROM orders WHERE provider_session_id = ? LIMIT 1;
	`, sessionID)
	return scanOrder(row)
}

func scanOrder(row interface{ Scan(...interface{}) error }) (*Order, error) {
	var o Order
	var bc, st, srv, pc sql.NullInt64
	var paidAt sql.NullString
	var createdAt, updatedAt string
	if err := row.Scan(&o.ID, &o.UserID, &o.OrderNumber, &bc, &st, &srv, &pc, &o.ProductLabel, &o.SubtotalCents, &o.DiscountCents, &o.TotalCents, &o.Currency, &o.BillingAddressJSON, &o.Provider, &o.ProviderSessionID, &o.ProviderPaymentID, &o.Status, &o.OrderStage, &o.ServerStage, &paidAt, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if bc.Valid { o.BillingCycleID = &bc.Int64 }
	if st.Valid { o.SupportTierID = &st.Int64 }
	if srv.Valid { o.ServerTierID = &srv.Int64 }
	if pc.Valid { o.PromoCodeID = &pc.Int64 }
	if paidAt.Valid && paidAt.String != "" {
		t, _ := parseTimeRFC3339(paidAt.String)
		o.PaidAt = &t
	}
	o.CreatedAt, _ = parseTimeRFC3339(createdAt)
	o.UpdatedAt, _ = parseTimeRFC3339(updatedAt)
	return &o, nil
}

func (s *Store) SetOrderProviderSession(ctx context.Context, orderID int64, sessionID string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.ExecContext(ctx, `UPDATE orders SET provider_session_id = ?, updated_at = ? WHERE id = ?;`, sessionID, now, orderID)
	return err
}

func (s *Store) MarkOrderPaid(ctx context.Context, orderID int64, providerPaymentID, hostedInvoiceURL string) error {
	now := time.Now().UTC()
	nowS := now.Format(time.RFC3339)
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `UPDATE orders SET status='paid', order_stage='processing', server_stage='starting', paid_at=?, provider_payment_id=?, updated_at=? WHERE id = ?;`, nowS, providerPaymentID, nowS, orderID); err != nil {
		return err
	}

	// Create an invoice record.
	var order Order
	var bc, st, srv, pc sql.NullInt64
	var paidAt sql.NullString
	var createdAt, updatedAt string
	if err := tx.QueryRowContext(ctx, `SELECT id, user_id, order_number, billing_cycle_id, support_tier_id, server_tier_id, promo_code_id, product_label, subtotal_cents, discount_cents, total_cents, currency, billing_address_json, provider, COALESCE(provider_session_id, ''), COALESCE(provider_payment_id, ''), status, order_stage, server_stage, paid_at, created_at, updated_at FROM orders WHERE id = ?;`, orderID).Scan(
		&order.ID, &order.UserID, &order.OrderNumber, &bc, &st, &srv, &pc, &order.ProductLabel, &order.SubtotalCents, &order.DiscountCents, &order.TotalCents, &order.Currency, &order.BillingAddressJSON, &order.Provider, &order.ProviderSessionID, &order.ProviderPaymentID, &order.Status, &order.OrderStage, &order.ServerStage, &paidAt, &createdAt, &updatedAt,
	); err != nil {
		return err
	}

	// Derive invoice number from order.
	invoiceNum := strings.Replace(order.OrderNumber, "GCSS-", "INV-", 1)
	if _, err := tx.ExecContext(ctx, `INSERT INTO invoices (order_id, user_id, invoice_number, provider, provider_invoice_id, hosted_invoice_url, product_label, amount_cents, currency, status, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?);`,
		orderID, order.UserID, invoiceNum, order.Provider, providerPaymentID, hostedInvoiceURL, order.ProductLabel, order.TotalCents, order.Currency, nowS, nowS); err != nil {
		return err
	}

	// Bump promo redemption if any.
	if pc.Valid {
		_, _ = tx.ExecContext(ctx, `UPDATE promo_codes SET redeemed_count = redeemed_count + 1 WHERE id = ?;`, pc.Int64)
	}

	return tx.Commit()
}

func (s *Store) ListOrdersForUser(ctx context.Context, userID int64) ([]Order, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, user_id, order_number, billing_cycle_id, support_tier_id, server_tier_id, promo_code_id, product_label, subtotal_cents, discount_cents, total_cents, currency, billing_address_json, provider, COALESCE(provider_session_id, ''), COALESCE(provider_payment_id, ''), status, order_stage, server_stage, paid_at, created_at, updated_at
		FROM orders WHERE user_id = ? ORDER BY created_at DESC;
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Order
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			return nil, err
		}
		if o != nil {
			out = append(out, *o)
		}
	}
	return out, rows.Err()
}

// ── Invoices ───────────────────────────────────────────────────────────

func (s *Store) ListInvoicesForUser(ctx context.Context, userID int64) ([]Invoice, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, COALESCE(order_id, 0), user_id, invoice_number, provider, COALESCE(provider_invoice_id, ''), COALESCE(hosted_invoice_url, ''), product_label, amount_cents, currency, status, paid_at, created_at
		FROM invoices WHERE user_id = ? ORDER BY created_at DESC;
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Invoice
	for rows.Next() {
		var inv Invoice
		var orderID int64
		var paidAt sql.NullString
		var createdAt string
		if err := rows.Scan(&inv.ID, &orderID, &inv.UserID, &inv.InvoiceNumber, &inv.Provider, &inv.ProviderInvoiceID, &inv.HostedInvoiceURL, &inv.ProductLabel, &inv.AmountCents, &inv.Currency, &inv.Status, &paidAt, &createdAt); err != nil {
			return nil, err
		}
		if orderID > 0 {
			inv.OrderID = &orderID
		}
		if paidAt.Valid && paidAt.String != "" {
			t, _ := parseTimeRFC3339(paidAt.String)
			inv.PaidAt = &t
		}
		inv.CreatedAt, _ = parseTimeRFC3339(createdAt)
		out = append(out, inv)
	}
	return out, rows.Err()
}

func (s *Store) GetInvoiceForUser(ctx context.Context, userID, invoiceID int64) (*Invoice, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, COALESCE(order_id, 0), user_id, invoice_number, provider, COALESCE(provider_invoice_id, ''), COALESCE(hosted_invoice_url, ''), product_label, amount_cents, currency, status, paid_at, created_at
		FROM invoices WHERE id = ? AND user_id = ?;
	`, invoiceID, userID)
	var inv Invoice
	var orderID int64
	var paidAt sql.NullString
	var createdAt string
	if err := row.Scan(&inv.ID, &orderID, &inv.UserID, &inv.InvoiceNumber, &inv.Provider, &inv.ProviderInvoiceID, &inv.HostedInvoiceURL, &inv.ProductLabel, &inv.AmountCents, &inv.Currency, &inv.Status, &paidAt, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if orderID > 0 {
		inv.OrderID = &orderID
	}
	if paidAt.Valid && paidAt.String != "" {
		t, _ := parseTimeRFC3339(paidAt.String)
		inv.PaidAt = &t
	}
	inv.CreatedAt, _ = parseTimeRFC3339(createdAt)
	return &inv, nil
}
