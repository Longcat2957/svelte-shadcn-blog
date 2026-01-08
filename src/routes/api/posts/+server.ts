import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm';

function parseOptionalInt(v: string | null): number | null {
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const limit = Math.min(
        Math.max(parseOptionalInt(event.url.searchParams.get('limit')) ?? 20, 1),
        100
    );
    const page = Math.max(parseOptionalInt(event.url.searchParams.get('page')) ?? 1, 1);
    const offset = (page - 1) * limit;

    const categoryId = parseOptionalInt(event.url.searchParams.get('categoryId'));
    const tag = (event.url.searchParams.get('tag') ?? '').trim();
    const q = (event.url.searchParams.get('q') ?? '').trim();

    const filters = [] as any[];
    filters.push(eq(post.published, true));

    if (categoryId !== null) filters.push(eq(post.category_id, categoryId));
    
    if (tag) {
        // text[] contains: tag = ANY(tags)
        filters.push(sql`${tag} = any(${post.tags})`);
    }
    if (q) {
        filters.push(or(ilike(post.title, `%${q}%`), ilike(post.description, `%${q}%`)));
    }

    const where = filters.length ? and(...filters) : undefined;

    // Get total count
    const [total] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(post)
        .where(where);

    const items = await db
        .select({
            id: post.id,
            title: post.title,
            description: post.description,
            tags: post.tags,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            views: post.views,
            categoryId: post.category_id
        })
        .from(post)
        .where(where)
        .orderBy(desc(post.id))
        .limit(limit)
        .offset(offset);

    return json({ 
        items, 
        totalCount: total?.count ?? 0, 
        page, 
        limit 
    });
};
