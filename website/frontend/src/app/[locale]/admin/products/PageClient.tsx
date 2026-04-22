'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import {
    apiAdminListBillingCycles,
    apiAdminSaveBillingCycle,
    apiAdminDeleteBillingCycle,
    apiAdminListSupportTiers,
    apiAdminSaveSupportTier,
    apiAdminDeleteSupportTier,
    apiAdminListServerTiers,
    apiAdminSaveServerTier,
    apiAdminDeleteServerTier,
    apiAdminListPromoCodes,
    apiAdminSavePromoCode,
    apiAdminDeletePromoCode,
    type BillingCycle,
    type SupportTier,
    type ServerTier,
    type PromoCode,
} from '@/lib/api/billingApi';

function centsInput(v: number) {
    return (v / 100).toFixed(2);
}
function inputCents(s: string) {
    return Math.round(parseFloat(s || '0') * 100);
}

export default function AdminProductsClient() {
    const t = useTranslations('admin.products');
    const tCommon = useTranslations('admin');
    const router = useRouter();
    const { user, loading } = useAuth();

    const [cycles, setCycles] = useState<BillingCycle[] | null>(null);
    const [supports, setSupports] = useState<SupportTier[] | null>(null);
    const [servers, setServers] = useState<ServerTier[] | null>(null);
    const [promos, setPromos] = useState<PromoCode[] | null>(null);
    const [error, setError] = useState('');

    const token = typeof window !== 'undefined' ? getAuthToken() : null;

    const reload = useCallback(async () => {
        if (!token) return;
        setError('');
        try {
            const [c, s, srv, p] = await Promise.all([
                apiAdminListBillingCycles(token),
                apiAdminListSupportTiers(token),
                apiAdminListServerTiers(token),
                apiAdminListPromoCodes(token),
            ]);
            setCycles(c);
            setSupports(s);
            setServers(srv);
            setPromos(p);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        }
    }, [token]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user && user.role !== 'admin') router.push('/dashboard');
    }, [loading, user, router]);

    useEffect(() => {
        if (user?.role === 'admin') void reload();
    }, [user, reload]);

    if (loading || !user || user.role !== 'admin') return null;

    return (
        <div className="admin-page">
            <div className="admin-bg" />
            <div className="container">
                <header className="admin-header">
                    <div className="admin-meta">
                        <span className="admin-chip admin-chip-gold">GCSS Admin</span>
                    </div>
                    <h1 className="admin-title">{t('title')}</h1>
                    <p className="admin-subtitle">{t('subtitle')}</p>
                    <nav className="admin-nav-grid" style={{ marginTop: 16 }}>
                        <Link href="/admin" className="admin-quicklink">← {tCommon('backToOverview')}</Link>
                    </nav>
                </header>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {cycles && supports && servers && promos ? (
                    <>
                        <BillingCyclesTable token={token!} items={cycles} reload={reload} t={t} />
                        <SupportTiersTable token={token!} items={supports} reload={reload} t={t} />
                        <ServerTiersTable token={token!} items={servers} reload={reload} t={t} />
                        <PromoCodesTable token={token!} items={promos} reload={reload} t={t} />
                    </>
                ) : (
                    <div className="admin-loading">{tCommon('loading')}</div>
                )}
            </div>
        </div>
    );
}

// ── Billing cycles table ────────────────────────────────────────────

