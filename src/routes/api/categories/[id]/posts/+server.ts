import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, desc, eq, lt, sql } from 'drizzle-orm';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(v: string | null): number | null {
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const categoryId = parseId(event.params.id);
    if (categoryId === null) return json({ message: 'invalid category id' }, { status: 400 });

    const limit = Math.min(
        Math.max(parseOptionalInt(event.url.searchParams.get('limit')) ?? 20, 1),
        100
    );
    const cursor = parseOptionalInt(event.url.searchParams.get('cursor'));

    const where = and(
        eq(post.published, true),
        eq(post.category_id, categoryId),
        cursor === null ? sql`true` : lt(post.id, cursor)
    );

    const items = await db
        .select({
            id: post.id,
            title: post.title,
            createdAt: post.created_at
        })
        .from(post)
        .where(where)
        .orderBy(desc(post.id))
        .limit(limit + 1);

    const hasNext = items.length > limit;
    const sliced = hasNext ? items.slice(0, limit) : items;
    const nextCursor = hasNext ? sliced[sliced.length - 1]!.id : null;

    return json({ items: sliced, nextCursor });
};
