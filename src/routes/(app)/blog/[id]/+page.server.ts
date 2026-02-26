import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { post, postViewsDaily } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
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

    return {
        post: {
            id: found.id,
            title: found.title,
            description: found.description,
            content: found.content,
            tags: found.tags,
            date: found.created_at.toISOString()
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