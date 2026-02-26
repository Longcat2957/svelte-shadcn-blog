import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post, postViewsDaily } from '$lib/server/db/schema';
import { desc, sql, gte, lte, and } from 'drizzle-orm';
import { requireAdmin } from '../_utils';

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const url = new URL(event.request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

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

    // 날짜 범위 계산
    let startDate: string;
    let endDate: string;
    let days: number;

    if (startDateParam && endDateParam) {
        startDate = startDateParam;
        endDate = endDateParam;
        const start = new Date(startDate);
        const end = new Date(endDate);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);
        startDate = fifteenDaysAgo.toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        days = 15;
    }

    const viewsByDate = await db
        .select({
            date: postViewsDaily.date,
            views: sql<number>`sum(${postViewsDaily.views})`
        })
        .from(postViewsDaily)
        .where(and(gte(postViewsDaily.date, startDate), lte(postViewsDaily.date, endDate)))
        .groupBy(postViewsDaily.date)
        .orderBy(postViewsDaily.date);

    // 날짜별 데이터 생성 (데이터 없는 날은 0으로 채움)
    const viewsChart: { date: string; views: number }[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
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
