'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import { apiGetInvoiceByNumber, type Invoice, type Order } from '@/lib/api/billingApi';

function formatUSD(cents: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
function formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function InvoicePrintClient({ number }: { number: string }) {
    const t = useTranslations('invoice');
    const router = useRouter();
    const { user, loading } = useAuth();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [buyer, setBuyer] = useState<{ firstName: string; lastName: string; email: string; company?: string } | null>(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    useEffect(() => {
        if (loading || !user) return;
        const token = getAuthToken();
        if (!token) return;
        apiGetInvoiceByNumber(token, number)
            .then((res) => {
                setInvoice(res.invoice);
                setOrder(res.order);
                setBuyer(res.user);
            })
            .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load invoice'));
    }, [number, loading, user]);

    if (loading || !user) return null;

    if (err) {
        return (
            <section className="section container">
                <div className="form-banner form-banner--error">{err}</div>
            </section>
        );
    }
    if (!invoice) return null;

    const billingAddr = (() => {
        try { return JSON.parse(order?.billingAddress || '{}'); } catch { return {}; }
    })();

    return (
        <>
            <div className="invoice-toolbar">
                <Link href="/dashboard/payments" className="btn btn-secondary">
                    ← {t('back')}
                </Link>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                    ⬇ {t('download')}
                </button>
            </div>

            <div className="invoice-sheet">
                <header className="invoice-head">
                    <div className="invoice-brand">
                        <div className="invoice-logo">GCSS</div>
                        <div className="invoice-brand-sub">Global Charger System Service</div>
                    </div>
                    <div className="invoice-number">
                        <div className="invoice-number-label">{t('invoiceNumber')}</div>
                        <div className="invoice-number-value">{invoice.invoiceNumber}</div>
                        <div className="invoice-meta">{formatDate(invoice.createdAt)}</div>
                    </div>
                </header>

                <section className="invoice-parties">
                    <div>
                        <div className="invoice-section-label">{t('billedTo')}</div>
                        <div className="invoice-party-line">{buyer?.firstName} {buyer?.lastName}</div>
                        <div className="invoice-party-sub">{buyer?.email}</div>
                        {buyer?.company && <div className="invoice-party-sub">{buyer.company}</div>}
                        {billingAddr.street1 && <div className="invoice-party-sub">{billingAddr.street1}</div>}
                        {billingAddr.street2 && <div className="invoice-party-sub">{billingAddr.street2}</div>}
                        {(billingAddr.city || billingAddr.state || billingAddr.postcode) && (
                            <div className="invoice-party-sub">
                                {[billingAddr.city, billingAddr.state, billingAddr.postcode].filter(Boolean).join(', ')}
                            </div>
                        )}
                        {billingAddr.country && <div className="invoice-party-sub">{billingAddr.country}</div>}
                    </div>
                    <div>
                        <div className="invoice-section-label">{t('from')}</div>
                        <div className="invoice-party-line">GCSS (Global Charger System Service)</div>
                        <div className="invoice-party-sub">Hong Kong SAR</div>
                        <div className="invoice-party-sub">billing@gcss.hk</div>
                    </div>
                </section>

                <section>
                    <div className="invoice-section-label">{t('details')}</div>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>{t('description')}</th>
                                <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{invoice.productLabel}</td>
                                <td style={{ textAlign: 'right' }}>{formatUSD(invoice.amountCents, invoice.currency)}</td>
                            </tr>
                        </tbody>
                        {order && order.discountCents > 0 && (
                            <tfoot>
                                <tr>
                                    <td style={{ textAlign: 'right', color: '#10B981' }}>{t('discount')}</td>
                                    <td style={{ textAlign: 'right', color: '#10B981' }}>−{formatUSD(order.discountCents, invoice.currency)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </section>

                <section className="invoice-totals">
                    <div>
                        <span>{t('total')}</span>
                        <span>{formatUSD(invoice.amountCents, invoice.currency)}</span>
                    </div>
                    <div className="invoice-paid">{invoice.status === 'paid' ? t('paidInFull') : t('unpaid')}</div>
                </section>

                <section className="invoice-meta-grid">
                    <div>
                        <div className="invoice-section-label">{t('paymentMethod')}</div>
                        <div>{invoice.provider}</div>
                    </div>
                    <div>
                        <div className="invoice-section-label">{t('paidOn')}</div>
                        <div>{formatDate(invoice.paidAt)}</div>
                    </div>
                    {order && (
                        <div>
                            <div className="invoice-section-label">{t('orderNumber')}</div>
                            <div><code>{order.orderNumber}</code></div>
                        </div>
                    )}
                </section>

                <footer className="invoice-footer">
                    {t('thankYou')}
                </footer>
            </div>
        </>
    );
}