function BillingCyclesTable({ token, items, reload, t }: any) {
    const [draft, setDraft] = useState<Partial<BillingCycle>>({ years: 1, labelEn: '', labelZh: '', multiplier: 1, isActive: true, sortOrder: 0 });
    const save = async (b: Partial<BillingCycle>) => {
        try { await apiAdminSaveBillingCycle(token, b); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    const del = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;
        try { await apiAdminDeleteBillingCycle(token, id); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    return (
        <section className="admin-settings-group">
            <div className="admin-settings-group-head">
                <h2>{t('billingCycles.title')}</h2>
                <p>{t('billingCycles.desc')}</p>
            </div>
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>{t('billingCycles.years')}</th>
                        <th>{t('billingCycles.labelEn')}</th>
                        <th>{t('billingCycles.labelZh')}</th>
                        <th>{t('billingCycles.multiplier')}</th>
                        <th>{t('common.active')}</th>
                        <th>{t('common.sort')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((b: BillingCycle) => (
                        <tr key={b.id}>
                            <td><input className="form-input form-input--inline" type="number" defaultValue={b.years} onBlur={(e) => save({ ...b, years: parseInt(e.target.value || '0', 10) })} /></td>
                            <td><input className="form-input form-input--inline" defaultValue={b.labelEn} onBlur={(e) => save({ ...b, labelEn: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline" defaultValue={b.labelZh} onBlur={(e) => save({ ...b, labelZh: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline" type="number" step="0.01" defaultValue={b.multiplier} onBlur={(e) => save({ ...b, multiplier: parseFloat(e.target.value || '1') })} /></td>
                            <td><input type="checkbox" defaultChecked={b.isActive} onChange={(e) => save({ ...b, isActive: e.target.checked })} /></td>
                            <td><input className="form-input form-input--inline form-input--narrow" type="number" defaultValue={b.sortOrder} onBlur={(e) => save({ ...b, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                            <td><button className="btn btn-secondary btn-sm" onClick={() => del(b.id)}>{t('common.delete')}</button></td>
                        </tr>
                    ))}
                    <tr className="admin-new-row">
                        <td><input className="form-input form-input--inline" type="number" value={draft.years || 0} onChange={(e) => setDraft({ ...draft, years: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><input className="form-input form-input--inline" placeholder="3 Years" value={draft.labelEn || ''} onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline" placeholder="3 年" value={draft.labelZh || ''} onChange={(e) => setDraft({ ...draft, labelZh: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline" type="number" step="0.01" value={draft.multiplier || 1} onChange={(e) => setDraft({ ...draft, multiplier: parseFloat(e.target.value || '1') })} /></td>
                        <td><input type="checkbox" checked={!!draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /></td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.sortOrder || 0} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><button className="btn btn-primary btn-sm" onClick={async () => { await save(draft); setDraft({ years: 1, labelEn: '', labelZh: '', multiplier: 1, isActive: true, sortOrder: 0 }); }}>{t('common.add')}</button></td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}

// ── Support tiers table ─────────────────────────────────────────────

function SupportTiersTable({ token, items, reload, t }: any) {
    const [draft, setDraft] = useState<any>({ labelEn: '', labelZh: '', priceCents: 0, pricingType: 'fixed', isActive: true, sortOrder: 0 });
    const save = async (s: Partial<SupportTier>) => {
        try { await apiAdminSaveSupportTier(token, s); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    const del = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;
        try { await apiAdminDeleteSupportTier(token, id); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    return (
        <section className="admin-settings-group">
            <div className="admin-settings-group-head">
                <h2>{t('supportTiers.title')}</h2>
                <p>{t('supportTiers.desc')}</p>
            </div>
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>{t('supportTiers.labelEn')}</th>
                        <th>{t('supportTiers.labelZh')}</th>
                        <th>{t('supportTiers.price')}</th>
                        <th>{t('supportTiers.pricingType')}</th>
                        <th>{t('common.active')}</th>
                        <th>{t('common.sort')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((s: SupportTier) => (
                        <tr key={s.id}>
                            <td><input className="form-input form-input--inline" defaultValue={s.labelEn} onBlur={(e) => save({ ...s, labelEn: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline" defaultValue={s.labelZh} onBlur={(e) => save({ ...s, labelZh: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline" type="number" step="0.01" defaultValue={centsInput(s.priceCents)} onBlur={(e) => save({ ...s, priceCents: inputCents(e.target.value) })} /></td>
                            <td>
                                <select className="form-input form-input--inline" defaultValue={s.pricingType} onChange={(e) => save({ ...s, pricingType: e.target.value as any })}>
                                    <option value="fixed">fixed</option>
                                    <option value="per_day">per_day</option>
                                    <option value="per_month">per_month</option>
                                </select>
                            </td>
                            <td><input type="checkbox" defaultChecked={s.isActive} onChange={(e) => save({ ...s, isActive: e.target.checked })} /></td>
                            <td><input className="form-input form-input--inline form-input--narrow" type="number" defaultValue={s.sortOrder} onBlur={(e) => save({ ...s, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                            <td><button className="btn btn-secondary btn-sm" onClick={() => del(s.id)}>{t('common.delete')}</button></td>
                        </tr>
                    ))}
                    <tr className="admin-new-row">
                        <td><input className="form-input form-input--inline" value={draft.labelEn} onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline" value={draft.labelZh} onChange={(e) => setDraft({ ...draft, labelZh: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline" type="number" step="0.01" value={centsInput(draft.priceCents)} onChange={(e) => setDraft({ ...draft, priceCents: inputCents(e.target.value) })} /></td>
                        <td>
                            <select className="form-input form-input--inline" value={draft.pricingType} onChange={(e) => setDraft({ ...draft, pricingType: e.target.value })}>
                                <option value="fixed">fixed</option>
                                <option value="per_day">per_day</option>
                                <option value="per_month">per_month</option>
                            </select>
                        </td>
                        <td><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /></td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><button className="btn btn-primary btn-sm" onClick={async () => { await save(draft); setDraft({ labelEn: '', labelZh: '', priceCents: 0, pricingType: 'fixed', isActive: true, sortOrder: 0 }); }}>{t('common.add')}</button></td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}

// ── Server tiers table ──────────────────────────────────────────────

function ServerTiersTable({ token, items, reload, t }: any) {
    const [draft, setDraft] = useState<any>({ labelEn: '', labelZh: '', maxChargers: 1000, priceCents: 0, isActive: true, sortOrder: 0 });
    const save = async (s: Partial<ServerTier>) => {
        try { await apiAdminSaveServerTier(token, s); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    const del = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;
        try { await apiAdminDeleteServerTier(token, id); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    return (
        <section className="admin-settings-group">
            <div className="admin-settings-group-head">
                <h2>{t('serverTiers.title')}</h2>
                <p>{t('serverTiers.desc')}</p>
            </div>
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>{t('serverTiers.labelEn')}</th>
                        <th>{t('serverTiers.labelZh')}</th>
                        <th>{t('serverTiers.maxChargers')}</th>
                        <th>{t('serverTiers.price')}</th>
                        <th>{t('common.active')}</th>
                        <th>{t('common.sort')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((s: ServerTier) => (
                        <tr key={s.id}>
                            <td><input className="form-input form-input--inline" defaultValue={s.labelEn} onBlur={(e) => save({ ...s, labelEn: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline" defaultValue={s.labelZh} onBlur={(e) => save({ ...s, labelZh: e.target.value })} /></td>
                            <td><input className="form-input form-input--inline form-input--narrow" type="number" defaultValue={s.maxChargers} onBlur={(e) => save({ ...s, maxChargers: parseInt(e.target.value || '0', 10) })} /></td>
                            <td><input className="form-input form-input--inline" type="number" step="0.01" defaultValue={centsInput(s.priceCents)} onBlur={(e) => save({ ...s, priceCents: inputCents(e.target.value) })} /></td>
                            <td><input type="checkbox" defaultChecked={s.isActive} onChange={(e) => save({ ...s, isActive: e.target.checked })} /></td>
                            <td><input className="form-input form-input--inline form-input--narrow" type="number" defaultValue={s.sortOrder} onBlur={(e) => save({ ...s, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                            <td><button className="btn btn-secondary btn-sm" onClick={() => del(s.id)}>{t('common.delete')}</button></td>
                        </tr>
                    ))}
                    <tr className="admin-new-row">
                        <td><input className="form-input form-input--inline" value={draft.labelEn} onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline" value={draft.labelZh} onChange={(e) => setDraft({ ...draft, labelZh: e.target.value })} /></td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.maxChargers} onChange={(e) => setDraft({ ...draft, maxChargers: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><input className="form-input form-input--inline" type="number" step="0.01" value={centsInput(draft.priceCents)} onChange={(e) => setDraft({ ...draft, priceCents: inputCents(e.target.value) })} /></td>
                        <td><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /></td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><button className="btn btn-primary btn-sm" onClick={async () => { await save(draft); setDraft({ labelEn: '', labelZh: '', maxChargers: 1000, priceCents: 0, isActive: true, sortOrder: 0 }); }}>{t('common.add')}</button></td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}

// ── Promo codes table ───────────────────────────────────────────────

function PromoCodesTable({ token, items, reload, t }: any) {
    const [draft, setDraft] = useState<any>({ code: '', discountType: 'percent', discountValue: 10, isActive: true, maxRedemptions: 0 });
    const save = async (p: Partial<PromoCode>) => {
        try { await apiAdminSavePromoCode(token, p); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    const del = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;
        try { await apiAdminDeletePromoCode(token, id); await reload(); } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    };
    return (
        <section className="admin-settings-group">
            <div className="admin-settings-group-head">
                <h2>{t('promoCodes.title')}</h2>
                <p>{t('promoCodes.desc')}</p>
            </div>
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>{t('promoCodes.code')}</th>
                        <th>{t('promoCodes.type')}</th>
                        <th>{t('promoCodes.value')}</th>
                        <th>{t('promoCodes.maxRedemptions')}</th>
                        <th>{t('promoCodes.redeemed')}</th>
                        <th>{t('common.active')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((p: PromoCode) => (
                        <tr key={p.id}>
                            <td><code>{p.code}</code></td>
                            <td>{p.discountType}</td>
                            <td>{p.discountType === 'percent' ? `${p.discountValue}%` : `$${(p.discountValue / 100).toFixed(2)}`}</td>
                            <td>{p.maxRedemptions || '∞'}</td>
                            <td>{p.redeemedCount}</td>
                            <td><input type="checkbox" defaultChecked={p.isActive} onChange={(e) => save({ ...p, isActive: e.target.checked })} /></td>
                            <td><button className="btn btn-secondary btn-sm" onClick={() => del(p.id)}>{t('common.delete')}</button></td>
                        </tr>
                    ))}
                    <tr className="admin-new-row">
                        <td><input className="form-input form-input--inline" placeholder="SAVE10" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} /></td>
                        <td>
                            <select className="form-input form-input--inline" value={draft.discountType} onChange={(e) => setDraft({ ...draft, discountType: e.target.value })}>
                                <option value="percent">percent</option>
                                <option value="fixed">fixed (cents)</option>
                            </select>
                        </td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.discountValue} onChange={(e) => setDraft({ ...draft, discountValue: parseInt(e.target.value || '0', 10) })} /></td>
                        <td><input className="form-input form-input--inline form-input--narrow" type="number" value={draft.maxRedemptions} onChange={(e) => setDraft({ ...draft, maxRedemptions: parseInt(e.target.value || '0', 10) })} /></td>
                        <td>—</td>
                        <td><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /></td>
                        <td><button className="btn btn-primary btn-sm" onClick={async () => { await save(draft); setDraft({ code: '', discountType: 'percent', discountValue: 10, isActive: true, maxRedemptions: 0 }); }}>{t('common.add')}</button></td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}
