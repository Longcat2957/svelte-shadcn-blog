import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';
import { sql, gte } from 'drizzle-orm';
import { requireAdmin } from '../../_utils';

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [statsRow] = await db
        .select({
            total: sql<number>`count(*)`
        })
        .from(comment);

    const [todayRow] = await db
        .select({
            count: sql<number>`count(*)`
        })
        .from(comment)
        .where(gte(comment.created_at, today));

    const [weekRow] = await db
        .select({
            count: sql<number>`count(*)`
        })
        .from(comment)
        .where(gte(comment.created_at, sevenDaysAgo));

    return json({
        total: Number(statsRow?.total ?? 0),
        today: Number(todayRow?.count ?? 0),
        week: Number(weekRow?.count ?? 0)
    });
};
