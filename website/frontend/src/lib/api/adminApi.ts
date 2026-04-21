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
