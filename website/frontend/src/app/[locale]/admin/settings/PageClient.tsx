'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/api/authApi';
import {
    apiAdminListSettings,
    apiAdminSetSetting,
    apiAdminDeleteSetting,
    apiAdminListSettingsAudit,
    type AppSecretMeta,
    type AppSecretAudit,
} from '@/lib/api/adminApi';

type GroupDef = { id: string; label: string; desc: string };

const GROUPS: GroupDef[] = [
    { id: 'stripe', label: 'Stripe', desc: 'International card payments via Checkout + Customer Portal.' },
    { id: 'pingxx', label: 'Ping++', desc: 'Alipay / WeChat Pay for mainland China.' },
    { id: 'paypal', label: 'PayPal', desc: 'PayPal Orders v2. Use sandbox for testing.' },
    { id: 'smtp', label: 'Email (SMTP)', desc: 'Outgoing email for receipts + verification.' },
    { id: 'captcha', label: 'CAPTCHA', desc: 'Cloudflare Turnstile (international) and Tencent Captcha (zh).' },
];

const KEY_LABELS: Record<string, { label: string; help: string; type?: 'password' | 'text' }> = {
    STRIPE_SECRET_KEY:         { label: 'Secret key (sk_...)',         help: 'Stripe dashboard → Developers → API keys',                                           type: 'password' },
    STRIPE_WEBHOOK_SECRET:     { label: 'Webhook signing secret (whsec_...)', help: 'Stripe dashboard → Developers → Webhooks → signing secret',                   type: 'password' },
    STRIPE_PUBLISHABLE_KEY:    { label: 'Publishable key (pk_...)',    help: 'Ships to browser. Stripe dashboard → Developers → API keys.' },
    PINGXX_APP_ID:              { label: 'App ID',                       help: 'Ping++ dashboard → Apps → App ID' },
    PINGXX_SECRET_KEY:          { label: 'Secret key',                   help: 'Ping++ dashboard → Security → API keys',                                              type: 'password' },
    PINGXX_WEBHOOK_PUBLIC_KEY:  { label: 'Webhook public key (PEM)',     help: 'Ping++ publishes an RSA public key for webhook signature verification. Paste the full ---BEGIN PUBLIC KEY---...---END PUBLIC KEY--- block. This is NOT a secret.' },
    PINGXX_PRIVATE_KEY:         { label: 'Merchant private key (PEM)',   help: 'Your merchant RSA private key for signing outbound requests. Paste the full ---BEGIN RSA PRIVATE KEY---...---END RSA PRIVATE KEY--- block.', type: 'password' },
    PINGXX_USD_TO_CNY_RATE:     { label: 'USD → CNY conversion rate',    help: 'Required. Orders are priced in USD; Ping++ charges in CNY fen. e.g. "7.2" means $1 USD = ¥7.2. Ping++ checkout is blocked until this is set.' },
    PAYPAL_CLIENT_ID:          { label: 'Client ID',                   help: 'Ships to browser. PayPal developer dashboard → My Apps.' },
    PAYPAL_CLIENT_SECRET:      { label: 'Client secret',               help: 'PayPal developer dashboard → My Apps → credentials',                                type: 'password' },
    PAYPAL_WEBHOOK_ID:         { label: 'Webhook ID',                  help: 'PayPal developer dashboard → Webhooks' },
    PAYPAL_ENV:                { label: 'Environment (sandbox / live)', help: 'Set to "sandbox" for testing, "live" for real payments.' },
    SMTP_HOST:                 { label: 'Host',                        help: 'e.g. smtp.sendgrid.net' },
    SMTP_PORT:                 { label: 'Port',                        help: '587 (STARTTLS) or 465 (SSL).' },
    SMTP_USER:                 { label: 'Username',                    help: 'Usually "apikey" for SendGrid.' },
    SMTP_PASSWORD:             { label: 'Password / API key',          help: '',                                                                                  type: 'password' },
    SMTP_FROM:                 { label: 'From address',                help: 'e.g. "GCSS <no-reply@gcss.hk>"' },
    TURNSTILE_SITE_KEY:        { label: 'Site key',                    help: 'Ships to browser. Cloudflare → Turnstile.' },
    TURNSTILE_SECRET_KEY:      { label: 'Secret key',                  help: '',                                                                                  type: 'password' },
    TENCENT_CAPTCHA_APP_ID:    { label: 'App ID',                      help: 'Ships to browser. Tencent Captcha console.' },
    TENCENT_CAPTCHA_SECRET_KEY:{ label: 'App secret',                  help: '',                                                                                  type: 'password' },
    CAPTCHA_PROVIDER:          { label: 'Default provider',            help: 'One of: none | auto | turnstile | tencent.' },
};

