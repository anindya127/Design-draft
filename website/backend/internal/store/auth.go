package store

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrInvalidResetCode   = errors.New("invalid reset code")
)

type AuthUser struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Phone     string    `json:"phone"`
	Company   string    `json:"company,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type AuthSession struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
}

const (
	passwordIterations = 120000
	passwordSaltBytes  = 16
	passwordKeyBytes   = 32
)

func (s *Store) CreateUser(ctx context.Context, username, email, firstName, lastName, phone, company, password string) (*AuthUser, error) {
	username = strings.TrimSpace(username)
	email = strings.ToLower(strings.TrimSpace(email))
	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)
	phone = strings.TrimSpace(phone)
	company = strings.TrimSpace(company)
	password = strings.TrimSpace(password)

	if username == "" || email == "" || firstName == "" || lastName == "" || phone == "" || password == "" {
		return nil, errors.New("missing required fields")
	}
	if len(password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	hash, err := hashPassword(password)
	if err != nil {
		return nil, err
	}

	// Bootstrap: ensure there's at least one admin (local demo convenience).
	role := "user"
	var admins int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM users WHERE role = 'admin';`).Scan(&admins); err == nil {
		if admins == 0 {
			role = "admin"
		}
	}
	createdAt := time.Now().UTC()

	// Encrypt PII fields
	emailHash := s.enc.HashForLookup(email)
	encEmail := s.enc.Encrypt(email)
	encFirstName := s.enc.Encrypt(firstName)
	encLastName := s.enc.Encrypt(lastName)
	encPhone := s.enc.Encrypt(phone)
	encCompany := s.enc.Encrypt(company)

	res, err := s.db.ExecContext(ctx, `
		INSERT INTO users (username, email, email_hash, role, first_name, last_name, phone, company, password_hash, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`, username, encEmail, emailHash, role, encFirstName, encLastName, encPhone, encCompany, hash, createdAt.Format(time.RFC3339))
	if err != nil {
		if isUniqueConstraint(err) {
			return nil, errors.New("username or email already exists")
		}
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &AuthUser{ID: id, Username: username, Email: email, Role: role, FirstName: firstName, LastName: lastName, Phone: phone, Company: company, CreatedAt: createdAt}, nil
}

func (s *Store) AuthenticateUser(ctx context.Context, identifier, password string) (*AuthUser, error) {
	identifier = strings.TrimSpace(identifier)
	password = strings.TrimSpace(password)
	if identifier == "" || password == "" {
		return nil, ErrInvalidCredentials
	}
	idLower := strings.ToLower(identifier)

	// Look up by username directly, or by email_hash for encrypted email lookup
	emailHash := s.enc.HashForLookup(idLower)

	var u AuthUser
	var createdAt string
	var passwordHash string
	var disabledAt sql.NullString
	row := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, role, first_name, last_name, phone, company, password_hash, created_at, disabled_at
		FROM users
		WHERE username = ? OR email_hash = ? OR email = ?
		LIMIT 1;
	`, identifier, emailHash, idLower)
	if err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.Phone, &u.Company, &passwordHash, &createdAt, &disabledAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	ct, err := parseTimeRFC3339(createdAt)
	if err != nil {
		return nil, err
	}
	u.CreatedAt = ct

	// Block disabled accounts
	if disabledAt.Valid && disabledAt.String != "" {
		return nil, errors.New("account is disabled")
	}

	if !verifyPassword(passwordHash, password) {
		return nil, ErrInvalidCredentials
	}

	// Decrypt PII fields for the response
	u.Email = s.enc.Decrypt(u.Email)
	u.FirstName = s.enc.Decrypt(u.FirstName)
	u.LastName = s.enc.Decrypt(u.LastName)
	u.Phone = s.enc.Decrypt(u.Phone)
	u.Company = s.enc.Decrypt(u.Company)

	return &u, nil
}

func (s *Store) CreateSession(ctx context.Context, userID int64, ttl time.Duration) (*AuthSession, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user id")
	}
	if ttl <= 0 {
		ttl = 30 * 24 * time.Hour
	}

	token, err := newToken(32)
	if err != nil {
		return nil, err
	}
	tokenHash := hashToken(token)

	createdAt := time.Now().UTC()
	expiresAt := createdAt.Add(ttl)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
		VALUES (?, ?, ?, ?);
	`, userID, tokenHash, createdAt.Format(time.RFC3339), expiresAt.Format(time.RFC3339))
	if err != nil {
		return nil, err
	}

	return &AuthSession{Token: token, ExpiresAt: expiresAt}, nil
}

