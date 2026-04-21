import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import PageClient from './PageClient';
import { routing } from '@/i18n/routing';
import { staticBlogSlugs, getStaticBlogPost } from '@/lib/content/staticContent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://v3.gcss.hk';

export function generateStaticParams() {
    return routing.locales.flatMap((locale) => staticBlogSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    const post = getStaticBlogPost(locale, slug);
    if (!post) {
        return { title: 'Blog - GCSS' };
    }

    const title = post.title + ' - GCSS';
    const description = post.excerpt;
    const url = `${SITE_URL}/${locale}/blog/${slug}`;
    const otherLocale = locale === 'en' ? 'zh' : 'en';
    const otherUrl = `${SITE_URL}/${otherLocale}/blog/${slug}`;

    return {
        title,
        description,
        openGraph: {
            title: post.title,
            description,
            url,
            type: 'article',
            siteName: 'GCSS',
            locale: locale === 'zh' ? 'zh_CN' : 'en_US',
            publishedTime: post.publishedAt,
            authors: [post.authorName],
            tags: post.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description,
        },
        alternates: {
            canonical: url,
            languages: {
                en: `${SITE_URL}/en/blog/${slug}`,
                zh: `${SITE_URL}/zh/blog/${slug}`,
            },
        },
        other: {
            'article:published_time': post.publishedAt,
            'article:author': post.authorName,
            'article:tag': post.tags.join(','),
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    setRequestLocale(locale);

    // JSON-LD structured data
    const post = getStaticBlogPost(locale, slug);
    const jsonLd = post
        ? {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.excerpt,
              author: { '@type': 'Organization', name: post.authorName || 'GCSS' },
              publisher: {
                  '@type': 'Organization',
                  name: 'GCSS',
                  url: SITE_URL,
              },
              datePublished: post.publishedAt,
              mainEntityOfPage: `${SITE_URL}/${locale}/blog/${slug}`,
              inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
              keywords: post.tags.join(', '),
          }
        : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    suppressHydrationWarning
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <PageClient slug={slug} />
        </>
    );
}
