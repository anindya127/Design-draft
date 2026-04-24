package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type Store struct {
	db  *sql.DB
	enc *fieldEncryptor
}

type BlogPost struct {
	Slug            string    `json:"slug"`
	Title           string    `json:"title"`
	Excerpt         string    `json:"excerpt"`
	ContentMD       string    `json:"contentMd"`
	CoverURL        string    `json:"coverUrl,omitempty"`
	AuthorName      string    `json:"authorName"`
	PublishedAt     time.Time `json:"publishedAt"`
	UpdatedAt       time.Time `json:"updatedAt,omitempty"`
	Tags            []string  `json:"tags"`
	Status          string    `json:"status"`
	MetaTitle       string    `json:"metaTitle,omitempty"`
	MetaDescription string    `json:"metaDescription,omitempty"`
	SeoKeywords     string    `json:"seoKeywords,omitempty"`
	SeoSubKeywords  string    `json:"seoSubKeywords,omitempty"`
	OgImageURL      string    `json:"ogImageUrl,omitempty"`
}

type ForumCategory struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type ForumTopic struct {
	CategorySlug string    `json:"categorySlug"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	BodyMD       string    `json:"bodyMd"`
	TopicType    string    `json:"topicType"`
	AuthorName   string    `json:"authorName"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	Tags         []string  `json:"tags"`
	ReplyCount   int       `json:"replyCount"`
}

type ForumPost struct {
	ID         int64     `json:"id"`
	AuthorName string    `json:"authorName"`
	CreatedAt  time.Time `json:"createdAt"`
	BodyMD     string    `json:"bodyMd"`
	LikeCount  int       `json:"likeCount"`
	ParentID   *int64    `json:"parentId,omitempty"`
}

