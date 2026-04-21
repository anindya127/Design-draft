package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"
)

func normalizeLocale(locale string) string {
	locale = strings.ToLower(strings.TrimSpace(locale))
	switch locale {
	case "zh", "zh-cn", "zh-hans":
		return "zh"
	default:
		return "en"
	}
}

func parseTimeRFC3339(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}

// scanBlogPost scans a blog post row with the new columns (status, updated_at, meta_*, og_image_url).
func scanBlogPost(rows interface{ Scan(...any) error }, locale string) (BlogPost, error) {
	var bp BlogPost
	var publishedAt, updatedAt, tags, status, metaTitle, metaDesc, ogImage string
	if err := rows.Scan(&bp.Slug, &bp.Title, &bp.Excerpt, &bp.ContentMD, &bp.CoverURL, &bp.AuthorName,
		&publishedAt, &updatedAt, &tags, &status, &metaTitle, &metaDesc, &ogImage); err != nil {
		return bp, err
	}
	bp.PublishedAt, _ = parseTimeRFC3339(publishedAt)
	if updatedAt != "" {
		bp.UpdatedAt, _ = parseTimeRFC3339(updatedAt)
	}
	bp.Tags = decodeTags(tags)
	bp.Status = status
	bp.MetaTitle = metaTitle
	bp.MetaDescription = metaDesc
	bp.OgImageURL = ogImage
	return bp, nil
}

const blogSelectCols = `p.slug, i.title, i.excerpt, i.content_md, p.cover_url, p.author_name,
	p.published_at, p.updated_at, p.tags, p.status, p.meta_title, p.meta_description, p.og_image_url`

// ListAdminBlogPosts returns all posts (including drafts) for the admin panel.
func (s *Store) ListAdminBlogPosts(ctx context.Context, locale string) ([]BlogPost, error) {
	locale = normalizeLocale(locale)
	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT %s
		FROM blog_posts p
		JOIN blog_post_i18n i ON i.post_id = p.id AND i.locale = ?
		ORDER BY p.published_at DESC;`, blogSelectCols), locale)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []BlogPost{}
	for rows.Next() {
		bp, err := scanBlogPost(rows, locale)
		if err != nil {
			return nil, err
		}
		out = append(out, bp)
	}
	return out, rows.Err()
}

// CreateBlogPost creates a new blog post with i18n content for the given locale.
func (s *Store) CreateBlogPost(ctx context.Context, locale string, bp BlogPost) (*BlogPost, error) {
	locale = normalizeLocale(locale)
	slug := strings.TrimSpace(bp.Slug)
	if slug == "" {
		slug = slugifyTitle(bp.Title)
	}
	if slug == "" {
		return nil, errors.New("slug is required")
	}
	if strings.TrimSpace(bp.Title) == "" {
		return nil, errors.New("title is required")
	}
	if strings.TrimSpace(bp.ContentMD) == "" {
		return nil, errors.New("content is required")
	}
	if bp.AuthorName == "" {
		bp.AuthorName = "GCSS Team"
	}
	if bp.Status == "" {
		bp.Status = "draft"
	}

	now := time.Now().UTC()
	if bp.PublishedAt.IsZero() {
		bp.PublishedAt = now
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	res, err := tx.ExecContext(ctx, `
		INSERT INTO blog_posts (slug, cover_url, author_name, published_at, updated_at, tags, status, meta_title, meta_description, og_image_url)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
		slug, bp.CoverURL, bp.AuthorName,
		bp.PublishedAt.Format(time.RFC3339), now.Format(time.RFC3339),
		encodeTags(bp.Tags), bp.Status, bp.MetaTitle, bp.MetaDescription, bp.OgImageURL)
	if err != nil {
		if isUniqueConstraint(err) {
			return nil, errors.New("a post with this slug already exists")
		}
		return nil, err
	}
	postID, _ := res.LastInsertId()

	if _, err := tx.ExecContext(ctx, `INSERT INTO blog_post_i18n (post_id, locale, title, excerpt, content_md) VALUES (?, ?, ?, ?, ?);`,
		postID, locale, bp.Title, bp.Excerpt, bp.ContentMD); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	bp.Slug = slug
	bp.UpdatedAt = now
	return &bp, nil
}

