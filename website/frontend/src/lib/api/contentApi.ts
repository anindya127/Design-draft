import { getAuthToken, isAuthApiEnabled } from './authApi';

export type ApiBlogPost = {
    slug: string;
    title: string;
    excerpt: string;
    contentMd: string;
    coverUrl?: string;
    authorName: string;
    publishedAt: string;
    tags: string[];
};

export type ApiForumCategory = {
    slug: string;
    name: string;
    description: string;
};

export type ApiForumTopic = {
    categorySlug: string;
    slug: string;
    title: string;
    bodyMd: string;
    topicType?: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    replyCount: number;
};

export type ApiForumPost = {
    id: number;
    authorName: string;
    createdAt: string;
    bodyMd: string;
    likeCount: number;
    parentId?: number;
};

function getApiBase(): string {
    // Expected to be like: http://127.0.0.1:8080/api
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
        throw new Error(`Request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
    }

    return (await res.json()) as T;
}

function maybeAuthHeader(): Record<string, string> {
    if (!isAuthApiEnabled()) return {};
    const token = getAuthToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

export async function apiListBlogPosts(locale: string, tag?: string, limit = 20): Promise<ApiBlogPost[]> {
    const apiBase = getApiBase();
    const qs = new URLSearchParams();
    if (locale) qs.set('locale', locale);
    if (tag && tag !== 'all') qs.set('tag', tag);
    qs.set('limit', String(limit));
    const data = await fetchJson<{ posts: ApiBlogPost[] }>(`${apiBase}/blog/posts?${qs.toString()}`);
    return data.posts || [];
}

export async function apiGetBlogPost(locale: string, slug: string): Promise<ApiBlogPost> {
    const apiBase = getApiBase();
    const qs = new URLSearchParams();
    if (locale) qs.set('locale', locale);
    return await fetchJson<ApiBlogPost>(`${apiBase}/blog/posts/${encodeURIComponent(slug)}?${qs.toString()}`);
}

export async function apiListForumCategories(locale: string): Promise<ApiForumCategory[]> {
    const apiBase = getApiBase();
    const qs = new URLSearchParams();
    if (locale) qs.set('locale', locale);
    const data = await fetchJson<{ categories: ApiForumCategory[] }>(`${apiBase}/forum/categories?${qs.toString()}`);
    return data.categories || [];
}

export async function apiListForumTopics(
    locale: string,
    opts?: { category?: string; q?: string; sort?: string; limit?: number },
): Promise<ApiForumTopic[]> {
    const apiBase = getApiBase();
    const qs = new URLSearchParams();
    if (locale) qs.set('locale', locale);
    if (opts?.category) qs.set('category', opts.category);
    if (opts?.q) qs.set('q', opts.q);
    if (opts?.sort) qs.set('sort', opts.sort);
    qs.set('limit', String(opts?.limit ?? 20));
    const data = await fetchJson<{ topics: ApiForumTopic[] }>(`${apiBase}/forum/topics?${qs.toString()}`);
    return data.topics || [];
}

export async function apiCreateForumTopic(input: {
    locale: string;
    categorySlug: string;
    title: string;
    bodyMd: string;
    topicType?: string;
    tags?: string[];
}): Promise<{ status: string; topic: ApiForumTopic }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string; topic: ApiForumTopic }>(`${apiBase}/forum/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...maybeAuthHeader() },
        body: JSON.stringify({
            locale: input.locale,
            categorySlug: input.categorySlug,
            title: input.title,
            bodyMd: input.bodyMd,
            topicType: input.topicType,
            tags: input.tags || [],
        }),
    });
}

export async function apiUploadImage(file: File): Promise<{ status: string; url: string }> {
    const apiBase = getApiBase();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${apiBase}/uploads`, {
        method: 'POST',
        headers: {
            ...maybeAuthHeader(),
        },
        body: form,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
    }

    return (await res.json()) as { status: string; url: string };
}

export async function apiGetForumTopic(locale: string, categorySlug: string, topicSlug: string): Promise<{ topic: ApiForumTopic; posts: ApiForumPost[]; userVotes?: Record<string, number> }> {
    const apiBase = getApiBase();
    const qs = new URLSearchParams();
    if (locale) qs.set('locale', locale);
    return await fetchJson<{ topic: ApiForumTopic; posts: ApiForumPost[]; userVotes?: Record<string, number> }>(
        `${apiBase}/forum/topics/${encodeURIComponent(categorySlug)}/${encodeURIComponent(topicSlug)}?${qs.toString()}`,
        { headers: { ...maybeAuthHeader() } },
    );
}

export async function apiPostForumReply(input: {
    locale: string;
    categorySlug: string;
    topicSlug: string;
    authorName?: string;
    bodyMd: string;
    parentId?: number;
}): Promise<{ status: string; post: ApiForumPost }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string; post: ApiForumPost }>(
        `${apiBase}/forum/topics/${encodeURIComponent(input.categorySlug)}/${encodeURIComponent(input.topicSlug)}/replies`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...maybeAuthHeader() },
            body: JSON.stringify({
                locale: input.locale,
                authorName: input.authorName,
                bodyMd: input.bodyMd,
                parentId: input.parentId,
            }),
        },
    );
}

export async function apiVoteForumPost(postId: number, delta: 1 | -1): Promise<{ status: string; likeCount: number; userVote: number }> {
    const apiBase = getApiBase();
    return await fetchJson<{ status: string; likeCount: number; userVote: number }>(`${apiBase}/forum/posts/${encodeURIComponent(String(postId))}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...maybeAuthHeader() },
        body: JSON.stringify({ delta }),
    });
}
