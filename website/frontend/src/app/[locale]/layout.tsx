import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
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
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <ScrollProgress />
              <GlobalEffects />
              <a href="#main-content" className="skip-link visually-hidden focusable">
                {(messages as { nav?: { skipToContent?: string } })?.nav?.skipToContent || 'Skip to main content'}
              </a>
              <Header />
              <main id="main-content">{children}</main>
              <Footer />
              <ScrollToTop />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
