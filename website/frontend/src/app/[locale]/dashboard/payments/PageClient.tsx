'use client';

import { useTranslations } from 'next-intl';

export default function PaymentHistoryClient() {
    const t = useTranslations('dashboard.paymentHistory');

    return (
        <>
            <h1 className="dash-page-title">{t('title')}</h1>

            <div className="dash-form-card">
                <div className="dash-empty-state">
                    <div className="dash-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                    <h3>{t('emptyTitle')}</h3>
                    <p>{t('emptyDesc')}</p>
                </div>

                <table className="dash-table" aria-label={t('tableLabel')}>
                    <thead>
                        <tr>
                            <th>{t('columns.invoice')}</th>
                            <th>{t('columns.product')}</th>
                            <th>{t('columns.total')}</th>
                            <th>{t('columns.status')}</th>
                            <th>{t('columns.details')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={5} className="dash-table-empty">
                                {t('noRecords')}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}
