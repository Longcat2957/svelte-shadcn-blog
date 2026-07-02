import type { Cookies } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { post, postReferrerDaily, postViewsDaily } from '$lib/server/db/schema';
import { consumeRateLimit } from '$lib/server/rate-limit';

const VIEWED_POSTS_COOKIE = 'viewed_posts';
const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
const MAX_VIEW_COOKIE_POSTS = 200;

type ReferrerSource =
    | 'Direct'
    | 'Google'
    | 'Naver'
    | 'Daum'
    | 'Bing'
    | 'GitHub'
    | 'Twitter'
    | 'Internal'
    | 'Other';

type TrackPostViewInput = {
    postId: number;
    cookies: Cookies;
    clientAddress: string;
    referer: string;
    origin: string;
};

type TrackPostViewResult = {
    views: number;
    counted: boolean;
};

export async function trackPublishedPostView({
    postId,
    cookies,
    clientAddress,
    referer,
    origin
}: TrackPostViewInput): Promise<TrackPostViewResult | null> {
    const viewed = readViewedPosts(cookies);

    if (viewed.has(postId)) {
        return getPublishedPostViews(postId, false);
    }

    const limit = consumeRateLimit(`post-view:${clientAddress}:${postId}`, {
        windowMs: 30 * 60 * 1000,
        max: 1
    });
    if (limit.limited) {
        return getPublishedPostViews(postId, false);
    }

    const updated = await incrementPublishedPostView(postId);
    if (!updated) return null;

    await recordPostViewAnalytics(postId, referer, origin);
    rememberViewedPost(cookies, viewed, postId);

    return { views: updated.views, counted: true };
}

async function getPublishedPostViews(
    postId: number,
    counted: boolean
): Promise<TrackPostViewResult | null> {
    const found = await db.query.post.findFirst({
        columns: { views: true },
        where: and(eq(post.id, postId), eq(post.published, true))
    });
    if (!found) return null;
    return { views: found.views, counted };
}

async function incrementPublishedPostView(postId: number) {
    const [updated] = await db
        .update(post)
        .set({ views: sql`${post.views} + 1` })
        .where(and(eq(post.id, postId), eq(post.published, true)))
        .returning({ views: post.views });

    return updated ?? null;
}

async function recordPostViewAnalytics(postId: number, referer: string, origin: string) {
    const today = new Date().toISOString().split('T')[0]!;

    await db
        .insert(postViewsDaily)
        .values({ post_id: postId, date: today, views: 1 })
        .onConflictDoUpdate({
            target: [postViewsDaily.post_id, postViewsDaily.date],
            set: { views: sql`${postViewsDaily.views} + 1` }
        });

    const source = classifyReferrer(referer, origin);
    await db
        .insert(postReferrerDaily)
        .values({ post_id: postId, date: today, source, views: 1 })
        .onConflictDoUpdate({
            target: [postReferrerDaily.post_id, postReferrerDaily.date, postReferrerDaily.source],
            set: { views: sql`${postReferrerDaily.views} + 1` }
        });
}

function readViewedPosts(cookies: Cookies) {
    const viewedRaw = cookies.get(VIEWED_POSTS_COOKIE) ?? '';
    const ids = viewedRaw
        .split(',')
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);

    return new Set(ids);
}

function rememberViewedPost(cookies: Cookies, viewed: Set<number>, postId: number) {
    const next = [postId, ...Array.from(viewed).filter((id) => id !== postId)].slice(
        0,
        MAX_VIEW_COOKIE_POSTS
    );

    cookies.set(VIEWED_POSTS_COOKIE, next.join(','), {
        path: '/',
        maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
}

function classifyReferrer(referer: string, origin: string): ReferrerSource {
    if (!referer) return 'Direct';

    try {
        const url = new URL(referer);
        if (url.origin === origin) return 'Internal';

        const host = url.hostname.replace(/^www\./, '');
        if (host.includes('google.')) return 'Google';
        if (host.includes('naver.com')) return 'Naver';
        if (host.includes('daum.net') || host.includes('kakao.com')) return 'Daum';
        if (host.includes('bing.com')) return 'Bing';
        if (host.includes('github.com')) return 'GitHub';
        if (host.includes('twitter.com') || host.includes('t.co') || host.includes('x.com'))
            return 'Twitter';
        return 'Other';
    } catch {
        return 'Direct';
    }
}
