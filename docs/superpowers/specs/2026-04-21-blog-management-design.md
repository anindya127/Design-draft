# Blog Management System — Design Spec

## Overview
Admin-only blog CMS with markdown editor, media uploads (25MB), bilingual SEO, and structured data.

## Backend
- CRUD: POST/PUT/DELETE /api/admin/blog/posts (admin auth required)
- New fields: status (draft/published), meta_title, meta_description, og_image_url, updated_at
- Upload: 25MB limit, video support (.mp4/.webm), auth required
- DB migration: ALTER TABLE blog_posts ADD COLUMN for new fields

## Frontend
- /admin/blog — post list with status, edit/delete
- /admin/blog/new — markdown editor with preview, SEO sidebar, media upload
- /admin/blog/edit/[slug] — same editor, pre-filled
- Blog article page.tsx — full SEO metadata (OG, Twitter, hreflang, JSON-LD)

## SEO per post
- title, meta description, OG tags, Twitter Card, hreflang, JSON-LD Article, canonical URL

## Access control
- All admin blog endpoints require admin role
- Upload requires auth token
- Public read unchanged
