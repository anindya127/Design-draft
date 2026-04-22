import { setRequestLocale } from 'next-intl/server';
import PageClient from './PageClient';

export default async function OrderDetailsPage({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
    const { locale, orderNumber } = await params;
    setRequestLocale(locale);
    return <PageClient orderNumber={orderNumber} />;
}

export function generateStaticParams() {
    // Order numbers are user-specific at runtime; don't prerender any.
    return [];
}
