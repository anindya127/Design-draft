package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type seedBlogPost struct {
	Slug        string
	CoverURL    string
	AuthorName  string
	PublishedAt time.Time
	Tags        []string
	EN          seedBlogPostI18n
	ZH          seedBlogPostI18n
}

type seedBlogPostI18n struct {
	Title     string
	Excerpt   string
	ContentMD string
}

type seedCategory struct {
	Slug string
	EN   seedCategoryI18n
	ZH   seedCategoryI18n
}

type seedCategoryI18n struct {
	Name        string
	Description string
}

type seedTopic struct {
	CategorySlug string
	Slug         string
	AuthorName   string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Tags         []string
	EN           seedTopicI18n
	ZH           seedTopicI18n
	Posts        []seedPost
}

type seedTopicI18n struct {
	Title  string
	BodyMD string
}

type seedPost struct {
	AuthorName  string
	CreatedAt   time.Time
	LikeCount   int
	ParentIndex *int // optional reference to another post in the same slice
	ENBodyMD    string
	ZHBodyMD    string
}

func (s *Store) seed(ctx context.Context) error {
	posts := defaultSeedBlogPosts()
	cats := defaultSeedForumCategories()
	topics := defaultSeedForumTopics()

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	// Seed default admin user (admin / admin)
	adminPwHash, err := hashPassword("admin")
	if err != nil {
		return fmt.Errorf("seed admin password: %w", err)
	}
	createdAt := time.Now().UTC().Format(time.RFC3339)

	// Encrypt PII fields for the admin user
	encEmail := s.enc.Encrypt("admin@gcss.hk")
	emailHash := s.enc.HashForLookup("admin@gcss.hk")
	encFirstName := s.enc.Encrypt("System")
	encLastName := s.enc.Encrypt("Admin")
	encPhone := s.enc.Encrypt("+86-000-0000")
	encCompany := s.enc.Encrypt("GCSS")

	if _, err := tx.ExecContext(ctx, `
		INSERT OR IGNORE INTO users (username, email, email_hash, role, first_name, last_name, phone, company, password_hash, created_at)
		VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, ?, ?);
	`, "admin", encEmail, emailHash, encFirstName, encLastName, encPhone, encCompany, adminPwHash, createdAt); err != nil {
		return fmt.Errorf("seed admin user: %w", err)
	}

	// Blog
	for _, p := range posts {
		res, err := tx.ExecContext(ctx,
			`INSERT INTO blog_posts (slug, cover_url, author_name, published_at, tags) VALUES (?, ?, ?, ?, ?);`,
			p.Slug, p.CoverURL, p.AuthorName, p.PublishedAt.UTC().Format(time.RFC3339), encodeTags(p.Tags),
		)
		if err != nil {
			return err
		}
		postID, err := res.LastInsertId()
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO blog_post_i18n (post_id, locale, title, excerpt, content_md) VALUES (?, 'en', ?, ?, ?);`,
			postID, p.EN.Title, p.EN.Excerpt, p.EN.ContentMD,
		); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO blog_post_i18n (post_id, locale, title, excerpt, content_md) VALUES (?, 'zh', ?, ?, ?);`,
			postID, p.ZH.Title, p.ZH.Excerpt, p.ZH.ContentMD,
		); err != nil {
			return err
		}
	}

	// Forum categories
	catIDs := map[string]int64{}
	for _, c := range cats {
		res, err := tx.ExecContext(ctx, `INSERT INTO forum_categories (slug) VALUES (?);`, c.Slug)
		if err != nil {
			return err
		}
		cid, err := res.LastInsertId()
		if err != nil {
			return err
		}
		catIDs[c.Slug] = cid

		if _, err := tx.ExecContext(ctx,
			`INSERT INTO forum_category_i18n (category_id, locale, name, description) VALUES (?, 'en', ?, ?);`,
			cid, c.EN.Name, c.EN.Description,
		); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO forum_category_i18n (category_id, locale, name, description) VALUES (?, 'zh', ?, ?);`,
			cid, c.ZH.Name, c.ZH.Description,
		); err != nil {
			return err
		}
	}

	// Forum topics + posts
	for _, t := range topics {
		cid, ok := catIDs[t.CategorySlug]
		if !ok {
			return fmt.Errorf("seed topic references unknown category %q", t.CategorySlug)
		}
		res, err := tx.ExecContext(ctx,
			`INSERT INTO forum_topics (category_id, slug, author_name, created_at, updated_at, tags, reply_count, topic_type) VALUES (?, ?, ?, ?, ?, ?, 0, '');`,
			cid, t.Slug, t.AuthorName, t.CreatedAt.UTC().Format(time.RFC3339), t.UpdatedAt.UTC().Format(time.RFC3339), encodeTags(t.Tags),
		)
		if err != nil {
			return err
		}
		topicID, err := res.LastInsertId()
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO forum_topic_i18n (topic_id, locale, title, body_md) VALUES (?, 'en', ?, ?);`,
			topicID, t.EN.Title, t.EN.BodyMD,
		); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO forum_topic_i18n (topic_id, locale, title, body_md) VALUES (?, 'zh', ?, ?);`,
			topicID, t.ZH.Title, t.ZH.BodyMD,
		); err != nil {
			return err
		}

		// Posts
		postIDs := make([]int64, 0, len(t.Posts))
		for i, p := range t.Posts {
			var parentID interface{} = nil
			if p.ParentIndex != nil {
				pi := *p.ParentIndex
				if pi >= 0 && pi < len(postIDs) {
					parentID = postIDs[pi]
				}
			}
			pres, err := tx.ExecContext(ctx,
				`INSERT INTO forum_posts (topic_id, parent_post_id, author_name, created_at, like_count) VALUES (?, ?, ?, ?, ?);`,
				topicID, parentID, p.AuthorName, p.CreatedAt.UTC().Format(time.RFC3339), p.LikeCount,
			)
			if err != nil {
				return err
			}
			pid, err := pres.LastInsertId()
			if err != nil {
				return err
			}
			postIDs = append(postIDs, pid)

			if _, err := tx.ExecContext(ctx,
				`INSERT INTO forum_post_i18n (post_id, locale, body_md) VALUES (?, 'en', ?);`,
				pid, p.ENBodyMD,
			); err != nil {
				return err
			}
			if _, err := tx.ExecContext(ctx,
				`INSERT INTO forum_post_i18n (post_id, locale, body_md) VALUES (?, 'zh', ?);`,
				pid, p.ZHBodyMD,
			); err != nil {
				return err
			}

			if i > 0 {
				if _, err := tx.ExecContext(ctx, `UPDATE forum_topics SET reply_count = reply_count + 1, updated_at = ? WHERE id = ?;`, p.CreatedAt.UTC().Format(time.RFC3339), topicID); err != nil {
					return err
				}
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}

func defaultSeedBlogPosts() []seedBlogPost {
	// Keep dates stable for deterministic static exports.
	base := time.Date(2026, 4, 1, 9, 0, 0, 0, time.UTC)
	return []seedBlogPost{
		{
			Slug:        "gcss-v2-operations-stack",
			CoverURL:    "",
			AuthorName:  "GCSS Team",
			PublishedAt: base,
			Tags:        []string{"product", "operations"},
			EN: seedBlogPostI18n{
				Title:     "GCSS v2: A Smarter EV Charging Operations Stack",
				Excerpt:   "From multi-tenant dashboards to payments—what’s new in v2 and why operators care.",
				ContentMD: "## Highlights\n\n- Faster operator workflows\n- Cleaner alerting\n- A more flexible partner layer\n\n## Why it matters\n\nOperators don’t need *more* screens — they need fewer clicks and clearer answers. GCSS v2 focuses on operational clarity: better device health visibility, smarter ticket triage, and a data model that scales across tenants.\n\n## What’s next\n\nWe’re expanding integrations (OCPP 1.6/2.0.1), adding payment partners, and continuing to polish the UI for field teams.",
			},
			ZH: seedBlogPostI18n{
				Title:     "GCSS v2：更智能的充电运营系统",
				Excerpt:   "从多租户管理到支付合作伙伴——v2 的关键升级与运营价值。",
				ContentMD: "## 关键升级\n\n- 运营流程更快\n- 告警更清晰\n- 合作伙伴能力更灵活\n\n## 为什么重要\n\n运营团队不需要*更多*页面，而是更少的点击与更明确的答案。GCSS v2 聚焦运营清晰度：设备健康更可见、工单分流更智能、数据模型可扩展到多租户。\n\n## 接下来\n\n我们将继续扩展集成（OCPP 1.6/2.0.1）、新增支付合作伙伴，并持续打磨面向现场团队的体验。",
			},
		},
		{
			Slug:        "ocpp-diagnostics-playbook",
			CoverURL:    "",
			AuthorName:  "Operations",
			PublishedAt: base.AddDate(0, 0, 5),
			Tags:        []string{"ocpp", "diagnostics"},
			EN: seedBlogPostI18n{
				Title:     "OCPP Diagnostics Playbook: From Noise to Signal",
				Excerpt:   "A practical checklist for reducing false alarms while catching the real failures.",
				ContentMD: "## The problem\n\nMany networks drown in alerts. A connector flaps, a modem resets, and suddenly your ops team is firefighting all day.\n\n## A simple approach\n\n1. **Group** by site and charger model\n2. **Deduplicate** repeated faults within a time window\n3. **Escalate** only when *impact* is proven (sessions failing, payments failing)\n\n## Metrics to track\n\n- Mean time to acknowledge (MTTA)\n- Mean time to repair (MTTR)\n- Alert-to-incident ratio\n",
			},
			ZH: seedBlogPostI18n{
				Title:     "OCPP 诊断手册：从噪声到信号",
				Excerpt:   "用一套可执行的清单，减少误报，同时抓住真正的故障。",
				ContentMD: "## 问题\n\n很多网络被告警淹没：枪口抖动、通讯重连、重复故障……运营团队整天在救火。\n\n## 一个简单方法\n\n1. 按站点与设备型号**分组**\n2. 在时间窗内对重复故障**去重**\n3. 只有当影响被验证（充电失败、支付失败）时才**升级**\n\n## 建议指标\n\n- 平均响应时间（MTTA）\n- 平均修复时间（MTTR）\n- 告警/事件比例\n",
			},
		},
		{
			Slug:        "payments-partners-expansion",
			CoverURL:    "",
			AuthorName:  "Partnerships",
			PublishedAt: base.AddDate(0, 0, 10),
			Tags:        []string{"payments", "partners"},
			EN: seedBlogPostI18n{
				Title:     "Expanding Payment Partners: What to Ask Before You Integrate",
				Excerpt:   "A short list of questions that save weeks during rollout.",
				ContentMD: "## Before you integrate\n\nAsk these early:\n\n- Does the provider support **tokenization**?\n- What are the **settlement** timelines per region?\n- How do you handle **refunds** and partial captures?\n\n## GCSS approach\n\nWe treat payments as a partner layer so operators can add new methods without rebuilding the core platform.",
			},
			ZH: seedBlogPostI18n{
				Title:     "支付合作伙伴扩展：集成前先问清这几件事",
				Excerpt:   "一些关键问题，可以在上线时省下数周时间。",
				ContentMD: "## 集成前\n\n建议尽早确认：\n\n- 是否支持**Token 化**？\n- 各地区的**结算**周期？\n- **退款**与部分扣款如何处理？\n\n## GCSS 的方式\n\n我们把支付当作合作伙伴层来处理，运营商可以更轻松地新增支付方式，而不需要重建核心平台。",
			},
		},
	}
}

func defaultSeedForumCategories() []seedCategory {
	return []seedCategory{
		{
			Slug: "operations",
			EN: seedCategoryI18n{
				Name:        "Operations",
				Description: "Runbooks, alerts, uptime, and field workflows.",
			},
			ZH: seedCategoryI18n{
				Name:        "运营",
				Description: "运维手册、告警、可用性与现场流程。",
			},
		},
		{
			Slug: "integrations",
			EN: seedCategoryI18n{
				Name:        "Integrations",
				Description: "OCPP, payments, roaming, and partner APIs.",
			},
			ZH: seedCategoryI18n{
				Name:        "集成",
				Description: "OCPP、支付、漫游与合作伙伴 API。",
			},
		},
	}
}

func defaultSeedForumTopics() []seedTopic {
	base := time.Date(2026, 4, 6, 10, 0, 0, 0, time.UTC)
	p0 := 0
	return []seedTopic{
		{
			CategorySlug: "operations",
			Slug:         "reducing-alert-noise",
			AuthorName:   "NOC",
			CreatedAt:    base,
			UpdatedAt:    base,
			Tags:         []string{"alerts", "uptime"},
			EN: seedTopicI18n{
				Title:  "How do you reduce alert noise without missing real outages?",
				BodyMD: "We’re seeing repeated connector faults and transient modem drops. What rules do you apply for dedupe and escalation?",
			},
			ZH: seedTopicI18n{
				Title:  "如何降低告警噪声，同时不漏掉真实故障？",
				BodyMD: "我们遇到大量重复的枪口故障与短暂的通信掉线。大家通常如何做去重与升级规则？",
			},
			Posts: []seedPost{
				{
					AuthorName: "NOC",
					CreatedAt:  base,
					LikeCount:  3,
					ENBodyMD:   "We currently group by **site + charger model** and dedupe within 15 minutes. Still noisy. Any better patterns?",
					ZHBodyMD:   "我们目前按**站点 + 设备型号**分组，在 15 分钟内去重，但依然很吵。有没有更好的做法？",
				},
				{
					AuthorName:  "Ops Lead",
					CreatedAt:   base.Add(2 * time.Hour),
					LikeCount:   5,
					ParentIndex: &p0,
					ENBodyMD:    "We only page when **sessions fail** (impact-based). Everything else becomes a ticket with a daily triage.",
					ZHBodyMD:    "我们只在**充电会话失败**（有明确影响）时触发值班通知，其余告警转工单，每日统一分诊。",
				},
			},
		},
		{
			CategorySlug: "integrations",
			Slug:         "ocpp-2-0-1-migration",
			AuthorName:   "Integrations",
			CreatedAt:    base.AddDate(0, 0, 1),
			UpdatedAt:    base.AddDate(0, 0, 1),
			Tags:         []string{"ocpp", "roadmap"},
			EN: seedTopicI18n{
				Title:  "OCPP 2.0.1 migration strategy for mixed fleets",
				BodyMD: "If your network has both 1.6 and 2.0.1 devices, what’s your rollout strategy?",
			},
			ZH: seedTopicI18n{
				Title:  "混合车队下的 OCPP 2.0.1 迁移策略",
				BodyMD: "当网络同时有 1.6 与 2.0.1 设备时，大家通常如何制定上线策略？",
			},
			Posts: []seedPost{
				{
					AuthorName: "Integrations",
					CreatedAt:  base.AddDate(0, 0, 1),
					LikeCount:  2,
					ENBodyMD:   "We’re considering per-model enablement and shadow-mode monitoring. Curious how others do it.",
					ZHBodyMD:   "我们考虑按型号逐步启用，并先做影子模式监控。想听听其他人的经验。",
				},
			},
		},
	}
}