func (s *Store) GetUserBySessionToken(ctx context.Context, token string) (*AuthUser, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, ErrUnauthorized
	}
	now := time.Now().UTC().Format(time.RFC3339)
	tokenHash := hashToken(token)

	var u AuthUser
	var createdAt string
	row := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.phone, u.company, u.created_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ?
		  AND s.revoked_at IS NULL
		  AND s.expires_at > ?
		LIMIT 1;
	`, tokenHash, now)
	if err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.Phone, &u.Company, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}
	ct, err := parseTimeRFC3339(createdAt)
	if err != nil {
		return nil, err
	}
	u.CreatedAt = ct

	// Decrypt PII fields
	u.Email = s.enc.Decrypt(u.Email)
	u.FirstName = s.enc.Decrypt(u.FirstName)
	u.LastName = s.enc.Decrypt(u.LastName)
	u.Phone = s.enc.Decrypt(u.Phone)
	u.Company = s.enc.Decrypt(u.Company)

	return &u, nil
}

func (s *Store) RevokeSession(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil
	}
	tokenHash := hashToken(token)
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.ExecContext(ctx, `UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL;`, now, tokenHash)
	return err
}

func (s *Store) CreatePasswordReset(ctx context.Context, email string, ttl time.Duration) (code string, expiresAt time.Time, userFound bool, err error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return "", time.Time{}, false, errors.New("email is required")
	}
	if ttl <= 0 {
		ttl = 15 * time.Minute
	}

	emailHash := s.enc.HashForLookup(email)

	var userID int64
	row := s.db.QueryRowContext(ctx, `SELECT id FROM users WHERE email_hash = ? OR email = ? LIMIT 1;`, emailHash, email)
	if scanErr := row.Scan(&userID); scanErr != nil {
		if errors.Is(scanErr, sql.ErrNoRows) {
			// Return success semantics (don't leak whether a user exists).
			return "", time.Now().UTC().Add(ttl), false, nil
		}
		return "", time.Time{}, false, scanErr
	}

	code, err = newNumericCode(6)
	if err != nil {
		return "", time.Time{}, false, err
	}
	codeHash := hashToken(code)
	createdAt := time.Now().UTC()
	expiresAt = createdAt.Add(ttl)

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO password_resets (user_id, code_hash, created_at, expires_at)
		VALUES (?, ?, ?, ?);
	`, userID, codeHash, createdAt.Format(time.RFC3339), expiresAt.Format(time.RFC3339))
	if err != nil {
		return "", time.Time{}, false, err
	}
	return code, expiresAt, true, nil
}

func (s *Store) ResetPasswordWithCode(ctx context.Context, email, code, newPassword string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	code = strings.TrimSpace(code)
	newPassword = strings.TrimSpace(newPassword)
	if email == "" || code == "" || newPassword == "" {
		return errors.New("missing required fields")
	}
	if len(newPassword) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	nowS := now.Format(time.RFC3339)
	codeHash := hashToken(code)
	emailHash := s.enc.HashForLookup(email)

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var userID int64
	row := tx.QueryRowContext(ctx, `SELECT id FROM users WHERE email_hash = ? OR email = ? LIMIT 1;`, emailHash, email)
	if err := row.Scan(&userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvalidResetCode
		}
		return err
	}

	res, err := tx.ExecContext(ctx, `
		UPDATE password_resets
		SET used_at = ?
		WHERE user_id = ?
		  AND code_hash = ?
		  AND used_at IS NULL
		  AND expires_at > ?;
	`, nowS, userID, codeHash, nowS)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrInvalidResetCode
	}

	if _, err := tx.ExecContext(ctx, `UPDATE users SET password_hash = ? WHERE id = ?;`, hash, userID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}