func Open(ctx context.Context, dbPath string, encryptionSecret ...string) (*Store, error) {
	if strings.TrimSpace(dbPath) == "" {
		return nil, errors.New("dbPath is empty")
	}
	// modernc.org/sqlite uses driver name "sqlite".
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=busy_timeout(5000)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// Reasonable limits for a small demo.
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(10 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	var enc *fieldEncryptor
	if len(encryptionSecret) > 0 && encryptionSecret[0] != "" {
		enc = newFieldEncryptor(encryptionSecret[0])
	}

	s := &Store{db: db, enc: enc}
	if err := s.migrate(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	if err := s.seedIfEmpty(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

func (s *Store) migrate(ctx context.Context) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			role TEXT NOT NULL DEFAULT 'user',
			first_name TEXT NOT NULL,
			last_name TEXT NOT NULL,
			phone TEXT NOT NULL,
			company TEXT,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token_hash TEXT NOT NULL UNIQUE,
			created_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			revoked_at TEXT,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`,
		`CREATE TABLE IF NOT EXISTS password_resets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			code_hash TEXT NOT NULL,
			created_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			used_at TEXT,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);`,
		`CREATE TABLE IF NOT EXISTS blog_posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE,
			cover_url TEXT,
			author_name TEXT NOT NULL,
			published_at TEXT NOT NULL,
			tags TEXT NOT NULL DEFAULT ''
		);`,
		`CREATE TABLE IF NOT EXISTS blog_post_i18n (
			post_id INTEGER NOT NULL,
			locale TEXT NOT NULL,
			title TEXT NOT NULL,
			excerpt TEXT NOT NULL,
			content_md TEXT NOT NULL,
			PRIMARY KEY (post_id, locale),
			FOREIGN KEY(post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS forum_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE
		);`,
		`CREATE TABLE IF NOT EXISTS forum_category_i18n (
			category_id INTEGER NOT NULL,
			locale TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT NOT NULL,
			PRIMARY KEY (category_id, locale),
			FOREIGN KEY(category_id) REFERENCES forum_categories(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS forum_topics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			category_id INTEGER NOT NULL,
			slug TEXT NOT NULL,
			author_name TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			tags TEXT NOT NULL DEFAULT '',
			reply_count INTEGER NOT NULL DEFAULT 0,
			UNIQUE(category_id, slug),
			FOREIGN KEY(category_id) REFERENCES forum_categories(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS forum_topic_i18n (
			topic_id INTEGER NOT NULL,
			locale TEXT NOT NULL,
			title TEXT NOT NULL,
			body_md TEXT NOT NULL,
			PRIMARY KEY (topic_id, locale),
			FOREIGN KEY(topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS forum_posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			topic_id INTEGER NOT NULL,
			parent_post_id INTEGER,
			author_name TEXT NOT NULL,
			created_at TEXT NOT NULL,
			like_count INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY(topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
			FOREIGN KEY(parent_post_id) REFERENCES forum_posts(id) ON DELETE SET NULL
		);`,
		`CREATE TABLE IF NOT EXISTS forum_post_i18n (
			post_id INTEGER NOT NULL,
			locale TEXT NOT NULL,
			body_md TEXT NOT NULL,
			PRIMARY KEY (post_id, locale),
			FOREIGN KEY(post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS form_requests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL,
			created_at TEXT NOT NULL,
			ip TEXT,
			ua TEXT,
			payload_json TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS app_secrets (
			key TEXT PRIMARY KEY,
			group_name TEXT NOT NULL,
			encrypted_value TEXT NOT NULL,
			last_four TEXT NOT NULL DEFAULT '',
			updated_at TEXT NOT NULL,
			updated_by INTEGER
		);`,
		`CREATE TABLE IF NOT EXISTS app_secret_audit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			key TEXT NOT NULL,
			action TEXT NOT NULL,
			actor_user_id INTEGER,
			ip TEXT,
			ua TEXT,
			created_at TEXT NOT NULL
		);`,
		`CREATE INDEX IF NOT EXISTS idx_app_secret_audit_created_at ON app_secret_audit(created_at);`,
		`CREATE TABLE IF NOT EXISTS email_changes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			new_email TEXT NOT NULL,
			new_email_hash TEXT NOT NULL,
			code_hash TEXT NOT NULL,
			created_at TEXT NOT NULL,
			expires_at TEXT NOT NULL,
			used_at TEXT,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_email_changes_user_id ON email_changes(user_id);`,
		`CREATE TABLE IF NOT EXISTS billing_cycles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			years INTEGER NOT NULL,
			label_en TEXT NOT NULL,
			label_zh TEXT NOT NULL DEFAULT '',
			multiplier REAL NOT NULL DEFAULT 1.0,
			is_active INTEGER NOT NULL DEFAULT 1,
			sort_order INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS support_tiers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			label_en TEXT NOT NULL,
			label_zh TEXT NOT NULL DEFAULT '',
			description_en TEXT NOT NULL DEFAULT '',
			description_zh TEXT NOT NULL DEFAULT '',
			price_cents INTEGER NOT NULL DEFAULT 0,
			pricing_type TEXT NOT NULL DEFAULT 'fixed',
			is_active INTEGER NOT NULL DEFAULT 1,
			sort_order INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS server_tiers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			label_en TEXT NOT NULL,
			label_zh TEXT NOT NULL DEFAULT '',
			max_chargers INTEGER NOT NULL,
			price_cents INTEGER NOT NULL,
			is_active INTEGER NOT NULL DEFAULT 1,
			sort_order INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS promo_codes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			code TEXT NOT NULL UNIQUE,
			discount_type TEXT NOT NULL,
			discount_value INTEGER NOT NULL,
			is_active INTEGER NOT NULL DEFAULT 1,
			max_redemptions INTEGER NOT NULL DEFAULT 0,
			redeemed_count INTEGER NOT NULL DEFAULT 0,
			valid_from TEXT,
			valid_until TEXT,
			created_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			order_number TEXT NOT NULL UNIQUE,
			billing_cycle_id INTEGER,
			support_tier_id INTEGER,
			server_tier_id INTEGER,
			promo_code_id INTEGER,
			product_label TEXT NOT NULL DEFAULT '',
			subtotal_cents INTEGER NOT NULL DEFAULT 0,
			discount_cents INTEGER NOT NULL DEFAULT 0,
			total_cents INTEGER NOT NULL DEFAULT 0,
			currency TEXT NOT NULL DEFAULT 'USD',
			billing_address_json TEXT NOT NULL DEFAULT '{}',
			provider TEXT NOT NULL DEFAULT '',
			provider_session_id TEXT,
			provider_payment_id TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			order_stage TEXT NOT NULL DEFAULT 'received',
			server_stage TEXT NOT NULL DEFAULT 'not_started',
			paid_at TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
		`CREATE INDEX IF NOT EXISTS idx_orders_provider_session ON orders(provider_session_id);`,
		`CREATE TABLE IF NOT EXISTS invoices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			order_id INTEGER,
			user_id INTEGER NOT NULL,
			invoice_number TEXT NOT NULL UNIQUE,
			provider TEXT NOT NULL,
			provider_invoice_id TEXT,
			hosted_invoice_url TEXT,
			product_label TEXT NOT NULL,
			amount_cents INTEGER NOT NULL,
			currency TEXT NOT NULL DEFAULT 'USD',
			status TEXT NOT NULL DEFAULT 'paid',
			paid_at TEXT,
			created_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
		);`,
		`CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);`,
		`CREATE TABLE IF NOT EXISTS user_servers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			order_id INTEGER,
			region TEXT NOT NULL DEFAULT 'ap-southeast-1',
			api_base_url TEXT NOT NULL DEFAULT '',
			api_key_hash TEXT NOT NULL DEFAULT '',
			api_key_last4 TEXT NOT NULL DEFAULT '',
			ocpp_endpoint TEXT NOT NULL DEFAULT '',
			webhook_url TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'provisioning',
			uptime_pct REAL NOT NULL DEFAULT 0,
			connected_chargers INTEGER NOT NULL DEFAULT 0,
			max_chargers INTEGER NOT NULL DEFAULT 0,
			last_backup_at TEXT,
			notes TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
		);`,
		`CREATE INDEX IF NOT EXISTS idx_user_servers_user_id ON user_servers(user_id);`,
	}
	for _, stmt := range stmts {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}

	// Lightweight forward migrations (SQLite): add new columns if they don't exist.
	// Ignore errors because SQLite doesn't support IF NOT EXISTS on ADD COLUMN in older versions.
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE forum_topics ADD COLUMN topic_type TEXT NOT NULL DEFAULT '';`)
	// Email hash for encrypted email lookups + account disable
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE users ADD COLUMN email_hash TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE users ADD COLUMN disabled_at TEXT;`)
	// User avatar + profile banner (customizable uploads)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE users ADD COLUMN cover_url TEXT NOT NULL DEFAULT '';`)
	// Blog post enhancements
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN meta_title TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN meta_description TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN og_image_url TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN seo_keywords TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN seo_sub_keywords TEXT NOT NULL DEFAULT '';`)
	// Per-user vote tracking
	_, _ = s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS forum_votes (
		user_id INTEGER NOT NULL,
		post_id INTEGER NOT NULL,
		value INTEGER NOT NULL,
		created_at TEXT NOT NULL,
		PRIMARY KEY (user_id, post_id),
		FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY(post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
	);`)
	// Backfill updated_at for existing rows
	_, _ = s.db.ExecContext(ctx, `UPDATE blog_posts SET updated_at = published_at WHERE updated_at = '';`)

	// Deposit / balance tracking on orders — used for platform plans where
	// the customer pays a $200 deposit online and the balance via bank
	// transfer, and for bank-transfer-only orders > $1,500.
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE orders ADD COLUMN deposit_cents INTEGER NOT NULL DEFAULT 0;`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE orders ADD COLUMN balance_cents INTEGER NOT NULL DEFAULT 0;`)

	// Bank accounts advertised to customers picking the bank-transfer
	// payment method. Multiple rows allowed (HSBC, BOC, etc.) — only
	// is_active=1 rows are shown publicly.
	_, _ = s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS bank_accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		label TEXT NOT NULL DEFAULT '',
		bank_name TEXT NOT NULL DEFAULT '',
		account_name TEXT NOT NULL DEFAULT '',
		account_number TEXT NOT NULL DEFAULT '',
		swift_code TEXT NOT NULL DEFAULT '',
		iban TEXT NOT NULL DEFAULT '',
		bank_address TEXT NOT NULL DEFAULT '',
		currency TEXT NOT NULL DEFAULT 'USD',
		notes TEXT NOT NULL DEFAULT '',
		is_active INTEGER NOT NULL DEFAULT 1,
		sort_order INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);`)

	// Bank transfer slips uploaded by customers as proof of wire. Admin
	// reviews these and flips the order to paid once verified. One order
	// can have multiple slips (e.g. deposit slip + balance slip).
	_, _ = s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS bank_slips (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		order_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		kind TEXT NOT NULL DEFAULT 'balance',
		amount_cents INTEGER NOT NULL DEFAULT 0,
		currency TEXT NOT NULL DEFAULT 'USD',
		bank_name TEXT NOT NULL DEFAULT '',
		reference_note TEXT NOT NULL DEFAULT '',
		slip_url TEXT NOT NULL DEFAULT '',
		status TEXT NOT NULL DEFAULT 'review',
		admin_notes TEXT NOT NULL DEFAULT '',
		reviewed_by INTEGER,
		reviewed_at TEXT,
		created_at TEXT NOT NULL,
		FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
		FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
	);`)
	_, _ = s.db.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS idx_bank_slips_order ON bank_slips(order_id);`)
	_, _ = s.db.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS idx_bank_slips_status ON bank_slips(status);`)

	return nil
}

func (s *Store) seedIfEmpty(ctx context.Context) error {
	// Seed product catalog (idempotent — only seeds if tables are empty)
	if err := s.seedCatalog(ctx); err != nil {
		return err
	}

	// Always ensure admin user exists
	var adminCount int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM users WHERE username = 'admin';`).Scan(&adminCount); err != nil {
		return err
	}
	if adminCount == 0 {
		// Seed admin user even if blog posts already exist
		adminPwHash, err := hashPassword("admin")
		if err != nil {
			return err
		}
		createdAt := time.Now().UTC().Format(time.RFC3339)
		encEmail := s.enc.Encrypt("admin@gcss.hk")
		emailHash := s.enc.HashForLookup("admin@gcss.hk")
		encFirstName := s.enc.Encrypt("System")
		encLastName := s.enc.Encrypt("Admin")
		encPhone := s.enc.Encrypt("+86-000-0000")
		encCompany := s.enc.Encrypt("GCSS")
		_, _ = s.db.ExecContext(ctx, `
			INSERT OR IGNORE INTO users (username, email, email_hash, role, first_name, last_name, phone, company, password_hash, created_at)
			VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, ?, ?);
		`, "admin", encEmail, emailHash, encFirstName, encLastName, encPhone, encCompany, adminPwHash, createdAt)
	}

	var n int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM blog_posts;`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	return s.seed(ctx)
}

// tags are stored as a pipe-delimited string: |tag1|tag2|
func encodeTags(tags []string) string {
	clean := make([]string, 0, len(tags))
	for _, t := range tags {
		t = strings.ToLower(strings.TrimSpace(t))
		if t == "" {
			continue
		}
		clean = append(clean, t)
	}
	if len(clean) == 0 {
		return ""
	}
	return "|" + strings.Join(clean, "|") + "|"
}

func decodeTags(s string) []string {
	parts := strings.Split(s, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		out = append(out, p)
	}
	return out
}
