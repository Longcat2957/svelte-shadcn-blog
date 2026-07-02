import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';
import { postUpdateSchema } from '$lib/server/post-input';

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
            thumbnailUrl: found.thumbnail_url,
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

    const body = await readJson(event);
    if (body instanceof Response) return body;

    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid post body.' },
            { status: 400 }
        );
    }
    const bodyData = parsed.data;

    const next: {
        title?: string;
        description?: string | null;
        content?: string;
        category_id?: number;
        tags?: string[];
        published?: boolean;
        thumbnail_url?: string | null;
    } = {};

    if (bodyData.title !== undefined) {
        next.title = bodyData.title;
    }

    if (bodyData.description !== undefined) next.description = bodyData.description;

    if (bodyData.content !== undefined) {
        next.content = bodyData.content;
    }

    if (bodyData.categoryId !== undefined) {
        const categoryId = bodyData.categoryId;
        const cat = await db.query.category.findFirst({ where: eq(category.id, categoryId) });
        if (!cat) return json({ message: 'category not found' }, { status: 404 });
        next.category_id = categoryId;
    }

    if (bodyData.tags !== undefined) {
        next.tags = bodyData.tags;
    }

    if (bodyData.published !== undefined) next.published = bodyData.published;

    if (bodyData.thumbnailUrl !== undefined) next.thumbnail_url = bodyData.thumbnailUrl;

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
            thumbnailUrl: updated.thumbnail_url,
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