// UpdateUserProfile updates mutable profile fields for the given user.
func (s *Store) UpdateUserProfile(ctx context.Context, userID int64, firstName, lastName, phone, company string) (*AuthUser, error) {
	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)
	phone = strings.TrimSpace(phone)
	company = strings.TrimSpace(company)

	if firstName == "" || lastName == "" {
		return nil, errors.New("first name and last name are required")
	}

	// Encrypt before storing
	encFirstName := s.enc.Encrypt(firstName)
	encLastName := s.enc.Encrypt(lastName)
	encPhone := s.enc.Encrypt(phone)
	encCompany := s.enc.Encrypt(company)

	_, err := s.db.ExecContext(ctx, `
		UPDATE users SET first_name = ?, last_name = ?, phone = ?, company = ? WHERE id = ?;
	`, encFirstName, encLastName, encPhone, encCompany, userID)
	if err != nil {
		return nil, err
	}

	var u AuthUser
	var createdAt string
	row := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, role, first_name, last_name, phone, company, created_at
		FROM users WHERE id = ?;
	`, userID)
	if err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.Phone, &u.Company, &createdAt); err != nil {
		return nil, err
	}
	u.CreatedAt, _ = parseTimeRFC3339(createdAt)

	// Decrypt for response
	u.Email = s.enc.Decrypt(u.Email)
	u.FirstName = s.enc.Decrypt(u.FirstName)
	u.LastName = s.enc.Decrypt(u.LastName)
	u.Phone = s.enc.Decrypt(u.Phone)
	u.Company = s.enc.Decrypt(u.Company)

	return &u, nil
}

// RequestEmailChange generates a verification code for changing the account email.
// Returns the plaintext code (the caller emails it to newEmail), expiry, and ok=true.
// If newEmail is already in use by another account, returns ErrEmailInUse.
var ErrEmailInUse = errors.New("email already in use")

func (s *Store) RequestEmailChange(ctx context.Context, userID int64, newEmail string, ttl time.Duration) (code string, expiresAt time.Time, err error) {
	newEmail = strings.ToLower(strings.TrimSpace(newEmail))
	if newEmail == "" {
		return "", time.Time{}, errors.New("new email is required")
	}
	if !strings.Contains(newEmail, "@") || len(newEmail) < 5 {
		return "", time.Time{}, errors.New("invalid email format")
	}
	if ttl <= 0 {
		ttl = 30 * time.Minute
	}

	// Check uniqueness against OTHER users.
	newHash := s.enc.HashForLookup(newEmail)
	var existingID int64
	row := s.db.QueryRowContext(ctx, `SELECT id FROM users WHERE (email_hash = ? OR email = ?) AND id != ? LIMIT 1;`, newHash, newEmail, userID)
	if err := row.Scan(&existingID); err == nil && existingID > 0 {
		return "", time.Time{}, ErrEmailInUse
	}

	code, err = newNumericCode(6)
	if err != nil {
		return "", time.Time{}, err
	}
	codeHash := hashToken(code)
	now := time.Now().UTC()
	expiresAt = now.Add(ttl)

	// Invalidate previous pending changes for this user.
	_, _ = s.db.ExecContext(ctx, `UPDATE email_changes SET used_at = ? WHERE user_id = ? AND used_at IS NULL;`, now.Format(time.RFC3339), userID)

	encNewEmail := s.enc.Encrypt(newEmail)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO email_changes (user_id, new_email, new_email_hash, code_hash, created_at, expires_at)
		VALUES (?, ?, ?, ?, ?, ?);
	`, userID, encNewEmail, newHash, codeHash, now.Format(time.RFC3339), expiresAt.Format(time.RFC3339))
	if err != nil {
		return "", time.Time{}, err
	}
	return code, expiresAt, nil
}

