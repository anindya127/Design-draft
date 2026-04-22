'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';

function DashboardIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function PaymentsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    );
}

function ServerIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="8" x="2" y="2" rx="2" />
            <rect width="20" height="8" x="2" y="14" rx="2" />
            <line x1="6" x2="6.01" y1="6" y2="6" />
            <line x1="6" x2="6.01" y1="18" y2="18" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    );
}

function AdminIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

function ProfileAvatar({ initials, size = 96 }: { initials: string; size?: number }) {
    // Decorative — the user's name is rendered immediately next to it.
    return (
        <div className="dash-profile-avatar" aria-hidden="true" style={{ width: size, height: size, fontSize: size / 2.4 }}>
            {initials}
        </div>
    );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
    const t = useTranslations('dashboard');
    const tNav = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="dash-portal">
                <div className="dashboard-loading">
                    <div className="dashboard-loading-spinner" />
                    <p>{t('loading')}</p>
                </div>
            </div>
        );
    }
    if (!user) return null;

    const initials =
        `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase() ||
        user.username.charAt(0).toUpperCase();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Normalize pathname by stripping locale prefix for active-state matching.
    const path = pathname.replace(/^\/(en|zh)/, '') || '/';

    const navItems: { href: '/dashboard' | '/dashboard/payments' | '/dashboard/server'; label: string; icon: ReactNode; match: (p: string) => boolean }[] = [
        { href: '/dashboard', label: t('nav.dashboard'), icon: <DashboardIcon />, match: (p) => p === '/dashboard' || p === '/dashboard/' },
        { href: '/dashboard/payments', label: t('nav.paymentHistory'), icon: <PaymentsIcon />, match: (p) => p.startsWith('/dashboard/payments') },
        { href: '/dashboard/server', label: t('nav.serverInfo'), icon: <ServerIcon />, match: (p) => p.startsWith('/dashboard/server') },
    ];

    return (
        <div className="dash-portal">
            <aside className="dash-sidebar" aria-label={t('nav.dashboard')}>
                <div className="dash-sidebar-brand" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)">
                        <path d="M7 0l1.76 5.24L14 7l-5.24 1.76L7 14l-1.76-5.24L0 7l5.24-1.76L7 0z" transform="translate(5 5)" />
                    </svg>
                    <span>GCSS</span>
                </div>

                <nav className="dash-sidebar-nav" aria-label={t('nav.dashboard')}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`dash-sidebar-btn${item.match(path) ? ' active' : ''}`}
                            aria-current={item.match(path) ? 'page' : undefined}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="dash-sidebar-bottom">
                    {user.role === 'admin' && (
                        <Link href="/admin" className="dash-sidebar-btn">
                            <AdminIcon />
                            <span>{t('adminPanel')}</span>
                        </Link>
                    )}
                    <button
                        type="button"
                        className="dash-sidebar-btn dash-sidebar-btn--danger"
                        onClick={handleLogout}
                    >
                        <LogoutIcon />
                        <span>{tNav('logout')}</span>
                    </button>
                </div>
            </aside>

            <main className="dash-main" id="dash-main-content">
                <header className="dash-profile-header">
                    <div className="dash-profile-banner" aria-hidden="true" />
                    <div className="dash-profile-identity">
                        <ProfileAvatar initials={initials} />
                        <div className="dash-profile-meta">
                            <h2 className="dash-profile-name">
                                {user.firstName} {user.lastName}
                            </h2>
                            <div className="dash-profile-email">{user.email}</div>
                            <div className="dash-profile-chips">
                                <span className="dash-profile-username">@{user.username}</span>
                                <span className="dash-profile-planchip">
                                    <span className="dash-profile-planchip-dot" aria-hidden="true" />
                                    {t('profile.freePlan')}
                                </span>
                                {user.role === 'admin' && (
                                    <span className="dash-profile-rolechip">{t('roleAdmin')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dash-content">{children}</div>
            </main>
        </div>
    );
}
