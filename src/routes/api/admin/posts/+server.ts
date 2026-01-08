import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { and, arrayContains, desc, eq, ilike, lt, or } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../_utils';

function parseOptionalInt(v: string | null): number | null {
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const limit = Math.min(
        Math.max(parseOptionalInt(event.url.searchParams.get('limit')) ?? 20, 1),
        100
    );
    const cursor = parseOptionalInt(event.url.searchParams.get('cursor'));
    const publishedParam = event.url.searchParams.get('published');
    const categoryId = parseOptionalInt(event.url.searchParams.get('categoryId'));
    const q = (event.url.searchParams.get('q') ?? '').trim();
    const tag = (event.url.searchParams.get('tag') ?? '').trim();

    const filters = [] as any[];
    if (publishedParam === 'true') filters.push(eq(post.published, true));
    if (publishedParam === 'false') filters.push(eq(post.published, false));
    if (categoryId !== null) filters.push(eq(post.category_id, categoryId));
    if (cursor !== null) filters.push(lt(post.id, cursor));
    if (q) {
        // title/description에 대한 간단 검색
        filters.push(or(ilike(post.title, `%${q}%`), ilike(post.description, `%${q}%`)));
    }
    if (tag) {
        filters.push(arrayContains(post.tags, [tag]));
    }

    const where = filters.length ? and(...filters) : undefined;

    const items = await db
        .select({
            id: post.id,
            title: post.title,
            description: post.description,
            content: post.content,
            categoryId: post.category_id,
            tags: post.tags,
            published: post.published,
            views: post.views,
            createdAt: post.created_at,
            updatedAt: post.updated_at
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

export const POST: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson<{
        title?: string;
        description?: string | null;
        content?: string;
        categoryId?: number;
        tags?: string[];
        published?: boolean;
    }>(event);
    if (body instanceof Response) return body;

    const title = (body.title ?? '').trim();
    const content = body.content ?? '';
    const categoryId = body.categoryId;
    const tags = body.tags ?? [];
    const published = body.published ?? false;

    if (!title) return json({ message: 'title is required' }, { status: 400 });
    if (!content) return json({ message: 'content is required' }, { status: 400 });
    if (typeof categoryId !== 'number')
        return json({ message: 'categoryId is required' }, { status: 400 });
    if (!Array.isArray(tags)) return json({ message: 'tags must be an array' }, { status: 400 });

    const cat = await db.query.category.findFirst({ where: eq(category.id, categoryId) });
    if (!cat) return json({ message: 'category not found' }, { status: 404 });

    const [created] = await db
        .insert(post)
        .values({
            title,
            description: body.description ?? null,
            content,
            category_id: categoryId,
            tags,
            published
        })
        .returning();

    return json(
        {
            item: {
                id: created.id,
                title: created.title,
                description: created.description,
                content: created.content,
                categoryId: created.category_id,
                tags: created.tags,
                published: created.published,
                views: created.views,
                createdAt: created.created_at,
                updatedAt: created.updated_at
            }
        },
        { status: 201 }
    );
};
