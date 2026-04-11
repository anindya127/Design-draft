import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/providers/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/layout/ScrollProgress';
import ScrollToTop from '@/components/ui/ScrollToTop';
import GlobalEffects from '@/components/effects/GlobalEffects';
import { routing } from '@/i18n/routing';
import '../globals.css';
import '../enhancements.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="gcss-html"
      suppressHydrationWarning
    >
      <body>
        {/* External theme init — runs before interactive/hydration to
            prevent dark-mode FOUC. `next/script` with beforeInteractive
            is the React 19 / Next 16-approved way to inject an external
            script into the document head. */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ScrollProgress />
            <GlobalEffects />
            <Header />
            <main>{children}</main>
            <Footer />
            <ScrollToTop />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
