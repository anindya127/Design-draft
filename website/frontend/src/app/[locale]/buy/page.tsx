import { getTranslations, setRequestLocale } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations();
    return {
        title: `${t('buy.meta.title')} - GCSS`,
        description: t('buy.meta.description'),
    };
}

export default async function BuyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <PageClient />;
}
