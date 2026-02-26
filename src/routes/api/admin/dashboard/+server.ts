import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post, postViewsDaily } from '$lib/server/db/schema';
import { desc, sql, gte } from 'drizzle-orm';
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

    // 최근 15일간 조회수 추이
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);
    const startDate = fifteenDaysAgo.toISOString().split('T')[0];

    const viewsByDate = await db
        .select({
            date: postViewsDaily.date,
            views: sql<number>`sum(${postViewsDaily.views})`
        })
        .from(postViewsDaily)
        .where(gte(postViewsDaily.date, startDate))
        .groupBy(postViewsDaily.date)
        .orderBy(postViewsDaily.date);

    // 날짜별 데이터 생성 (데이터 없는 날은 0으로 채움)
    const viewsChart: { date: string; views: number }[] = [];
    for (let i = 0; i < 15; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        const dateStr = d.toISOString().split('T')[0];
        const found = viewsByDate.find((v) => v.date === dateStr);
        viewsChart.push({
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            views: Number(found?.views ?? 0)
        });
    }

    return json({
        stats: {
            postsTotal: Number(statsRow?.postsTotal ?? 0),
            publishedTotal: Number(statsRow?.publishedTotal ?? 0),
            draftTotal: Number(statsRow?.draftTotal ?? 0),
            viewsTotal: Number(statsRow?.viewsTotal ?? 0)
        },
        recentPosts,
        viewsChart
    });
};
