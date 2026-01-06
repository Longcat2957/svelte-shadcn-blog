import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { assertSameOrigin, requireAdmin } from '../../../_utils';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const [updated] = await db.update(post).set({ published: true }).where(eq(post.id, id)).returning();
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

