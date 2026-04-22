'use client';

import { useTranslations } from 'next-intl';

export default function ServerInfoClient() {
    const t = useTranslations('dashboard.serverInfo');

    return (
        <>
            <h1 className="dash-page-title">{t('title')}</h1>

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('credentials.title')}</h2>
                <p className="dash-section-desc">{t('credentials.desc')}</p>
                <div className="dash-empty-state" style={{ marginTop: 16 }}>
                    <div className="dash-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <rect width="20" height="8" x="2" y="2" rx="2" />
                            <rect width="20" height="8" x="2" y="14" rx="2" />
                            <line x1="6" x2="6.01" y1="6" y2="6" />
                            <line x1="6" x2="6.01" y1="18" y2="18" />
                        </svg>
                    </div>
                    <h3>{t('emptyTitle')}</h3>
                    <p>{t('emptyDesc')}</p>
                </div>
            </div>

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('status.title')}</h2>
                <p className="dash-section-desc">{t('status.desc')}</p>
            </div>
        </>
    );
}
