export type AdminOverview = {
    usersTotal: number;
    adminsTotal: number;
    sessionsActive: number;
    formRequestsTotal: number;
    blogPostsTotal: number;
    forumTopicsTotal: number;
    forumPostsTotal: number;
};

function getApiBase(): string {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
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

export async function apiAdminOverview(token: string): Promise<{ overview: AdminOverview }> {
    const apiBase = getApiBase();
    return await fetchJson<{ overview: AdminOverview }>(`${apiBase}/admin/overview`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ── Admin Blog API ──────────────────────────────

export type AdminBlogPost = {
    slug: string;
    title: string;
    excerpt: string;
    contentMd: string;
    coverUrl?: string;
    authorName: string;
    publishedAt: string;
    updatedAt?: string;
    tags: string[];
    status: string;
    metaTitle?: string;
    metaDescription?: string;
    seoKeywords?: string;
    seoSubKeywords?: string;
    ogImageUrl?: string;
};

export async function apiAdminListBlogPosts(token: string, locale = 'en'): Promise<AdminBlogPost[]> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ posts: AdminBlogPost[] }>(`${apiBase}/admin/blog/posts?locale=${locale}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.posts;
}

export async function apiAdminCreateBlogPost(token: string, post: Partial<AdminBlogPost> & { locale: string }): Promise<AdminBlogPost> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ post: AdminBlogPost }>(`${apiBase}/admin/blog/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(post),
    });
    return res.post;
}

export async function apiAdminUpdateBlogPost(token: string, slug: string, post: Partial<AdminBlogPost> & { locale: string }): Promise<AdminBlogPost> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ post: AdminBlogPost }>(`${apiBase}/admin/blog/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(post),
    });
    return res.post;
}

export async function apiAdminDeleteBlogPost(token: string, slug: string): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson<{ status: string }>(`${apiBase}/admin/blog/posts/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ── Admin Users API ─────────────────────────────

export type AdminUser = {
    id: number;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
    createdAt: string;
    disabledAt?: string | null;
};

export async function apiAdminListUsers(token: string): Promise<AdminUser[]> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ users: AdminUser[] }>(`${apiBase}/admin/users`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.users;
}

export async function apiAdminSetUserRole(token: string, userId: number, role: string): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
    });
}

export async function apiAdminSetUserDisabled(token: string, userId: number, disabled: boolean): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/users/${userId}/disable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disabled }),
    });
}

// ── Admin Forum API ─────────────────────────────

export type AdminForumTopic = {
    id: number;
    categorySlug: string;
    slug: string;
    title: string;
    authorName: string;
    createdAt: string;
    replyCount: number;
};

export async function apiAdminListForumTopics(token: string, locale = 'en'): Promise<AdminForumTopic[]> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ topics: AdminForumTopic[] }>(`${apiBase}/admin/forum/topics?locale=${locale}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.topics;
}

export async function apiAdminDeleteForumTopic(token: string, topicId: number): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/forum/topics/${topicId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiAdminDeleteForumPost(token: string, postId: number): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ── Admin Audit / Requests API ──────────────────

export type FormRequestRecord = {
    id: number;
    type: string;
    createdAt: string;
    ip: string;
    ua: string;
    payload: string;
};

export async function apiAdminListRequests(token: string, type = '', limit = 50): Promise<FormRequestRecord[]> {
    const apiBase = getApiBase();
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('limit', String(limit));
    const res = await fetchJson<{ requests: FormRequestRecord[] }>(`${apiBase}/admin/requests?${params}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.requests;
}

// ── Admin: App Secrets / Settings ──────────────────────────────

export type AppSecretMeta = {
    key: string;
    group: string;
    isSet: boolean;
    lastFour?: string;
    updatedAt?: string;
    updatedBy?: number;
};

export type AppSecretAudit = {
    id: number;
    key: string;
    action: string;
    actorUserId: number;
    ip?: string;
    ua?: string;
    createdAt: string;
};

export async function apiAdminListSettings(token: string): Promise<AppSecretMeta[]> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ settings: AppSecretMeta[] }>(`${apiBase}/admin/settings`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.settings;
}

export async function apiAdminSetSetting(token: string, key: string, value: string): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value }),
    });
}

export async function apiAdminDeleteSetting(token: string, key: string): Promise<void> {
    const apiBase = getApiBase();
    await fetchJson(`${apiBase}/admin/settings/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function apiAdminListSettingsAudit(token: string, limit = 50): Promise<AppSecretAudit[]> {
    const apiBase = getApiBase();
    const res = await fetchJson<{ audit: AppSecretAudit[] }>(`${apiBase}/admin/settings/audit?limit=${limit}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.audit;
}

export async function apiUploadFile(token: string, file: File): Promise<string> {
    const apiBase = getApiBase();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${apiBase}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data.url;
}
