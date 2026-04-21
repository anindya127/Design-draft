'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { apiGetBlogPost, apiListBlogPosts, type ApiBlogPost } from '@/lib/api/contentApi';
import { getStaticBlogPost, listStaticBlogPosts } from '@/lib/content/staticContent';

function formatDate(iso: string, locale: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function estimateReadingTime(md: string): number {
    const words = md.replace(/[#*_~`>\[\]()!|]/g, '').split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

function extractHeadings(md: string): { level: number; text: string; id: string }[] {
    const headings: { level: number; text: string; id: string }[] = [];
    for (const line of md.split('\n')) {
        const match = line.match(/^(#{2,3})\s+(.+)/);
        if (match) {
            const text = match[2].replace(/[*_`]/g, '');
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            headings.push({ level: match[1].length, text, id });
        }
    }
    return headings;
}

const AVATAR_COLORS: Record<string, string> = {
    'GCSS Team': 'linear-gradient(135deg, #FEBF1D, #D4890A)',
    'Operations': 'linear-gradient(135deg, #3B82F6, #2563EB)',
    'Partnerships': 'linear-gradient(135deg, #10B981, #059669)',
};

function getAvatarBg(name: string): string {
    return AVATAR_COLORS[name] || 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
}

function LoadingSkeleton() {
    return (
        <div className="blog-article-skeleton" aria-hidden="true">
            <div className="blog-skeleton-line" style={{ width: '80%', height: 32 }} />
            <div className="blog-skeleton-line" style={{ width: '50%', height: 16, marginTop: 16 }} />
            <div className="blog-skeleton-line" style={{ width: '100%', height: 14, marginTop: 40 }} />
            <div className="blog-skeleton-line" style={{ width: '100%', height: 14, marginTop: 8 }} />
            <div className="blog-skeleton-line" style={{ width: '90%', height: 14, marginTop: 8 }} />
            <div className="blog-skeleton-line" style={{ width: '100%', height: 14, marginTop: 24 }} />
            <div className="blog-skeleton-line" style={{ width: '70%', height: 14, marginTop: 8 }} />
        </div>
    );
}

export default function BlogPostPage({ slug }: { slug: string }) {
    const locale = useLocale();
    const t = useTranslations();

    const staticPost = useMemo(() => getStaticBlogPost(locale, slug), [locale, slug]);

    const [post, setPost] = useState<ApiBlogPost | null>(staticPost);
    const [loading, setLoading] = useState(!staticPost);
    const [error, setError] = useState<string | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<ApiBlogPost[]>([]);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
            setError(null);
            try {
                const p = await apiGetBlogPost(locale, slug);
                if (!cancelled) setPost(p);
            } catch (e) {
                if (!cancelled) {
                    if (staticPost) {
                        setPost(staticPost);
                    } else {
                        setError(e instanceof Error ? e.message : 'Failed to load');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void run();
        return () => { cancelled = true; };
    }, [locale, slug, staticPost]);

    // Fetch related posts
    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const posts = await apiListBlogPosts(locale, undefined, 10);
                if (!cancelled) {
                    setRelatedPosts(posts.filter(p => p.slug !== slug).slice(0, 3));
                }
            } catch {
                if (!cancelled) {
                    const statics = listStaticBlogPosts(locale).filter(p => p.slug !== slug).slice(0, 3);
                    setRelatedPosts(statics);
                }
            }
        }
        void run();
        return () => { cancelled = true; };
    }, [locale, slug]);

    const readingTime = post?.contentMd ? estimateReadingTime(post.contentMd) : 0;
    const headings = post?.contentMd ? extractHeadings(post.contentMd) : [];

    return (
        <div className="blog-article-page">

            {/* Hero */}
            <section className="blog-article-hero">
                <div className="blog-article-hero-inner">
                    <Link href="/blog" className="blog-article-back">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        {t('blog.post.back')}
                    </Link>

                    {post?.tags?.length ? (
                        <div className="blog-article-tags">
                            {post.tags.map(tag => (
                                <span key={tag} className="blog-article-tag">{tag}</span>
                            ))}
                        </div>
                    ) : null}

                    <h1 className="blog-article-title">{post?.title ?? t('blog.post.loading')}</h1>

                    {post?.excerpt ? <p className="blog-article-excerpt">{post.excerpt}</p> : null}

                    <div className="blog-article-meta">
                        <div className="blog-article-author">
                            <div className="blog-article-author-avatar" style={{ background: getAvatarBg(post?.authorName || '') }}>
                                {(post?.authorName || 'G').charAt(0)}
                            </div>
                            <div>
                                <div className="blog-article-author-name">{post?.authorName ?? 'GCSS'}</div>
                                <div className="blog-article-date">
                                    {post?.publishedAt ? formatDate(post.publishedAt, locale) : ''}
                                    {readingTime > 0 ? ` · ${readingTime} ${t('blog.post.minRead')}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Area */}
            <div className="blog-article-layout">

                {/* Table of Contents (sidebar) */}
                {headings.length > 2 && (
                    <aside className="blog-article-toc">
                        <div className="blog-article-toc-label">{t('blog.post.toc')}</div>
                        <ul className="blog-article-toc-list">
                            {headings.map(h => (
                                <li key={h.id} className={h.level === 3 ? 'toc-indent' : ''}>
                                    <a href={`#${h.id}`}>{h.text}</a>
                                </li>
                            ))}
                        </ul>
                    </aside>
                )}

                {/* Main Content */}
                <article className="blog-article-content">
                    {loading ? (
                        <LoadingSkeleton />
                    ) : post ? (
                        <div className="blog-prose">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h2: ({ children, ...props }) => {
                                        const text = String(children).replace(/[*_`]/g, '');
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h2 id={id} {...props}>{children}</h2>;
                                    },
                                    h3: ({ children, ...props }) => {
                                        const text = String(children).replace(/[*_`]/g, '');
                                        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        return <h3 id={id} {...props}>{children}</h3>;
                                    },
                                }}
                            >
                                {post.contentMd}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="blog-article-error">
                            <h2>{t('blog.post.notFound')}</h2>
                            {error ? <p>{error}</p> : null}
                            <Link href="/blog" className="btn btn-primary btn-sm">{t('blog.post.back')}</Link>
                        </div>
                    )}
                </article>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="blog-article-related">
                    <div className="blog-article-related-inner">
                        <h2 className="blog-article-related-title">{t('blog.post.related')}</h2>
                        <div className="blog-article-related-grid">
                            {relatedPosts.map(rp => (
                                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="blog-related-card">
                                    <div className="blog-related-tags">
                                        {rp.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="blog-article-tag blog-article-tag--sm">{tag}</span>
                                        ))}
                                    </div>
                                    <h3 className="blog-related-title">{rp.title}</h3>
                                    <p className="blog-related-excerpt">{rp.excerpt}</p>
                                    <div className="blog-related-date">{formatDate(rp.publishedAt, locale)}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
