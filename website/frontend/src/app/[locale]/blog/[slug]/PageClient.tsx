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
    const words = md.replace(/[#*_~`>\[\]()!|<]/g, '').split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

const AUTHOR_COLORS: Record<string, string> = {
    'GCSS Team': 'linear-gradient(135deg, #FEBF1D, #D4890A)',
    'Operations': 'linear-gradient(135deg, #3B82F6, #2563EB)',
    'Partnerships': 'linear-gradient(135deg, #10B981, #059669)',
};

function ShareButtons({ title }: { title: string }) {
    const copy = () => {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
    };
    return (
        <div className="article-share">
            <button type="button" className="article-share-btn" onClick={copy} aria-label="Copy link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </button>
            <a className="article-share-btn" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a className="article-share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="article-skeleton">
            <div className="article-skeleton-block" style={{ width: '40%', height: 14 }} />
            <div className="article-skeleton-block" style={{ width: '90%', height: 36, marginTop: 20 }} />
            <div className="article-skeleton-block" style={{ width: '70%', height: 36, marginTop: 8 }} />
            <div className="article-skeleton-block" style={{ width: '30%', height: 14, marginTop: 24 }} />
            <div className="article-skeleton-block" style={{ width: '100%', height: 1, marginTop: 32 }} />
            <div className="article-skeleton-block" style={{ width: '100%', height: 14, marginTop: 32 }} />
            <div className="article-skeleton-block" style={{ width: '100%', height: 14, marginTop: 10 }} />
            <div className="article-skeleton-block" style={{ width: '85%', height: 14, marginTop: 10 }} />
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
                    if (staticPost) setPost(staticPost);
                    else setError(e instanceof Error ? e.message : 'Failed to load');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void run();
        return () => { cancelled = true; };
    }, [locale, slug, staticPost]);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const posts = await apiListBlogPosts(locale, undefined, 10);
                if (!cancelled) setRelatedPosts(posts.filter(p => p.slug !== slug).slice(0, 3));
            } catch {
                if (!cancelled) setRelatedPosts(listStaticBlogPosts(locale).filter(p => p.slug !== slug).slice(0, 3));
            }
        }
        void run();
        return () => { cancelled = true; };
    }, [locale, slug]);

    const readingTime = post?.contentMd ? estimateReadingTime(post.contentMd) : 0;

    return (
        <article className="vg-article">

            {/* ── Header ──────────────────────────────── */}
            <header className="vg-article-header">
                <div className="vg-article-header-inner">
                    <Link href="/blog" className="vg-article-back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </Link>

                    {post?.tags?.length ? (
                        <div className="vg-article-category">
                            {post.tags[0]}
                        </div>
                    ) : null}

                    <h1 className="vg-article-title">
                        {post?.title ?? t('blog.post.loading')}
                    </h1>

                    {post?.excerpt ? (
                        <p className="vg-article-dek">{post.excerpt}</p>
                    ) : null}

                    <div className="vg-article-byline">
                        <div className="vg-article-author-avatar" style={{ background: AUTHOR_COLORS[post?.authorName || ''] || 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                            {(post?.authorName || 'G').charAt(0)}
                        </div>
                        <div className="vg-article-byline-text">
                            <span className="vg-article-author-name">{post?.authorName ?? 'GCSS'}</span>
                            <span className="vg-article-date-line">
                                {post?.publishedAt ? formatDate(post.publishedAt, locale) : ''}
                                {readingTime > 0 && <span className="vg-article-reading-time">{readingTime} {t('blog.post.minRead')}</span>}
                            </span>
                        </div>

                        {post && <ShareButtons title={post.title} />}
                    </div>
                </div>
            </header>

            {/* ── Cover Image ─────────────────────────── */}
            {post?.coverUrl && (
                <div className="vg-article-cover">
                    <img src={post.coverUrl} alt={post.title} loading="eager" />
                </div>
            )}

            {/* ── Body ────────────────────────────────── */}
            <div className="vg-article-body">
                {loading ? (
                    <LoadingSkeleton />
                ) : post ? (
                    <div className="vg-prose">
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
                                img: ({ src, alt }) => (
                                    <figure className="vg-figure">
                                        <img src={src} alt={alt || ''} loading="lazy" />
                                        {alt && <figcaption>{alt}</figcaption>}
                                    </figure>
                                ),
                            }}
                        >
                            {post.contentMd}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="vg-article-error">
                        <h2>{t('blog.post.notFound')}</h2>
                        {error && <p>{error}</p>}
                        <Link href="/blog" className="btn btn-primary btn-sm">{t('blog.post.back')}</Link>
                    </div>
                )}
            </div>

            {/* ── Tags ────────────────────────────────── */}
            {post?.tags && post.tags.length > 0 && (
                <div className="vg-article-tags-bar">
                    {post.tags.map(tag => (
                        <span key={tag} className="vg-tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* ── Related ─────────────────────────────── */}
            {relatedPosts.length > 0 && (
                <section className="vg-related">
                    <div className="vg-related-inner">
                        <h2 className="vg-related-heading">{t('blog.post.related')}</h2>
                        <div className="vg-related-grid">
                            {relatedPosts.map(rp => (
                                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="vg-related-card">
                                    <span className="vg-related-cat">{rp.tags?.[0]}</span>
                                    <h3>{rp.title}</h3>
                                    <p>{rp.excerpt}</p>
                                    <span className="vg-related-date">{formatDate(rp.publishedAt, locale)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </article>
    );
}
