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
	db *sql.DB
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

func Open(ctx context.Context, dbPath string) (*Store, error) {
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

	s := &Store{db: db}
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
	// Blog post enhancements
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN meta_title TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN meta_description TEXT NOT NULL DEFAULT '';`)
	_, _ = s.db.ExecContext(ctx, `ALTER TABLE blog_posts ADD COLUMN og_image_url TEXT NOT NULL DEFAULT '';`)
	// Backfill updated_at for existing rows
	_, _ = s.db.ExecContext(ctx, `UPDATE blog_posts SET updated_at = published_at WHERE updated_at = '';`)
	return nil
}

func (s *Store) seedIfEmpty(ctx context.Context) error {
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
