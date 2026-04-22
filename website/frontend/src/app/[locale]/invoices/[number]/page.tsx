import { setRequestLocale } from 'next-intl/server';
import PageClient from './PageClient';

export default async function InvoicePrintPage({ params }: { params: Promise<{ locale: string; number: string }> }) {
    const { locale, number } = await params;
    setRequestLocale(locale);
    return <PageClient number={number} />;
}

export function generateStaticParams() {
    return [];
}
