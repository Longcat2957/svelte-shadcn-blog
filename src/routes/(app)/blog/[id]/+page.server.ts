import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { post, postViewsDaily, postReferrerDaily } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

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

export const load: PageServerLoad = async ({ params, cookies, request, url }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw error(400, 'Invalid id');

    // 현재 구조상 post에 author_id가 없으므로, "첫 번째 관리자(user)"를 작성자로 가정한다.
    // 다중 작성자 기능이 필요해지면 post 테이블에 author_id 추가로 확장 가능.
    const author = await db.query.user.findFirst({
        columns: {
            id: true,
            username: true,
            avatar_url: true
        },
        orderBy: (u, { asc }) => asc(u.id)
    });

    const found = await db.query.post.findFirst({
        where: and(eq(post.id, id), eq(post.published, true))
    });

    if (!found) {
        throw error(404, 'Post not found');
    }

    // 쿠키에서 이미 조회한 post id 목록을 읽어 중복 카운트 방지 (24시간 기준)
    const viewedRaw = cookies.get('viewed_posts') ?? '';
    const viewed = viewedRaw ? viewedRaw.split(',').map(Number) : [];

    if (!viewed.includes(id)) {
        // 조회수 증가
        await db
            .update(post)
            .set({ views: sql`${post.views} + 1` })
            .where(eq(post.id, id));

        // 일별 조회수 기록
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await db
            .insert(postViewsDaily)
            .values({ post_id: id, date: today, views: 1 })
            .onConflictDoUpdate({
                target: [postViewsDaily.post_id, postViewsDaily.date],
                set: { views: sql`${postViewsDaily.views} + 1` }
            });

        // 유입경로 기록
        const referer = request.headers.get('referer') ?? '';
        const source = classifyReferrer(referer, url.origin);
        await db
            .insert(postReferrerDaily)
            .values({ post_id: id, date: today, source, views: 1 })
            .onConflictDoUpdate({
                target: [
                    postReferrerDaily.post_id,
                    postReferrerDaily.date,
                    postReferrerDaily.source
                ],
                set: { views: sql`${postReferrerDaily.views} + 1` }
            });

        // 24시간 동안 유지되는 쿠키로 중복 방문 기록
        viewed.push(id);
        cookies.set('viewed_posts', viewed.join(','), {
            path: '/',
            maxAge: 60 * 60 * 24,
            httpOnly: true,
            sameSite: 'lax'
        });
    }

    return {
        post: {
            id: found.id,
            title: found.title,
            description: found.description,
            content: found.content,
            tags: found.tags,
            date: found.created_at.toISOString(),
            updatedAt: found.updated_at.toISOString()
        },
        author: author
            ? {
                  id: author.id,
                  username: author.username,
                  avatarUrl: author.avatar_url ?? null
              }
            : null
    };
};
