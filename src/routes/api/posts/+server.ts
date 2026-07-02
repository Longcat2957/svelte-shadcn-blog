import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { parsePostListQuery } from '$lib/server/post-query';

export const GET: RequestHandler = async (event) => {
    const { limit, page, offset, categoryId, tag, q } = parsePostListQuery(event.url.searchParams);

    const filters: SQL[] = [];
    filters.push(eq(post.published, true));

    if (categoryId !== null) filters.push(eq(post.category_id, categoryId));

    if (tag) {
        // text[] contains: tag = ANY(tags)
        filters.push(sql`${tag} = any(${post.tags})`);
    }
    if (q) {
        const searchCondition = or(ilike(post.title, `%${q}%`), ilike(post.description, `%${q}%`));
        if (searchCondition) filters.push(searchCondition);
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
            thumbnailUrl: post.thumbnail_url,
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