export default function AdminSettingsClient() {
    const t = useTranslations('admin.settings');
    const tCommon = useTranslations('admin');
    const router = useRouter();
    const { user, loading } = useAuth();

    const [metas, setMetas] = useState<AppSecretMeta[] | null>(null);
    const [audit, setAudit] = useState<AppSecretAudit[]>([]);
    const [error, setError] = useState('');
    const [busyKey, setBusyKey] = useState('');

    // per-key edit state: if key is present, we're editing & the value is in draft
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [editing, setEditing] = useState<Record<string, boolean>>({});

    const token = typeof window !== 'undefined' ? getAuthToken() : null;

    const reload = useCallback(async () => {
        if (!token) return;
        setError('');
        try {
            const [list, audits] = await Promise.all([
                apiAdminListSettings(token),
                apiAdminListSettingsAudit(token, 20),
            ]);
            setMetas(list);
            setAudit(audits);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        }
    }, [token]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user && user.role !== 'admin') router.push('/dashboard');
    }, [loading, user, router]);

    useEffect(() => {
        if (user?.role === 'admin') void reload();
    }, [user, reload]);

    const byKey = useMemo(() => {
        const m: Record<string, AppSecretMeta> = {};
        for (const s of metas ?? []) m[s.key] = s;
        return m;
    }, [metas]);

    if (loading || !user) return null;
    if (user.role !== 'admin') return null;

    const save = async (key: string) => {
        if (!token) return;
        const value = drafts[key] || '';
        if (!value.trim()) {
            setError(`Value for ${key} is required.`);
            return;
        }
        setBusyKey(key);
        setError('');
        try {
            await apiAdminSetSetting(token, key, value);
            setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
            setEditing((e) => ({ ...e, [key]: false }));
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setBusyKey('');
        }
    };

    const clear = async (key: string) => {
        if (!token) return;
        if (!confirm(t('confirmClear', { key }))) return;
        setBusyKey(key);
        setError('');
        try {
            await apiAdminDeleteSetting(token, key);
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setBusyKey('');
        }
    };

    const groupedKeys = GROUPS.map((g) => {
        const keys = Object.keys(KEY_LABELS).filter((k) => {
            const meta = byKey[k];
            return meta && meta.group === g.id;
        });
        return { group: g, keys };
    });

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

                {!metas ? (
                    <div className="admin-loading">{tCommon('loading')}</div>
                ) : (
                    <>
                        {groupedKeys.map(({ group, keys }) => (
                            <section key={group.id} className="admin-settings-group">
                                <div className="admin-settings-group-head">
                                    <h2>{group.label}</h2>
                                    <p>{group.desc}</p>
                                </div>
                                <div className="admin-settings-fields">
                                    {keys.map((key) => {
                                        const meta = byKey[key];
                                        const cfg = KEY_LABELS[key];
                                        const isEditing = !!editing[key] || !meta.isSet;
                                        const inputType = cfg.type === 'password' ? 'password' : 'text';
                                        return (
                                            <div key={key} className="admin-settings-field">
                                                <div className="admin-settings-field-head">
                                                    <div>
                                                        <div className="admin-settings-key">{key}</div>
                                                        <div className="admin-settings-label">{cfg.label}</div>
                                                    </div>
                                                    <div className="admin-settings-state">
                                                        {meta.isSet ? (
                                                            <span className="admin-chip admin-chip-gold" aria-label="set">
                                                                ● {t('setBadge')}
                                                            </span>
                                                        ) : (
                                                            <span className="admin-chip" aria-label="not set">
                                                                ○ {t('notSetBadge')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {cfg.help && <p className="admin-settings-help">{cfg.help}</p>}

                                                {isEditing ? (
                                                    <div className="admin-settings-edit">
                                                        <input
                                                            className="form-input"
                                                            type={inputType}
                                                            autoComplete="off"
                                                            value={drafts[key] ?? ''}
                                                            onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                                                            placeholder={meta.isSet ? t('newValuePlaceholder') : ''}
                                                        />
                                                        <div className="admin-settings-actions">
                                                            <button
                                                                type="button"
                                                                className={`btn btn-primary btn-sm${busyKey === key ? ' btn-loading' : ''}`}
                                                                disabled={busyKey === key}
                                                                onClick={() => save(key)}
                                                            >
                                                                {t('save')}
                                                            </button>
                                                            {meta.isSet && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary btn-sm"
                                                                    disabled={busyKey === key}
                                                                    onClick={() => {
                                                                        setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
                                                                        setEditing((e) => ({ ...e, [key]: false }));
                                                                    }}
                                                                >
                                                                    {t('cancel')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="admin-settings-view">
                                                        <code className="admin-settings-masked">
                                                            {cfg.type === 'password' ? `••••${meta.lastFour || ''}` : `••••${meta.lastFour || ''}`}
                                                        </code>
                                                        <div className="admin-settings-actions">
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => setEditing((e) => ({ ...e, [key]: true }))}
                                                            >
                                                                {t('update')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm"
                                                                disabled={busyKey === key}
                                                                onClick={() => clear(key)}
                                                            >
                                                                {t('clear')}
                                                            </button>
                                                        </div>
                                                        {meta.updatedAt && (
                                                            <div className="admin-settings-updated">
                                                                {t('updatedAt', { date: new Date(meta.updatedAt).toLocaleString() })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        <section className="admin-settings-group">
                            <div className="admin-settings-group-head">
                                <h2>{t('audit.title')}</h2>
                                <p>{t('audit.desc')}</p>
                            </div>
                            {audit.length === 0 ? (
                                <p className="admin-settings-help">{t('audit.empty')}</p>
                            ) : (
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>{t('audit.when')}</th>
                                            <th>{t('audit.key')}</th>
                                            <th>{t('audit.action')}</th>
                                            <th>{t('audit.actor')}</th>
                                            <th>{t('audit.ip')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {audit.map((a) => (
                                            <tr key={a.id}>
                                                <td>{new Date(a.createdAt).toLocaleString()}</td>
                                                <td><code>{a.key}</code></td>
                                                <td>{a.action}</td>
                                                <td>#{a.actorUserId}</td>
                                                <td>{a.ip || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
