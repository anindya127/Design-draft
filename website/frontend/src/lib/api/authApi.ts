export type AuthUser = {
    id: number;
    username: string;
    email: string;
    role?: string;
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
    createdAt: string;
};

export type AuthSession = {
    token: string;
    expiresAt: string;
};

function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
}

export function isAuthApiEnabled(): boolean {
    const v = (process.env.NEXT_PUBLIC_AUTH_API || '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'y' || v === 'on';
}

const TOKEN_KEY = 'gcss_auth_token';

export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (!token) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers || {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed (${res.status})`);
    }

    return (await res.json()) as T;
}

export async function apiRegister(payload: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
}): Promise<{ user: AuthUser; session: AuthSession }> {
    const apiBase = getApiBase();
    return await fetchJson<{ user: AuthUser; session: AuthSession }>(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function apiLogin(payload: {
    identifier: string;
    password: string;
    captcha?:
        | { provider: 'turnstile'; token: string }
        | { provider: 'tencent'; ticket: string; randstr: string };
}): Promise<{ user: AuthUser; session: AuthSession }> {
    const apiBase = getApiBase();
    return await fetchJson<{ user: AuthUser; session: AuthSession }>(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function apiMe(token: string): Promise<{ user: AuthUser }> {
    const apiBase = getApiBase();
    return await fetchJson<{ user: AuthUser }>(`${apiBase}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiLogout(token: string): Promise<{ status: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string }>(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiRequestPasswordReset(email: string): Promise<{ status: string; expiresAt?: string; demoCode?: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string; expiresAt?: string; demoCode?: string }>(`${apiBase}/auth/password/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
}

export async function apiResetPassword(payload: { email: string; code: string; newPassword: string }): Promise<{ status: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string }>(`${apiBase}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function apiUpdateProfile(
    token: string,
    payload: { firstName: string; lastName: string; phone: string; company: string }
): Promise<{ user: AuthUser }> {
    const apiBase = getApiBase();
    return await fetchJson<{ user: AuthUser }>(`${apiBase}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function apiChangePassword(
    token: string,
    payload: { currentPassword: string; newPassword: string }
): Promise<{ status: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string }>(`${apiBase}/auth/password/change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export type UserForumTopic = {
    categorySlug: string;
    slug: string;
    title: string;
    createdAt: string;
    replyCount: number;
};

export type UserDashboardData = {
    forumTopics: number;
    forumPosts: number;
    activeSessions: number;
    recentTopics: UserForumTopic[];
};

export async function apiUserDashboard(token: string): Promise<{ user: AuthUser; dashboard: UserDashboardData }> {
    const apiBase = getApiBase();
    return await fetchJson<{ user: AuthUser; dashboard: UserDashboardData }>(`${apiBase}/user/dashboard`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiRequestEmailChange(
    token: string,
    newEmail: string
): Promise<{ status: string; expiresAt: string; code?: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string; expiresAt: string; code?: string }>(`${apiBase}/auth/email/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail }),
    });
}

export async function apiConfirmEmailChange(
    token: string,
    code: string
): Promise<{ status: string }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string }>(`${apiBase}/auth/email/change-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
    });
}

export async function apiPublicConfig(): Promise<{ config: Record<string, string> }> {
    const apiBase = getApiBase();
    return await fetchJson<{ config: Record<string, string> }>(`${apiBase}/public/config`, { method: 'GET' });
}
