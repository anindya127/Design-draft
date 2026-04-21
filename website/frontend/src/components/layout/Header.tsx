'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useThemeContext } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function Header() {
  const t = useTranslations('nav');
  const tModels = useTranslations('models');
  const tDropdown = useTranslations('dropdown');
  const pathname = usePathname() || '/';
  const router = useRouter();
  const locale = useLocale();
  const { theme, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    await logout();
    router.push(`/${locale}/login`);
  }, [logout, router, locale]);

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

  const ChevronDown = ({ className }: { className?: string }) => (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  /* Shared dropdown trigger props (removes inline style bloat) */
  const dropdownTriggerClass = 'nav-dropdown-trigger';

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
          {/* -- Mobile overlay backdrop -- */}
          {mobileOpen && <div className="mobile-nav-backdrop" onClick={closeMenu} aria-hidden="true" />}

          <div className="nav-links">
            <Link href="/" className={isActive('/') ? 'active' : ''} onClick={closeMenu}>
              {t('home')}
            </Link>

            {/* Product dropdown */}
            <div
              className={`nav-dropdown${openDropdown === 'product' ? ' mobile-dropdown-open open' : ''}`}
              onFocus={() => setOpenDropdown('product')}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setOpenDropdown((prev) => (prev === 'product' ? null : prev));
                }
              }}
            >
              <button
                type="button"
                className={`${dropdownTriggerClass}${isActive('/b2c') || isActive('/b2b') ? ' active' : ''}`}
                onClick={() => toggleDropdown('product')}
                aria-haspopup="true"
                aria-expanded={openDropdown === 'product'}
                aria-controls="product-dropdown-menu"
              >
                {t('product')}
                <ChevronDown className="dropdown-chevron" />
              </button>
              <div id="product-dropdown-menu" className="nav-dropdown-menu" role="menu">
                <Link href={{ pathname: '/b2c', hash: 'overview' }} onClick={closeMenu}>
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
            <div
              className={`nav-dropdown${openDropdown === 'community' ? ' mobile-dropdown-open open' : ''}`}
              onFocus={() => setOpenDropdown('community')}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setOpenDropdown((prev) => (prev === 'community' ? null : prev));
                }
              }}
            >
              <button
                type="button"
                className={`${dropdownTriggerClass}${isActive('/blog') || isActive('/forum') || isActive('/faq') ? ' active' : ''}`}
                onClick={() => toggleDropdown('community')}
                aria-haspopup="true"
                aria-expanded={openDropdown === 'community'}
                aria-controls="community-dropdown-menu"
              >
                {t('community')}
                <ChevronDown className="dropdown-chevron" />
              </button>
              <div id="community-dropdown-menu" className="nav-dropdown-menu" role="menu">
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
          </div>

          {/* -- Mobile-only footer with CTA + settings -- */}
          <div className="mobile-nav-footer">
            <div className="mobile-nav-cta">
              <Link href="/demo" className="btn-demo" onClick={closeMenu}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 3.5v9l6-4.5-6-4.5z" /></svg>
                <span>{t('demo')}</span>
              </Link>
              {user ? (
                <button type="button" className="btn-login" onClick={() => { closeMenu(); handleLogout(); }}>{t('logout')}</button>
              ) : (
                <Link href="/login" className="btn-login" onClick={closeMenu}>{t('login')}</Link>
              )}
            </div>
            <div className="mobile-nav-settings">
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
            </div>
          </div>
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

          <Link href="/demo" className="btn-demo">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 3.5v9l6-4.5-6-4.5z" /></svg>
            <span>{t('demo')}</span>
          </Link>

          {user ? (
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="user-menu-avatar">
                  {(user.firstName || user.username || '?').charAt(0).toUpperCase()}
                </span>
                <span className="user-menu-name">{user.firstName || user.username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {userMenuOpen && (
                <div className="user-menu-dropdown" role="menu">
                  <div className="user-menu-header">
                    <div className="user-menu-header-name">{user.firstName} {user.lastName}</div>
                    <div className="user-menu-header-email">{user.email}</div>
                  </div>
                  <div className="user-menu-divider" />
                  <Link href="/dashboard" className="user-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                    {t('dashboard')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="user-menu-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                      {t('adminPanel')}
                    </Link>
                  )}
                  <div className="user-menu-divider" />
                  <button type="button" className="user-menu-item user-menu-item--danger" role="menuitem" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-login">{t('login')}</Link>
          )}
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
