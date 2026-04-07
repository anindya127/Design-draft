'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ScrollAnimation from '@/components/effects/ScrollAnimation';

export default function BlogPage() {
  const t = useTranslations();
  const [activeFilter, setActiveFilter] = useState('all');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filters = [
    { key: 'all', label: t('blog.filter.all') },
    { key: 'product', label: t('blog.filter.product') },
    { key: 'industry', label: t('blog.filter.industry') },
    { key: 'guides', label: t('blog.filter.guides') },
    { key: 'cases', label: t('blog.filter.cases') },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 2000);
  };

  return (
    <>
      {/* Blog Hero */}
      <section className="blog-hero mesh-bg">
        <ScrollAnimation>
          <div className="container">
            <span className="section-label">{t('blog.label')}</span>
            <h1>{t('blog.title')}</h1>
            <p>{t('blog.desc')}</p>
          </div>
        </ScrollAnimation>
      </section>

      {/* Filters */}
      <section className="section-sm">
        <div className="container">
          <ScrollAnimation>
            <div className="blog-filters">
              {filters.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${activeFilter === f.key ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </ScrollAnimation>

          {/* Featured Post */}
          <ScrollAnimation>
            <div className="featured-post">
              <div className="featured-img">
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, borderRadius: 12 }}>Image Placeholder</div>
              </div>
              <div className="featured-content">
                <span className="post-category">{t('blog.featured.cat')}</span>
                <h2><a href="/blog">{t('blog.featured.title')}</a></h2>
                <p>{t('blog.featured.desc')}</p>
                <div className="post-meta">
                  <div className="author">
                    <div className="author-avatar">G</div>
                    <span>{t('blog.featured.team')}</span>
                  </div>
                  <span>Mar 15, 2026</span>
                  <span>8 min read</span>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Blog Grid */}
          <ScrollAnimation>
            <div className="blog-grid">

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-guide">{t('blog.post1.cat')}</span>
                  <h3><a href="/blog">{t('blog.post1.title')}</a></h3>
                  <p>{t('blog.post1.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Feb 28, 2026</span>
                    <span>5 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-news">{t('blog.post2.cat')}</span>
                  <h3><a href="/blog">{t('blog.post2.title')}</a></h3>
                  <p>{t('blog.post2.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Feb 20, 2026</span>
                    <span>4 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-case">{t('blog.post3.cat')}</span>
                  <h3><a href="/blog">{t('blog.post3.title')}</a></h3>
                  <p>{t('blog.post3.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Feb 10, 2026</span>
                    <span>6 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-guide">{t('blog.post4.cat')}</span>
                  <h3><a href="/blog">{t('blog.post4.title')}</a></h3>
                  <p>{t('blog.post4.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Jan 28, 2026</span>
                    <span>7 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-product">{t('blog.post5.cat')}</span>
                  <h3><a href="/blog">{t('blog.post5.title')}</a></h3>
                  <p>{t('blog.post5.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Jan 15, 2026</span>
                    <span>3 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

              <div className="blog-card">
                <div className="blog-card-img">
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1a3e, #0B1120)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Image Placeholder</div>
                </div>
                <div className="blog-card-body">
                  <span className="post-category cat-industry">{t('blog.post6.cat')}</span>
                  <h3><a href="/blog">{t('blog.post6.title')}</a></h3>
                  <p>{t('blog.post6.desc')}</p>
                  <div className="post-meta" style={{ marginBottom: 12 }}>
                    <span>Jan 5, 2026</span>
                    <span>5 min read</span>
                  </div>
                  <a href="/blog" className="read-more">
                    <span>{t('blog.readmore')}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </a>
                </div>
              </div>

            </div>
          </ScrollAnimation>

          {/* Pagination */}
          <div className="pagination">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section section-alt">
        <div className="container">
          <ScrollAnimation>
            <div className="newsletter">
              <span className="section-label">{t('blog.newsletter.label')}</span>
              <h2>{t('blog.newsletter.title')}</h2>
              <p style={{ color: 'var(--text-tertiary)', marginTop: 8 }}>{t('blog.newsletter.desc')}</p>
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder={t('blog.newsletter.placeholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  {subscribed ? 'Subscribed!' : t('blog.newsletter.btn')}
                </button>
              </form>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