// ConfirmEmailChange verifies the code and applies the pending email change.
func (s *Store) ConfirmEmailChange(ctx context.Context, userID int64, code string) error {
	code = strings.TrimSpace(code)
	if code == "" {
		return errors.New("code is required")
	}
	codeHash := hashToken(code)
	now := time.Now().UTC()
	nowS := now.Format(time.RFC3339)

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var encNewEmail, newHash string
	row := tx.QueryRowContext(ctx, `
		SELECT new_email, new_email_hash FROM email_changes
		WHERE user_id = ? AND code_hash = ? AND used_at IS NULL AND expires_at > ?
		ORDER BY created_at DESC LIMIT 1;
	`, userID, codeHash, nowS)
	if err := row.Scan(&encNewEmail, &newHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvalidResetCode
		}
		return err
	}

	// Re-check uniqueness under lock.
	var conflictID int64
	_ = tx.QueryRowContext(ctx, `SELECT id FROM users WHERE email_hash = ? AND id != ? LIMIT 1;`, newHash, userID).Scan(&conflictID)
	if conflictID > 0 {
		return ErrEmailInUse
	}

	if _, err := tx.ExecContext(ctx, `UPDATE users SET email = ?, email_hash = ? WHERE id = ?;`, encNewEmail, newHash, userID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE email_changes SET used_at = ? WHERE user_id = ? AND code_hash = ?;`, nowS, userID, codeHash); err != nil {
		return err
	}
	return tx.Commit()
}

// ChangePassword verifies the current password and sets a new one.
func (s *Store) ChangePassword(ctx context.Context, userID int64, currentPassword, newPassword string) error {
	currentPassword = strings.TrimSpace(currentPassword)
	newPassword = strings.TrimSpace(newPassword)
	if currentPassword == "" || newPassword == "" {
		return errors.New("both current and new password are required")
	}
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	var storedHash string
	row := s.db.QueryRowContext(ctx, `SELECT password_hash FROM users WHERE id = ?;`, userID)
	if err := row.Scan(&storedHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvalidCredentials
		}
		return err
	}

	if !verifyPassword(storedHash, currentPassword) {
		return ErrInvalidCredentials
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, `UPDATE users SET password_hash = ? WHERE id = ?;`, hash, userID)
	return err
}

// UserDashboard holds stats visible to a logged-in user about their own activity.
type UserDashboard struct {
	ForumTopics    int              `json:"forumTopics"`
	ForumPosts     int              `json:"forumPosts"`
	ActiveSessions int              `json:"activeSessions"`
	RecentTopics   []UserForumTopic `json:"recentTopics"`
}

type UserForumTopic struct {
	CategorySlug string    `json:"categorySlug"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	CreatedAt    time.Time `json:"createdAt"`
	ReplyCount   int       `json:"replyCount"`
}

// GetUserDashboard returns activity stats for a specific user.
func (s *Store) GetUserDashboard(ctx context.Context, userID int64) (*UserDashboard, error) {
	d := &UserDashboard{}
	now := time.Now().UTC().Format(time.RFC3339)

	var username string
	_ = s.db.QueryRowContext(ctx, `SELECT username FROM users WHERE id = ?;`, userID).Scan(&username)

	if username != "" {
		_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM forum_topics WHERE author_name = ?;`, username).Scan(&d.ForumTopics)
		_ = s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM forum_posts WHERE author_name = ?;`, username).Scan(&d.ForumPosts)

		// Recent topics by this user
		rows, err := s.db.QueryContext(ctx, `
			SELECT c.slug, t.slug, i.title, t.created_at, t.reply_count
			FROM forum_topics t
			JOIN forum_categories c ON c.id = t.category_id
			JOIN forum_topic_i18n i ON i.topic_id = t.id AND i.locale = 'en'
			WHERE t.author_name = ?
			ORDER BY t.created_at DESC LIMIT 5;`, username)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var ft UserForumTopic
				var createdAt string
				if err := rows.Scan(&ft.CategorySlug, &ft.Slug, &ft.Title, &createdAt, &ft.ReplyCount); err == nil {
					ft.CreatedAt, _ = parseTimeRFC3339(createdAt)
					d.RecentTopics = append(d.RecentTopics, ft)
				}
			}
		}
	}
	if d.RecentTopics == nil {
		d.RecentTopics = []UserForumTopic{}
	}

	_ = s.db.QueryRowContext(ctx, `
		SELECT COUNT(1) FROM sessions
		WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?;
	`, userID, now).Scan(&d.ActiveSessions)

	return d, nil
}

