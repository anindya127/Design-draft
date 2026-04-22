'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import {
    getAuthToken,
    apiUpdateProfile,
    apiChangePassword,
    apiRequestEmailChange,
    apiConfirmEmailChange,
    apiUserDashboard,
    type UserDashboardData,
} from '@/lib/api/authApi';

type BannerMsg = { type: 'success' | 'error' | 'info'; text: string } | null;

function formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Section header icons ────────────────────────────────────────────────

function UserIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
function MailIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-10 5L2 7" />
        </svg>
    );
}
function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function StatCard({
    label,
    value,
    sub,
    tint = 'amber',
}: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    tint?: 'amber' | 'green' | 'blue' | 'purple';
}) {
    return (
        <div className={`dash-stat-card dash-stat-card--${tint}`}>
            <div className="dash-stat-label">{label}</div>
            <div className="dash-stat-value">{value}</div>
            {sub && <div className="dash-stat-sub">{sub}</div>}
        </div>
    );
}

export default function DashboardProfileClient() {
    const t = useTranslations('dashboard');
    const { user, refresh } = useAuth();

    const [dashData, setDashData] = useState<UserDashboardData | null>(null);

    const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', company: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<BannerMsg>(null);

    const [emailStage, setEmailStage] = useState<'idle' | 'verify'>('idle');
    const [emailNew, setEmailNew] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailMsg, setEmailMsg] = useState<BannerMsg>(null);
    const [emailDebugCode, setEmailDebugCode] = useState<string | null>(null);

    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<BannerMsg>(null);

    useEffect(() => {
        if (user) {
            setProfileForm({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                company: user.company || '',
            });
        }
    }, [user]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token || !user) return;
        let cancelled = false;
        apiUserDashboard(token)
            .then((res) => { if (!cancelled) setDashData(res.dashboard); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user]);

    const handleProfileSave = async () => {
        const token = getAuthToken();
        if (!token) return;
        setProfileSaving(true);
        setProfileMsg(null);
        try {
            await apiUpdateProfile(token, profileForm);
            await refresh();
            setProfileMsg({ type: 'success', text: t('profileUpdated') });
            setTimeout(() => setProfileMsg(null), 3000);
        } catch (err) {
            setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : t('profileError') });
        } finally {
            setProfileSaving(false);
        }
    };

    const handleEmailRequest = async () => {
        const token = getAuthToken();
        if (!token) return;
        if (!emailNew.trim()) {
            setEmailMsg({ type: 'error', text: t('email.required') });
            return;
        }
        setEmailBusy(true);
        setEmailMsg(null);
        try {
            const res = await apiRequestEmailChange(token, emailNew.trim());
            setEmailStage('verify');
            setEmailDebugCode(res.code ?? null);
            setEmailMsg({ type: 'info', text: t('email.sent') });
        } catch (err) {
            setEmailMsg({ type: 'error', text: err instanceof Error ? err.message : t('email.error') });
        } finally {
            setEmailBusy(false);
        }
    };

    const handleEmailConfirm = async () => {
        const token = getAuthToken();
        if (!token) return;
        if (!emailCode.trim()) {
            setEmailMsg({ type: 'error', text: t('email.codeRequired') });
            return;
        }
        setEmailBusy(true);
        setEmailMsg(null);
        try {
            await apiConfirmEmailChange(token, emailCode.trim());
            await refresh();
            setEmailStage('idle');
            setEmailNew('');
            setEmailCode('');
            setEmailDebugCode(null);
            setEmailMsg({ type: 'success', text: t('email.updated') });
            setTimeout(() => setEmailMsg(null), 3000);
        } catch (err) {
            setEmailMsg({ type: 'error', text: err instanceof Error ? err.message : t('email.error') });
        } finally {
            setEmailBusy(false);
        }
    };

    const handlePasswordChange = async () => {
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg({ type: 'error', text: t('passwordMismatch') });
            return;
        }
        if (pwForm.newPassword.length < 8) {
            setPwMsg({ type: 'error', text: t('passwordTooShort') });
            return;
        }
        const token = getAuthToken();
        if (!token) return;
        setPwSaving(true);
        setPwMsg(null);
        try {
            await apiChangePassword(token, {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPwMsg({ type: 'success', text: t('passwordChanged') });
            setTimeout(() => setPwMsg(null), 3000);
        } catch (err) {
            setPwMsg({ type: 'error', text: err instanceof Error ? err.message : t('passwordError') });
        } finally {
            setPwSaving(false);
        }
    };

    if (!user) return null;

    const forumActivity = dashData
        ? `${dashData.forumTopics} ${t('stats.topics')} · ${dashData.forumPosts} ${t('stats.posts')}`
        : '—';

    return (
        <>
            <h1 className="dash-page-title">{t('profile.title')}</h1>

            {/* At-a-glance stats */}
            <section className="dash-stats-row" aria-label={t('stats.overview')}>
                <StatCard label={t('profile.subscription')} value={t('profile.freePlan')} tint="amber" />
                <StatCard label={t('stats.memberSince')} value={formatDate(user.createdAt)} tint="blue" />
                <StatCard
                    label={t('stats.activeSessions')}
                    value={dashData ? dashData.activeSessions : '—'}
                    tint="green"
                />
                <StatCard label={t('stats.forumActivity')} value={forumActivity} tint="purple" />
            </section>

            {/* Personal information */}
            <section className="dash-section-card">
                <header className="dash-section-card-head">
                    <span className="dash-section-icon" aria-hidden="true"><UserIcon /></span>
                    <div>
                        <h2 className="dash-section-card-title">{t('profile.personalInfo')}</h2>
                        <p className="dash-section-card-desc">{t('profile.personalInfoDesc')}</p>
                    </div>
                </header>
                {profileMsg && (
                    <div
                        className={`form-banner form-banner--${profileMsg.type}`}
                        role={profileMsg.type === 'error' ? 'alert' : 'status'}
                        aria-live={profileMsg.type === 'error' ? 'assertive' : 'polite'}
                    >
                        {profileMsg.text}
                    </div>
                )}
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-first">{t('fields.firstName')}</label>
                        <input
                            id="fld-first"
                            className="form-input"
                            value={profileForm.firstName}
                            autoComplete="given-name"
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-last">{t('fields.lastName')}</label>
                        <input
                            id="fld-last"
                            className="form-input"
                            value={profileForm.lastName}
                            autoComplete="family-name"
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        />
                    </div>
                </div>
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-phone">{t('fields.phone')}</label>
                        <input
                            id="fld-phone"
                            className="form-input"
                            type="tel"
                            value={profileForm.phone}
                            autoComplete="tel"
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-company">{t('fields.company')}</label>
                        <input
                            id="fld-company"
                            className="form-input"
                            value={profileForm.company}
                            autoComplete="organization"
                            onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                        />
                    </div>
                </div>
                <div className="dash-section-card-actions">
                    <button
                        type="button"
                        className={`btn btn-primary${profileSaving ? ' btn-loading' : ''}`}
                        disabled={profileSaving}
                        onClick={handleProfileSave}
                    >
                        {t('saveProfile')}
                    </button>
                </div>
            </section>

            {/* Email change */}
            <section className="dash-section-card">
                <header className="dash-section-card-head">
                    <span className="dash-section-icon" aria-hidden="true"><MailIcon /></span>
                    <div>
                        <h2 className="dash-section-card-title">{t('email.title')}</h2>
                        <p className="dash-section-card-desc">{t('email.desc')}</p>
                    </div>
                </header>
                {emailMsg && (
                    <div
                        className={`form-banner form-banner--${emailMsg.type}`}
                        role={emailMsg.type === 'error' ? 'alert' : 'status'}
                        aria-live={emailMsg.type === 'error' ? 'assertive' : 'polite'}
                    >
                        {emailMsg.text}
                    </div>
                )}
                {emailStage === 'idle' ? (
                    <>
                        <div className="auth-form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="fld-cur-email">{t('fields.currentEmail')}</label>
                                <input id="fld-cur-email" className="form-input" value={user.email} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="fld-new-email">{t('fields.newEmail')}</label>
                                <input
                                    id="fld-new-email"
                                    className="form-input"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={emailNew}
                                    autoComplete="email"
                                    onChange={(e) => setEmailNew(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="dash-section-card-actions">
                            <button
                                type="button"
                                className={`btn btn-secondary${emailBusy ? ' btn-loading' : ''}`}
                                disabled={emailBusy}
                                onClick={handleEmailRequest}
                            >
                                {t('email.sendCode')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="dash-section-desc">{t('email.verifyDesc', { email: emailNew })}</p>
                        {emailDebugCode && (
                            <div className="form-banner form-banner--info">
                                {t('email.debugCode', { code: emailDebugCode })}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label" htmlFor="fld-email-code">{t('fields.verificationCode')}</label>
                            <input
                                id="fld-email-code"
                                className="form-input"
                                value={emailCode}
                                onChange={(e) => setEmailCode(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                            />
                        </div>
                        <div className="dash-section-card-actions">
                            <button
                                type="button"
                                className={`btn btn-primary${emailBusy ? ' btn-loading' : ''}`}
                                disabled={emailBusy}
                                onClick={handleEmailConfirm}
                            >
                                {t('email.verify')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={emailBusy}
                                onClick={() => {
                                    setEmailStage('idle');
                                    setEmailCode('');
                                    setEmailDebugCode(null);
                                    setEmailMsg(null);
                                }}
                            >
                                {t('email.cancel')}
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* Password change */}
            <section className="dash-section-card">
                <header className="dash-section-card-head">
                    <span className="dash-section-icon" aria-hidden="true"><LockIcon /></span>
                    <div>
                        <h2 className="dash-section-card-title">{t('security.changePassword')}</h2>
                        <p className="dash-section-card-desc">{t('security.changePasswordDesc')}</p>
                    </div>
                </header>
                {pwMsg && (
                    <div
                        className={`form-banner form-banner--${pwMsg.type}`}
                        role={pwMsg.type === 'error' ? 'alert' : 'status'}
                        aria-live={pwMsg.type === 'error' ? 'assertive' : 'polite'}
                    >
                        {pwMsg.text}
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label" htmlFor="fld-cur-pw">{t('security.currentPassword')}</label>
                    <input
                        id="fld-cur-pw"
                        className="form-input"
                        type="password"
                        autoComplete="current-password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    />
                </div>
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-new-pw">{t('security.newPassword')}</label>
                        <input
                            id="fld-new-pw"
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={pwForm.newPassword}
                            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="fld-confirm-pw">{t('security.confirmPassword')}</label>
                        <input
                            id="fld-confirm-pw"
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={pwForm.confirmPassword}
                            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>
                <div className="dash-section-card-actions">
                    <button
                        type="button"
                        className={`btn btn-primary${pwSaving ? ' btn-loading' : ''}`}
                        disabled={pwSaving}
                        onClick={handlePasswordChange}
                    >
                        {t('security.updatePassword')}
                    </button>
                </div>
            </section>
        </>
    );
}
