import { setRequestLocale } from 'next-intl/server';
import PageClient from './PageClient';
export const metadata = { title: 'Audit Requests - GCSS Admin' };
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <PageClient />;
}