func newToken(bytes int) (string, error) {
	b := make([]byte, bytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func newNumericCode(digits int) (string, error) {
	if digits <= 0 || digits > 10 {
		return "", fmt.Errorf("invalid digits: %d", digits)
	}
	max := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(digits)), nil)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	// zero-pad
	format := fmt.Sprintf("%%0%dd", digits)
	return fmt.Sprintf(format, n.Int64()), nil
}

func isUniqueConstraint(err error) bool {
	// modernc sqlite errors are generally stringly typed; keep it simple.
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unique constraint failed")
}

func hashPassword(password string) (string, error) {
	password = strings.TrimSpace(password)
	if password == "" {
		return "", errors.New("password is empty")
	}
	// Format: pbkdf2_sha256$<iters>$<salt_b64>$<hash_b64>
	salt := make([]byte, passwordSaltBytes)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	dk := pbkdf2Sha256([]byte(password), salt, passwordIterations, passwordKeyBytes)
	return fmt.Sprintf(
		"pbkdf2_sha256$%d$%s$%s",
		passwordIterations,
		base64.RawURLEncoding.EncodeToString(salt),
		base64.RawURLEncoding.EncodeToString(dk),
	), nil
}

func verifyPassword(stored string, password string) bool {
	stored = strings.TrimSpace(stored)
	password = strings.TrimSpace(password)
	if stored == "" || password == "" {
		return false
	}
	parts := strings.Split(stored, "$")
	if len(parts) != 4 {
		return false
	}
	if parts[0] != "pbkdf2_sha256" {
		return false
	}
	var iters int
	if _, err := fmt.Sscanf(parts[1], "%d", &iters); err != nil {
		return false
	}
	if iters < 10000 {
		return false
	}
	salt, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}
	expected, err := base64.RawURLEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	actual := pbkdf2Sha256([]byte(password), salt, iters, len(expected))
	return subtle.ConstantTimeCompare(expected, actual) == 1
}

// Minimal PBKDF2 implementation (HMAC-SHA256) using only the standard library.
// Reference: RFC 8018.
func pbkdf2Sha256(password, salt []byte, iterations, keyLen int) []byte {
	if iterations <= 0 {
		iterations = 1
	}
	if keyLen <= 0 {
		return []byte{}
	}
	hLen := sha256.Size
	nBlocks := (keyLen + hLen - 1) / hLen
	out := make([]byte, 0, nBlocks*hLen)

	var block [4]byte
	for i := 1; i <= nBlocks; i++ {
		block[0] = byte(i >> 24)
		block[1] = byte(i >> 16)
		block[2] = byte(i >> 8)
		block[3] = byte(i)

		mac := hmac.New(sha256.New, password)
		_, _ = mac.Write(salt)
		_, _ = mac.Write(block[:])
		u := mac.Sum(nil)

		t := make([]byte, len(u))
		copy(t, u)

		for j := 2; j <= iterations; j++ {
			mac = hmac.New(sha256.New, password)
			_, _ = mac.Write(u)
			u = mac.Sum(nil)
			for k := 0; k < len(t); k++ {
				t[k] ^= u[k]
			}
		}
		out = append(out, t...)
	}

	return out[:keyLen]
}
