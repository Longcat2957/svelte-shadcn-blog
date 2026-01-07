import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import { requireAdmin } from '../_utils';

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const [statsRow] = await db
        .select({
            postsTotal: sql<number>`count(*)`,
            publishedTotal: sql<number>`sum(case when ${post.published} then 1 else 0 end)`,
            draftTotal: sql<number>`sum(case when ${post.published} then 0 else 1 end)`,
            viewsTotal: sql<number>`coalesce(sum(${post.views}), 0)`
        })
        .from(post);

    const recentPosts = await db
        .select({
            id: post.id,
            title: post.title,
            published: post.published,
            categoryId: post.category_id,
            createdAt: post.created_at,
            updatedAt: post.updated_at
        })
        .from(post)
        .orderBy(desc(post.updated_at))
        .limit(10);

    return json({
        stats: {
            postsTotal: Number(statsRow?.postsTotal ?? 0),
            publishedTotal: Number(statsRow?.publishedTotal ?? 0),
            draftTotal: Number(statsRow?.draftTotal ?? 0),
            viewsTotal: Number(statsRow?.viewsTotal ?? 0)
        },
        recentPosts
    });
};
