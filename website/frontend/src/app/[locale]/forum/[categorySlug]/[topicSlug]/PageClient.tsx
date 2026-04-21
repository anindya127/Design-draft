'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import MarkdownEditor from '@/components/ui/MarkdownEditor';
import { apiMe, getAuthToken, isAuthApiEnabled, setAuthToken, type AuthUser } from '@/lib/api/authApi';
import {
    apiGetForumTopic,
    apiPostForumReply,
    apiUploadImage,
    apiVoteForumPost,
    type ApiForumPost,
    type ApiForumTopic,
} from '@/lib/api/contentApi';
import { getStaticForumTopic } from '@/lib/content/staticContent';

const AVATAR_COLORS = ['avatar-amber', 'avatar-blue', 'avatar-emerald', 'avatar-violet', 'avatar-rose', 'avatar-cyan', 'avatar-orange', 'avatar-indigo'];
function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDateTime(iso: string, locale: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function UpArrow({ active }: { active?: boolean }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
            <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
    );
}

function DownArrow({ active }: { active?: boolean }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--danger)' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
            <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
    );
}

export default function ForumTopicPage({ categorySlug, topicSlug }: { categorySlug: string; topicSlug: string }) {
    const locale = useLocale();
    const t = useTranslations();

    const staticThread = useMemo(() => getStaticForumTopic(locale, categorySlug, topicSlug), [locale, categorySlug, topicSlug]);

    const [topic, setTopic] = useState<ApiForumTopic | null>(staticThread?.topic ?? null);
    const [posts, setPosts] = useState<ApiForumPost[]>(staticThread?.posts ?? []);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(!staticThread);
    const [error, setError] = useState<string | null>(null);

    const [replyBody, setReplyBody] = useState('');
    const [replying, setReplying] = useState(false);
    const [replyParent, setReplyParent] = useState<{ id: number; authorName: string } | null>(null);
    const [votingPostIds, setVotingPostIds] = useState<Set<number>>(() => new Set());
    const allowPost = ['1', 'true', 'yes'].includes((process.env.NEXT_PUBLIC_FORMS_API || '').toLowerCase());

    const authEnabled = isAuthApiEnabled();
    const [authLoading, setAuthLoading] = useState(authEnabled);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function loadMe() {
            if (!authEnabled) { setAuthLoading(false); return; }
            const token = getAuthToken();
            if (!token) { setAuthLoading(false); return; }
            try {
                const { user } = await apiMe(token);
                if (!cancelled) setCurrentUser(user);
            } catch { setAuthToken(null); if (!cancelled) setCurrentUser(null); }
            finally { if (!cancelled) setAuthLoading(false); }
        }
        void loadMe();
        return () => { cancelled = true; };
    }, [authEnabled]);

    const effectiveAuthorName = currentUser?.username || (authEnabled ? '' : 'Guest');
    const canReply = allowPost && !replying && (!authEnabled || (!authLoading && !!currentUser));

    const postTree = useMemo(() => {
        const children = new Map<number | null, ApiForumPost[]>();
        for (const p of posts) {
            const parentKey = typeof p.parentId === 'number' ? p.parentId : null;
            const arr = children.get(parentKey) ?? [];
            arr.push(p);
            children.set(parentKey, arr);
        }
        for (const arr of children.values()) arr.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
        return { children };
    }, [posts]);

    async function loadThread() {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGetForumTopic(locale, categorySlug, topicSlug);
            setTopic(data.topic);
            setPosts(data.posts);
            if (data.userVotes) setUserVotes(data.userVotes);
        } catch (e) {
            if (staticThread) { setTopic(staticThread.topic); setPosts(staticThread.posts); }
            else setError(e instanceof Error ? e.message : 'Failed to load');
        } finally { setLoading(false); }
    }

    useEffect(() => { void loadThread(); }, [locale, categorySlug, topicSlug]);

    async function submitReply(e: React.FormEvent) {
        e.preventDefault();
        if (!allowPost || (authEnabled && !currentUser) || !replyBody.trim()) return;
        setReplying(true);
        setError(null);
        try {
            await apiPostForumReply({ locale, categorySlug, topicSlug, authorName: effectiveAuthorName || undefined, bodyMd: replyBody.trim(), parentId: replyParent?.id });
            setReplyBody('');
            setReplyParent(null);
            await loadThread();
        } catch (e2) { setError(e2 instanceof Error ? e2.message : 'Failed to post'); }
        finally { setReplying(false); }
    }

    async function votePost(postId: number, delta: 1 | -1) {
        if (votingPostIds.has(postId) || !currentUser) return;
        setVotingPostIds(prev => new Set(prev).add(postId));
        try {
            const res = await apiVoteForumPost(postId, delta);
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount: res.likeCount } : p));
            setUserVotes(prev => ({ ...prev, [String(postId)]: res.userVote }));
        } catch (e2) { setError(e2 instanceof Error ? e2.message : 'Vote failed'); }
        finally { setVotingPostIds(prev => { const n = new Set(prev); n.delete(postId); return n; }); }
    }

    function renderPost(p: ApiForumPost, depth: number) {
        const kids = postTree.children.get(p.id) ?? [];
        const authorName = p.authorName || 'Guest';
        const uv = userVotes[String(p.id)] || 0;

        return (
            <div key={p.id} className={`ft-post${depth > 0 ? ' ft-post--nested' : ''}`} style={depth > 0 ? { marginLeft: Math.min(depth * 24, 72) } : undefined}>
                <div className="ft-post-vote">
                    <button type="button" className={`ft-vote-btn${uv === 1 ? ' ft-vote-btn--active-up' : ''}`} onClick={() => votePost(p.id, 1)} disabled={votingPostIds.has(p.id) || !currentUser}>
                        <UpArrow active={uv === 1} />
                    </button>
                    <span className={`ft-vote-count${uv === 1 ? ' ft-vote-count--up' : uv === -1 ? ' ft-vote-count--down' : ''}`}>{p.likeCount}</span>
                    <button type="button" className={`ft-vote-btn${uv === -1 ? ' ft-vote-btn--active-down' : ''}`} onClick={() => votePost(p.id, -1)} disabled={votingPostIds.has(p.id) || !currentUser}>
                        <DownArrow active={uv === -1} />
                    </button>
                </div>

                <div className="ft-post-body">
                    <div className="ft-post-header">
                        <div className={`ft-post-avatar ${getAvatarColor(authorName)}`}>{authorName.charAt(0).toUpperCase()}</div>
                        <span className="ft-post-author">{authorName}</span>
                        <span className="ft-post-time">{formatDateTime(p.createdAt, locale)}</span>
                    </div>
                    <div className="ft-post-content blog-prose">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.bodyMd}</ReactMarkdown>
                    </div>
                    <div className="ft-post-actions">
                        <button type="button" className="ft-action-btn" onClick={() => { setReplyParent({ id: p.id, authorName }); setTimeout(() => document.getElementById('forum-reply-editor')?.focus(), 0); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                            {t('forum.topic.reply')}
                        </button>
                    </div>
                    {kids.length > 0 && <div className="ft-post-children">{kids.map(k => renderPost(k, depth + 1))}</div>}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="forum-hero">
                <div className="forum-topic-inner">
                    <Link href="/forum" className="vg-article-back" style={{ marginBottom: 16 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        {t('forum.topic.back')}
                    </Link>
                    <h1 className="ft-title">{topic?.title ?? t('forum.topic.loading')}</h1>
                    {topic && (
                        <div className="ft-topic-meta">
                            <span className="ft-topic-author">{topic.authorName}</span>
                            <span className="ft-topic-date">{formatDateTime(topic.createdAt, locale)}</span>
                            <span className="ft-topic-replies">{topic.replyCount} {t('forum.replies')}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Content */}
            <div className="ft-container">
                {loading ? (
                    <div className="dashboard-loading"><div className="dashboard-loading-spinner" /><p>{t('forum.topic.loading')}</p></div>
                ) : topic ? (
                    <>
                        {/* Original post */}
                        <div className="ft-post ft-post--op">
                            <div className="ft-post-body">
                                <div className="ft-post-header">
                                    <div className={`ft-post-avatar ${getAvatarColor(topic.authorName)}`}>{(topic.authorName || 'G').charAt(0).toUpperCase()}</div>
                                    <span className="ft-post-author">{topic.authorName}</span>
                                    <span className="ft-post-time">{formatDateTime(topic.createdAt, locale)}</span>
                                    {topic.tags?.map(tag => <span key={tag} className="vg-tag" style={{ marginLeft: 'auto' }}>{tag}</span>)}
                                </div>
                                <div className="ft-post-content blog-prose">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.bodyMd}</ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Replies */}
                        {posts.length > 0 && (
                            <div className="ft-replies-header">
                                <h2>{posts.length} {posts.length === 1 ? t('forum.topic.reply') : t('forum.replies')}</h2>
                            </div>
                        )}
                        <div className="ft-posts">
                            {(postTree.children.get(null) ?? posts.filter(p => typeof p.parentId !== 'number')).map(p => renderPost(p, 0))}
                        </div>

                        {/* Reply composer */}
                        {allowPost && (
                            <div className="ft-composer">
                                <h3 className="ft-composer-title">{t('forum.topic.reply')}</h3>

                                {replyParent && (
                                    <div className="ft-replying-to">
                                        {t('forum.topic.replyingTo')} <strong>{replyParent.authorName}</strong>
                                        <button type="button" className="ft-replying-cancel" onClick={() => setReplyParent(null)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                        </button>
                                    </div>
                                )}

                                {authEnabled && !authLoading && !currentUser && (
                                    <div className="ft-login-prompt">
                                        {t('forum.topic.loginToReply')} <Link href="/login" className="auth-link">{t('forum.topic.login')}</Link>
                                    </div>
                                )}

                                <form onSubmit={submitReply}>
                                    <MarkdownEditor
                                        id="forum-reply-editor"
                                        value={replyBody}
                                        onChange={setReplyBody}
                                        placeholder={t('forum.topic.replyPlaceholder')}
                                        disabled={replying || (authEnabled && !currentUser)}
                                        textareaClassName="ft-textarea"
                                        previewClassName="ft-preview blog-prose"
                                        uploadImage={allowPost ? async (file) => { const res = await apiUploadImage(file); return res.url; } : undefined}
                                        labels={{
                                            write: t('forum.topic.write'), preview: t('forum.topic.preview'),
                                            previewEmpty: t('forum.topic.previewEmpty'), markdownGuide: t('forum.topic.markdownGuide'),
                                            uploading: t('forum.editor.uploading'), uploadFailed: t('forum.editor.uploadFailed'),
                                            insertLink: t('forum.editor.insertLink'), insertImage: t('forum.editor.insertImage'),
                                            undo: t('forum.editor.undo'), redo: t('forum.editor.redo'),
                                            heading: t('forum.editor.heading'), bold: t('forum.editor.bold'),
                                            italic: t('forum.editor.italic'), inlineCode: t('forum.editor.inlineCode'),
                                            bulletList: t('forum.editor.bulletList'), numberedList: t('forum.editor.numberedList'),
                                            table: t('forum.editor.table'), mention: t('forum.editor.mention'),
                                        }}
                                    />
                                    <div className="ft-composer-actions">
                                        <button type="submit" className={`btn btn-primary${replying ? ' btn-loading' : ''}`} disabled={!canReply || !replyBody.trim()}>
                                            {replying ? t('forum.topic.replying') : t('forum.topic.replySubmit')}
                                        </button>
                                    </div>
                                    {error && <div className="form-banner form-banner--error" style={{ marginTop: 12 }}>{error}</div>}
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="vg-article-error">
                        <h2>{t('forum.topic.notFound')}</h2>
                        {error && <p>{error}</p>}
                        <Link href="/forum" className="btn btn-primary btn-sm">{t('forum.topic.back')}</Link>
                    </div>
                )}
            </div>
        </>
    );
}
