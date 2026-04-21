import { setRequestLocale } from 'next-intl/server';
import PageClient from './PageClient';

export const metadata = { title: 'Edit Blog Post - GCSS Admin' };

export function generateStaticParams() {
    // Dynamic — no static params needed for admin editor
    return [];
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    setRequestLocale(locale);
    return <PageClient slug={slug} />;
}
