import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const found = await db.query.post.findFirst({ where: eq(post.id, id) });
    if (!found) return json({ message: 'post not found' }, { status: 404 });

    return json({
        item: {
            id: found.id,
            title: found.title,
            description: found.description,
            content: found.content,
            categoryId: found.category_id,
            tags: found.tags,
            published: found.published,
            views: found.views,
            createdAt: found.created_at,
            updatedAt: found.updated_at
        }
    });
};

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const body = await readJson<{
        title?: string;
        description?: string | null;
        content?: string;
        categoryId?: number;
        tags?: string[];
        published?: boolean;
    }>(event);
    if (body instanceof Response) return body;

    const next: {
        title?: string;
        description?: string | null;
        content?: string;
        category_id?: number;
        tags?: string[];
        published?: boolean;
    } = {};

    if (body.title !== undefined) {
        const title = body.title.trim();
        if (!title) return json({ message: 'title cannot be empty' }, { status: 400 });
        next.title = title;
    }

    if (body.description !== undefined) next.description = body.description;

    if (body.content !== undefined) {
        if (!body.content) return json({ message: 'content cannot be empty' }, { status: 400 });
        next.content = body.content;
    }

    if (body.categoryId !== undefined) {
        const categoryId = body.categoryId;
        const cat = await db.query.category.findFirst({ where: eq(category.id, categoryId) });
        if (!cat) return json({ message: 'category not found' }, { status: 404 });
        next.category_id = categoryId;
    }

    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags))
            return json({ message: 'tags must be an array' }, { status: 400 });
        next.tags = body.tags;
    }

    if (body.published !== undefined) next.published = body.published;

    const [updated] = await db.update(post).set(next).where(eq(post.id, id)).returning();
    if (!updated) return json({ message: 'post not found' }, { status: 404 });

    return json({
        item: {
            id: updated.id,
            title: updated.title,
            description: updated.description,
            content: updated.content,
            categoryId: updated.category_id,
            tags: updated.tags,
            published: updated.published,
            views: updated.views,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at
        }
    });
};

export const DELETE: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const [deleted] = await db.delete(post).where(eq(post.id, id)).returning({ id: post.id });
    if (!deleted) return json({ message: 'post not found' }, { status: 404 });
    return new Response(null, { status: 204 });
};