// UpdateBlogPost updates an existing blog post and its i18n content for the given locale.
func (s *Store) UpdateBlogPost(ctx context.Context, locale, slug string, bp BlogPost) (*BlogPost, error) {
	locale = normalizeLocale(locale)
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, errors.New("slug is required")
	}

	now := time.Now().UTC()

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	var postID int64
	if err := tx.QueryRowContext(ctx, `SELECT id FROM blog_posts WHERE slug = ?;`, slug).Scan(&postID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("post not found")
		}
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE blog_posts SET cover_url = ?, author_name = ?, updated_at = ?, tags = ?,
			status = ?, meta_title = ?, meta_description = ?, og_image_url = ?
		WHERE id = ?;`,
		bp.CoverURL, bp.AuthorName, now.Format(time.RFC3339), encodeTags(bp.Tags),
		bp.Status, bp.MetaTitle, bp.MetaDescription, bp.OgImageURL, postID); err != nil {
		return nil, err
	}

	// Upsert i18n: INSERT OR REPLACE
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO blog_post_i18n (post_id, locale, title, excerpt, content_md) VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(post_id, locale) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt, content_md = excluded.content_md;`,
		postID, locale, bp.Title, bp.Excerpt, bp.ContentMD); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	bp.Slug = slug
	bp.UpdatedAt = now
	return &bp, nil
}

// DeleteBlogPost deletes a blog post and all its i18n content.
func (s *Store) DeleteBlogPost(ctx context.Context, slug string) error {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return errors.New("slug is required")
	}
	res, err := s.db.ExecContext(ctx, `DELETE FROM blog_posts WHERE slug = ?;`, slug)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("post not found")
	}
	return nil
}

