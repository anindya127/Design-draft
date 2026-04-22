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
} from '@/lib/api/authApi';

type BannerMsg = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function DashboardProfileClient() {
    const t = useTranslations('dashboard');
    const { user, refresh } = useAuth();

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

    return (
        <>
            <h1 className="dash-page-title">{t('profile.title')}</h1>

            {profileMsg && <div className={`form-banner form-banner--${profileMsg.type}`}>{profileMsg.text}</div>}

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('profile.subscription')}</h2>
                <div className="dash-subscription-chip">{t('profile.freePlan')}</div>
            </div>

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('profile.personalInfo')}</h2>
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label">{t('fields.firstName')}</label>
                        <input
                            className="form-input"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('fields.lastName')}</label>
                        <input
                            className="form-input"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        />
                    </div>
                </div>
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label">{t('fields.phone')}</label>
                        <input
                            className="form-input"
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('fields.company')}</label>
                        <input
                            className="form-input"
                            value={profileForm.company}
                            onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    className={`btn btn-primary${profileSaving ? ' btn-loading' : ''}`}
                    disabled={profileSaving}
                    onClick={handleProfileSave}
                >
                    {t('saveProfile')}
                </button>
            </div>

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('email.title')}</h2>
                {emailMsg && (
                    <div className={`form-banner form-banner--${emailMsg.type}`}>{emailMsg.text}</div>
                )}
                {emailStage === 'idle' ? (
                    <>
                        <div className="form-group">
                            <label className="form-label">{t('fields.currentEmail')}</label>
                            <input className="form-input" value={user.email} disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('fields.newEmail')}</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="name@example.com"
                                value={emailNew}
                                onChange={(e) => setEmailNew(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className={`btn btn-secondary${emailBusy ? ' btn-loading' : ''}`}
                            disabled={emailBusy}
                            onClick={handleEmailRequest}
                        >
                            {t('email.sendCode')}
                        </button>
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
                            <label className="form-label">{t('fields.verificationCode')}</label>
                            <input
                                className="form-input"
                                value={emailCode}
                                onChange={(e) => setEmailCode(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                inputMode="numeric"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
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
            </div>

            <div className="dash-form-card">
                <h2 className="dash-section-title">{t('security.changePassword')}</h2>
                {pwMsg && <div className={`form-banner form-banner--${pwMsg.type}`}>{pwMsg.text}</div>}
                <div className="form-group">
                    <label className="form-label">{t('security.currentPassword')}</label>
                    <input
                        className="form-input"
                        type="password"
                        autoComplete="current-password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    />
                </div>
                <div className="auth-form-row">
                    <div className="form-group">
                        <label className="form-label">{t('security.newPassword')}</label>
                        <input
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={pwForm.newPassword}
                            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('security.confirmPassword')}</label>
                        <input
                            className="form-input"
                            type="password"
                            autoComplete="new-password"
                            value={pwForm.confirmPassword}
                            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    className={`btn btn-primary${pwSaving ? ' btn-loading' : ''}`}
                    disabled={pwSaving}
                    onClick={handlePasswordChange}
                >
                    {t('security.updatePassword')}
                </button>
            </div>
        </>
    );
}
