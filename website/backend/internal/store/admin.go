package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
)

type AdminOverview struct {
	UsersTotal        int `json:"usersTotal"`
	AdminsTotal       int `json:"adminsTotal"`
	SessionsActive    int `json:"sessionsActive"`
	FormRequestsTotal int `json:"formRequestsTotal"`
	BlogPostsTotal    int `json:"blogPostsTotal"`
	ForumTopicsTotal  int `json:"forumTopicsTotal"`
	ForumPostsTotal   int `json:"forumPostsTotal"`
}

func (s *Store) GetAdminOverview(ctx context.Context) (AdminOverview, error) {
	var out AdminOverview
	if s == nil || s.db == nil {
		return out, ErrUnauthorized
	}

	now := time.Now().UTC().Format(time.RFC3339)

	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM users;`).Scan(&out.UsersTotal)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM users WHERE role = 'admin';`).Scan(&out.AdminsTotal)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM sessions WHERE revoked_at IS NULL AND expires_at > ?;`, now).Scan(&out.SessionsActive)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM form_requests;`).Scan(&out.FormRequestsTotal)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM blog_posts;`).Scan(&out.BlogPostsTotal)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM forum_topics;`).Scan(&out.ForumTopicsTotal)
	_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM forum_posts;`).Scan(&out.ForumPostsTotal)

	return out, nil
}

// ── User Management ──────────────────────────────

type AdminUser struct {
	ID         int64      `json:"id"`
	Username   string     `json:"username"`
	Email      string     `json:"email"`
	Role       string     `json:"role"`
	FirstName  string     `json:"firstName"`
	LastName   string     `json:"lastName"`
	Phone      string     `json:"phone"`
	Company    string     `json:"company,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	DisabledAt *time.Time `json:"disabledAt,omitempty"`
}

func (s *Store) ListUsers(ctx context.Context) ([]AdminUser, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, username, email, role, first_name, last_name, phone, company, created_at, disabled_at
		FROM users ORDER BY created_at DESC;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AdminUser
	for rows.Next() {
		var u AdminUser
		var createdAt string
		var disabledAt sql.NullString
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.Phone, &u.Company, &createdAt, &disabledAt); err != nil {
			return nil, err
		}
		u.CreatedAt, _ = parseTimeRFC3339(createdAt)
		if disabledAt.Valid && disabledAt.String != "" {
			t, _ := parseTimeRFC3339(disabledAt.String)
			u.DisabledAt = &t
		}
		// Decrypt PII
		u.Email = s.enc.Decrypt(u.Email)
		u.FirstName = s.enc.Decrypt(u.FirstName)
		u.LastName = s.enc.Decrypt(u.LastName)
		u.Phone = s.enc.Decrypt(u.Phone)
		u.Company = s.enc.Decrypt(u.Company)
		out = append(out, u)
	}
	return out, rows.Err()
}

func (s *Store) SetUserRole(ctx context.Context, userID int64, role string) error {
	role = strings.ToLower(strings.TrimSpace(role))
	if role != "admin" && role != "user" {
		return errors.New("role must be 'admin' or 'user'")
	}
	res, err := s.db.ExecContext(ctx, `UPDATE users SET role = ? WHERE id = ?;`, role, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (s *Store) SetUserDisabled(ctx context.Context, userID int64, disabled bool) error {
	var disabledAt interface{}
	if disabled {
		disabledAt = time.Now().UTC().Format(time.RFC3339)
	}
	res, err := s.db.ExecContext(ctx, `UPDATE users SET disabled_at = ? WHERE id = ?;`, disabledAt, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("user not found")
	}
	// Revoke all sessions if disabling
	if disabled {
		now := time.Now().UTC().Format(time.RFC3339)
		_, _ = s.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL;`, now, userID)
	}
	return nil
}

// ── Forum Moderation ─────────────────────────────

type AdminForumTopic struct {
	ID           int64     `json:"id"`
	CategorySlug string    `json:"categorySlug"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	AuthorName   string    `json:"authorName"`
	CreatedAt    time.Time `json:"createdAt"`
	ReplyCount   int       `json:"replyCount"`
}

func (s *Store) ListAdminForumTopics(ctx context.Context, locale string) ([]AdminForumTopic, error) {
	locale = normalizeLocale(locale)
	rows, err := s.db.QueryContext(ctx, `
		SELECT t.id, c.slug, t.slug, i.title, t.author_name, t.created_at, t.reply_count
		FROM forum_topics t
		JOIN forum_categories c ON c.id = t.category_id
		JOIN forum_topic_i18n i ON i.topic_id = t.id AND i.locale = ?
		ORDER BY t.created_at DESC;`, locale)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AdminForumTopic
	for rows.Next() {
		var t AdminForumTopic
		var createdAt string
		if err := rows.Scan(&t.ID, &t.CategorySlug, &t.Slug, &t.Title, &t.AuthorName, &createdAt, &t.ReplyCount); err != nil {
			return nil, err
		}
		t.CreatedAt, _ = parseTimeRFC3339(createdAt)
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) DeleteForumTopic(ctx context.Context, topicID int64) error {
	if topicID <= 0 {
		return errors.New("invalid topic id")
	}
	res, err := s.db.ExecContext(ctx, `DELETE FROM forum_topics WHERE id = ?;`, topicID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("topic not found")
	}
	return nil
}

func (s *Store) DeleteForumPost(ctx context.Context, postID int64) error {
	if postID <= 0 {
		return errors.New("invalid post id")
	}
	// Get topic ID to decrement reply count
	var topicID int64
	if err := s.db.QueryRowContext(ctx, `SELECT topic_id FROM forum_posts WHERE id = ?;`, postID).Scan(&topicID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("post not found")
		}
		return err
	}
	if _, err := s.db.ExecContext(ctx, `DELETE FROM forum_posts WHERE id = ?;`, postID); err != nil {
		return err
	}
	_, _ = s.db.ExecContext(ctx, `UPDATE forum_topics SET reply_count = MAX(0, reply_count - 1) WHERE id = ?;`, topicID)
	return nil
}

// ── Audit: Form Requests ─────────────────────────

type FormRequestRecord struct {
	ID          int64     `json:"id"`
	Type        string    `json:"type"`
	CreatedAt   time.Time `json:"createdAt"`
	IP          string    `json:"ip"`
	UA          string    `json:"ua"`
	PayloadJSON string    `json:"payload"`
}

func (s *Store) ListFormRequests(ctx context.Context, reqType string, limit int) ([]FormRequestRecord, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	reqType = strings.ToLower(strings.TrimSpace(reqType))

	var rows *sql.Rows
	var err error
	if reqType == "" {
		rows, err = s.db.QueryContext(ctx, `
			SELECT id, type, created_at, ip, ua, payload_json
			FROM form_requests ORDER BY created_at DESC LIMIT ?;`, limit)
	} else {
		rows, err = s.db.QueryContext(ctx, `
			SELECT id, type, created_at, ip, ua, payload_json
			FROM form_requests WHERE type = ? ORDER BY created_at DESC LIMIT ?;`, reqType, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []FormRequestRecord
	for rows.Next() {
		var r FormRequestRecord
		var createdAt string
		if err := rows.Scan(&r.ID, &r.Type, &createdAt, &r.IP, &r.UA, &r.PayloadJSON); err != nil {
			return nil, err
		}
		r.CreatedAt, _ = parseTimeRFC3339(createdAt)
		out = append(out, r)
	}
	return out, rows.Err()
}