func (s *Store) ListBlogPosts(ctx context.Context, locale string, tag string, limit int) ([]BlogPost, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	locale = normalizeLocale(locale)
	tag = strings.ToLower(strings.TrimSpace(tag))

	var rows *sql.Rows
	var err error
	if tag == "" {
		rows, err = s.db.QueryContext(ctx, fmt.Sprintf(`
			SELECT %s
			FROM blog_posts p
			JOIN blog_post_i18n i ON i.post_id = p.id AND i.locale = ?
			WHERE p.status = 'published'
			ORDER BY p.published_at DESC
			LIMIT ?;`, blogSelectCols), locale, limit)
	} else {
		needle := "%|" + tag + "|%"
		rows, err = s.db.QueryContext(ctx, fmt.Sprintf(`
			SELECT %s
			FROM blog_posts p
			JOIN blog_post_i18n i ON i.post_id = p.id AND i.locale = ?
			WHERE p.status = 'published' AND p.tags LIKE ?
			ORDER BY p.published_at DESC
			LIMIT ?;`, blogSelectCols), locale, needle, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []BlogPost{}
	for rows.Next() {
		bp, err := scanBlogPost(rows, locale)
		if err != nil {
			return nil, err
		}
		out = append(out, bp)
	}
	return out, rows.Err()
}

func (s *Store) GetBlogPost(ctx context.Context, locale, slug string) (*BlogPost, error) {
	locale = normalizeLocale(locale)
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, errors.New("slug is required")
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT %s
		FROM blog_posts p
		JOIN blog_post_i18n i ON i.post_id = p.id AND i.locale = ?
		WHERE p.slug = ?
		LIMIT 1;`, blogSelectCols), locale, slug)
	bp, err := scanBlogPost(row, locale)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &bp, nil
}

func (s *Store) ListForumCategories(ctx context.Context, locale string) ([]ForumCategory, error) {
	locale = normalizeLocale(locale)
	rows, err := s.db.QueryContext(ctx, `
		SELECT c.slug, i.name, i.description
		FROM forum_categories c
		JOIN forum_category_i18n i ON i.category_id = c.id AND i.locale = ?
		ORDER BY c.slug ASC;`, locale)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ForumCategory{}
	for rows.Next() {
		var c ForumCategory
		if err := rows.Scan(&c.Slug, &c.Name, &c.Description); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) ListForumTopics(ctx context.Context, locale, categorySlug, q, sort string, limit int) ([]ForumTopic, error) {
	locale = normalizeLocale(locale)
	categorySlug = strings.TrimSpace(categorySlug)
	q = strings.TrimSpace(q)
	sort = strings.ToLower(strings.TrimSpace(sort))
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	orderBy := "t.updated_at DESC"
	switch sort {
	case "new", "newest":
		orderBy = "t.created_at DESC"
	case "top":
		orderBy = "t.reply_count DESC, t.updated_at DESC"
	}

	args := []interface{}{locale}
	whereParts := []string{}
	if categorySlug != "" {
		whereParts = append(whereParts, "c.slug = ?")
		args = append(args, categorySlug)
	}
	if q != "" {
		needle := "%" + q + "%"
		whereParts = append(whereParts, "(i.title LIKE ? OR i.body_md LIKE ? OR t.tags LIKE ?)")
		args = append(args, needle, needle, "%|"+strings.ToLower(q)+"|%")
	}
	where := ""
	if len(whereParts) > 0 {
		where = "WHERE " + strings.Join(whereParts, " AND ")
	}
	args = append(args, limit)

	querySQL := fmt.Sprintf(`
		SELECT c.slug, t.slug, i.title, i.body_md, t.topic_type, t.author_name, t.created_at, t.updated_at, t.tags, t.reply_count
		FROM forum_topics t
		JOIN forum_categories c ON c.id = t.category_id
		JOIN forum_topic_i18n i ON i.topic_id = t.id AND i.locale = ?
		%s
		ORDER BY %s
		LIMIT ?;`, where, orderBy)

	rows, err := s.db.QueryContext(ctx, querySQL, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ForumTopic{}
	for rows.Next() {
		var t ForumTopic
		var createdAt, updatedAt, tags string
		if err := rows.Scan(&t.CategorySlug, &t.Slug, &t.Title, &t.BodyMD, &t.TopicType, &t.AuthorName, &createdAt, &updatedAt, &tags, &t.ReplyCount); err != nil {
			return nil, err
		}
		ct, err := parseTimeRFC3339(createdAt)
		if err != nil {
			return nil, err
		}
		ut, err := parseTimeRFC3339(updatedAt)
		if err != nil {
			return nil, err
		}
		t.CreatedAt = ct
		t.UpdatedAt = ut
		t.Tags = decodeTags(tags)
		out = append(out, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetForumTopic(ctx context.Context, locale, categorySlug, topicSlug string) (*ForumTopic, []ForumPost, error) {
	locale = normalizeLocale(locale)
	categorySlug = strings.TrimSpace(categorySlug)
	topicSlug = strings.TrimSpace(topicSlug)
	if categorySlug == "" || topicSlug == "" {
		return nil, nil, errors.New("categorySlug and topicSlug are required")
	}

	var topic ForumTopic
	var createdAt, updatedAt, tags string
	row := s.db.QueryRowContext(ctx, `
		SELECT c.slug, t.slug, i.title, i.body_md, t.topic_type, t.author_name, t.created_at, t.updated_at, t.tags, t.reply_count
		FROM forum_topics t
		JOIN forum_categories c ON c.id = t.category_id
		JOIN forum_topic_i18n i ON i.topic_id = t.id AND i.locale = ?
		WHERE c.slug = ? AND t.slug = ?
		LIMIT 1;`, locale, categorySlug, topicSlug)
	if err := row.Scan(&topic.CategorySlug, &topic.Slug, &topic.Title, &topic.BodyMD, &topic.TopicType, &topic.AuthorName, &createdAt, &updatedAt, &tags, &topic.ReplyCount); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, nil
		}
		return nil, nil, err
	}
	ct, err := parseTimeRFC3339(createdAt)
	if err != nil {
		return nil, nil, err
	}
	ut, err := parseTimeRFC3339(updatedAt)
	if err != nil {
		return nil, nil, err
	}
	topic.CreatedAt = ct
	topic.UpdatedAt = ut
	topic.Tags = decodeTags(tags)

	rows, err := s.db.QueryContext(ctx, `
		SELECT p.id, p.author_name, p.created_at, i.body_md, p.like_count, p.parent_post_id
		FROM forum_posts p
		JOIN forum_post_i18n i ON i.post_id = p.id AND i.locale = ?
		JOIN forum_topics t ON t.id = p.topic_id
		JOIN forum_categories c ON c.id = t.category_id
		WHERE c.slug = ? AND t.slug = ?
		ORDER BY p.created_at ASC;`, locale, categorySlug, topicSlug)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	posts := []ForumPost{}
	for rows.Next() {
		var p ForumPost
		var createdAt string
		var parentID sql.NullInt64
		if err := rows.Scan(&p.ID, &p.AuthorName, &createdAt, &p.BodyMD, &p.LikeCount, &parentID); err != nil {
			return nil, nil, err
		}
		tm, err := parseTimeRFC3339(createdAt)
		if err != nil {
			return nil, nil, err
		}
		p.CreatedAt = tm
		if parentID.Valid {
			v := parentID.Int64
			p.ParentID = &v
		}
		posts = append(posts, p)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, err
	}

	return &topic, posts, nil
}

var reNonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugifyTitle(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return ""
	}
	// Normalize to ASCII-ish by dropping non-letter/digit and replacing runs with '-'.
	// Keep it simple for the demo.
	b := strings.Builder{}
	b.Grow(len(s))
	for _, r := range s {
		if r <= 127 {
			b.WriteRune(r)
			continue
		}
		// Replace non-ASCII letters/digits with space so they collapse into '-'
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(' ')
		} else {
			b.WriteRune(' ')
		}
	}
	clean := reNonSlug.ReplaceAllString(b.String(), "-")
	clean = strings.Trim(clean, "-")
	if clean == "" {
		clean = "topic"
	}
	return clean
}

func (s *Store) CreateForumTopic(ctx context.Context, locale, categorySlug, title, bodyMD, topicType, authorName string, tags []string) (*ForumTopic, error) {
	locale = normalizeLocale(locale)
	categorySlug = strings.TrimSpace(categorySlug)
	title = strings.TrimSpace(title)
	bodyMD = strings.TrimSpace(bodyMD)
	topicType = strings.ToLower(strings.TrimSpace(topicType))
	authorName = strings.TrimSpace(authorName)
	if categorySlug == "" {
		return nil, errors.New("categorySlug is required")
	}
	if title == "" {
		return nil, errors.New("title is required")
	}
	if bodyMD == "" {
		return nil, errors.New("body is required")
	}
	if authorName == "" {
		authorName = "Guest"
	}

	baseSlug := slugifyTitle(title)
	if baseSlug == "" {
		baseSlug = "topic"
	}
	slug := baseSlug

	// Ensure unique slug per category.
	for i := 0; i < 50; i++ {
		var exists int
		err := s.db.QueryRowContext(ctx, `
			SELECT 1
			FROM forum_topics t
			JOIN forum_categories c ON c.id = t.category_id
			WHERE c.slug = ? AND t.slug = ?
			LIMIT 1;`, categorySlug, slug).Scan(&exists)
		if errors.Is(err, sql.ErrNoRows) {
			break
		}
		if err != nil {
			return nil, err
		}
		slug = fmt.Sprintf("%s-%d", baseSlug, i+2)
	}

	createdAt := time.Now().UTC()
	updatedAt := createdAt

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	var categoryID int64
	row := tx.QueryRowContext(ctx, `SELECT id FROM forum_categories WHERE slug = ? LIMIT 1;`, categorySlug)
	if err := row.Scan(&categoryID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	res, err := tx.ExecContext(ctx, `
		INSERT INTO forum_topics (category_id, slug, author_name, created_at, updated_at, tags, reply_count, topic_type)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?);`,
		categoryID, slug, authorName, createdAt.Format(time.RFC3339), updatedAt.Format(time.RFC3339), encodeTags(tags), topicType)
	if err != nil {
		return nil, err
	}
	topicID, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `INSERT INTO forum_topic_i18n (topic_id, locale, title, body_md) VALUES (?, ?, ?, ?);`, topicID, locale, title, bodyMD); err != nil {
		return nil, err
	}
	other := "en"
	if locale == "en" {
		other = "zh"
	}
	if _, err := tx.ExecContext(ctx, `INSERT OR IGNORE INTO forum_topic_i18n (topic_id, locale, title, body_md) VALUES (?, ?, ?, ?);`, topicID, other, title, bodyMD); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	topic := &ForumTopic{
		CategorySlug: categorySlug,
		Slug:         slug,
		Title:        title,
		BodyMD:       bodyMD,
		TopicType:    topicType,
		AuthorName:   authorName,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
		Tags:         tags,
		ReplyCount:   0,
	}
	return topic, nil
}

func (s *Store) AddForumReply(ctx context.Context, locale, categorySlug, topicSlug, authorName, bodyMD string, parentID *int64) (*ForumPost, error) {
	locale = normalizeLocale(locale)
	categorySlug = strings.TrimSpace(categorySlug)
	topicSlug = strings.TrimSpace(topicSlug)
	authorName = strings.TrimSpace(authorName)
	bodyMD = strings.TrimSpace(bodyMD)
	if categorySlug == "" || topicSlug == "" {
		return nil, errors.New("categorySlug and topicSlug are required")
	}
	if authorName == "" {
		authorName = "Guest"
	}
	if bodyMD == "" {
		return nil, errors.New("body is required")
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	var topicID int64
	row := tx.QueryRowContext(ctx, `
		SELECT t.id
		FROM forum_topics t
		JOIN forum_categories c ON c.id = t.category_id
		WHERE c.slug = ? AND t.slug = ?
		LIMIT 1;`, categorySlug, topicSlug)
	if err := row.Scan(&topicID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	createdAt := time.Now().UTC()
	res, err := tx.ExecContext(ctx, `
		INSERT INTO forum_posts (topic_id, parent_post_id, author_name, created_at, like_count)
		VALUES (?, ?, ?, ?, 0);`, topicID, parentID, authorName, createdAt.Format(time.RFC3339))
	if err != nil {
		return nil, err
	}
	postID, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `INSERT INTO forum_post_i18n (post_id, locale, body_md) VALUES (?, ?, ?);`, postID, locale, bodyMD); err != nil {
		return nil, err
	}
	// Ensure the other locale has something, so switching locales doesn't 404.
	other := "en"
	if locale == "en" {
		other = "zh"
	}
	if _, err := tx.ExecContext(ctx, `INSERT OR IGNORE INTO forum_post_i18n (post_id, locale, body_md) VALUES (?, ?, ?);`, postID, other, bodyMD); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `UPDATE forum_topics SET reply_count = reply_count + 1, updated_at = ? WHERE id = ?;`, createdAt.Format(time.RFC3339), topicID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	p := &ForumPost{ID: postID, AuthorName: authorName, CreatedAt: createdAt, BodyMD: bodyMD, LikeCount: 0, ParentID: parentID}
	return p, nil
}

func (s *Store) VoteForumPost(ctx context.Context, postID int64, delta int) (likeCount int, found bool, err error) {
	if postID <= 0 {
		return 0, false, errors.New("postID is required")
	}
	if delta != 1 && delta != -1 {
		return 0, false, errors.New("delta must be 1 or -1")
	}

	var current int
	row := s.db.QueryRowContext(ctx, `SELECT like_count FROM forum_posts WHERE id = ?;`, postID)
	if err := row.Scan(&current); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, false, nil
		}
		return 0, false, err
	}

	newCount := current + delta
	if newCount < 0 {
		newCount = 0
	}

	if _, err := s.db.ExecContext(ctx, `UPDATE forum_posts SET like_count = ? WHERE id = ?;`, newCount, postID); err != nil {
		return 0, false, err
	}
	return newCount, true, nil
}

func (s *Store) InsertFormRequest(ctx context.Context, typ string, createdAt time.Time, ip, ua string, payload interface{}) error {
	typ = strings.TrimSpace(typ)
	if typ == "" {
		return errors.New("type is required")
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `INSERT INTO form_requests (type, created_at, ip, ua, payload_json) VALUES (?, ?, ?, ?, ?);`, typ, createdAt.UTC().Format(time.RFC3339), ip, ua, string(b))
	return err
}
