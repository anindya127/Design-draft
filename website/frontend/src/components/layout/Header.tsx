'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useThemeContext } from '@/providers/ThemeProvider';

export default function Header() {
  const t = useTranslations('nav');
  const tModels = useTranslations('models');
  const tDropdown = useTranslations('dropdown');
  const pathname = usePathname() || '/';
  const router = useRouter();
  const locale = useLocale();
  const { theme, toggleTheme } = useThemeContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeMenu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const normalizedPathname = pathname.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';

  const switchLocale = (newLocale: string) => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const nextPath = pathname.match(/^\/(en|zh)(?=\/|$)/)
      ? pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${newLocale}`)
      : `/${newLocale}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    router.replace(nextPath + hash);
  };

  const isActive = (href: string) => {
    if (href === '/') return normalizedPathname === '/';
    return normalizedPathname.startsWith(href);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const ChevronDown = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  return (
    <header className={`header glass${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <Link href="/" className="logo" onClick={closeMenu}>
          <Image
            src="/assets/logo.png"
            alt="GCSS"
            width={32}
            height={32}
            style={{ borderRadius: '8px' }}
          />
          <span>GCSS</span>
        </Link>

        <nav className={`nav${mobileOpen ? ' mobile-open' : ''}`} id="primary-navigation">
          <Link href="/" className={isActive('/') ? 'active' : ''} onClick={closeMenu}>
            {t('home')}
          </Link>

          {/* Product dropdown */}
          <div className={`nav-dropdown${openDropdown === 'product' ? ' mobile-dropdown-open' : ''}`}>
            <a
              className={isActive('/product') ? 'active' : ''}
              onClick={(e) => {
                if (mobileOpen) {
                  e.preventDefault();
                  toggleDropdown('product');
                }
              }}
              href={mobileOpen ? undefined : undefined}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {t('product')}
              {mobileOpen && <ChevronDown />}
            </a>
            <div className="nav-dropdown-menu">
              <Link href={{ pathname: '/product', hash: 'overview' }} onClick={closeMenu}>
                <div className="dropdown-icon icon-gradient--gold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className="dropdown-text">
                  <span>{tModels('b2c.title')}</span>
                  <span>{tDropdown('b2c.desc')}</span>
                </div>
              </Link>
              <Link href="/b2b" onClick={closeMenu}>
                <div className="dropdown-icon icon-gradient--dark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <div className="dropdown-text">
                  <span>{tModels('b2b.title')}</span>
                  <span>{tDropdown('b2b.desc')}</span>
                </div>
              </Link>
            </div>
          </div>

          <Link href="/pricing" className={isActive('/pricing') ? 'active' : ''} onClick={closeMenu}>
            {t('pricing')}
          </Link>

          {/* Community dropdown */}
          <div className={`nav-dropdown${openDropdown === 'community' ? ' mobile-dropdown-open' : ''}`}>
            <a
              className={isActive('/blog') || isActive('/forum') || isActive('/faq') ? 'active' : ''}
              onClick={(e) => {
                if (mobileOpen) {
                  e.preventDefault();
                  toggleDropdown('community');
                }
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {t('community')}
              {mobileOpen && <ChevronDown />}
            </a>
            <div className="nav-dropdown-menu">
              <Link href="/blog" onClick={closeMenu}>
                <div className="dropdown-icon icon-gradient--blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div className="dropdown-text">
                  <span>{t('blog')}</span>
                  <span>{tDropdown('blog.desc')}</span>
                </div>
              </Link>
              <Link href="/forum" onClick={closeMenu}>
                <div className="dropdown-icon icon-gradient--purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="dropdown-text">
                  <span>{t('forum')}</span>
                  <span>{tDropdown('forum.desc')}</span>
                </div>
              </Link>
              <Link href="/faq" onClick={closeMenu}>
                <div className="dropdown-icon icon-gradient--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="dropdown-text">
                  <span>{t('faq')}</span>
                  <span>{tDropdown('faq.desc')}</span>
                </div>
              </Link>
            </div>
          </div>

          <Link href="/docs" className={isActive('/docs') ? 'active' : ''} onClick={closeMenu}>
            {t('docs')}
          </Link>
          <Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={closeMenu}>
            {t('contact')}
          </Link>
        </nav>

        <div className="header-actions">
          <div className="lang-switcher">
            <button className={`lang-btn${locale === 'en' ? ' active' : ''}`} onClick={() => switchLocale('en')}>EN</button>
            <button className={`lang-btn${locale === 'zh' ? ' active' : ''}`} onClick={() => switchLocale('zh')}>中文</button>
          </div>

          <button className="theme-toggle" aria-label="Toggle dark mode" onClick={toggleTheme}>
            <svg className="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
            <svg className="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>

          <Link href={{ pathname: '/product', hash: 'demo' }} className="btn-demo">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 3.5v9l6-4.5-6-4.5z" /></svg>
            <span>{t('demo')}</span>
          </Link>
          <Link href="/login" className="btn-login">{t('login')}</Link>
        </div>

        <button
          className={`mobile-toggle${mobileOpen ? ' active' : ''}`}
          aria-label="Menu"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
