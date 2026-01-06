import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { assertSameOrigin } from '../../../_utils';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async (event) => {
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const [updated] = await db
        .update(post)
        .set({ views: sql`${post.views} + 1` })
        .where(and(eq(post.id, id), eq(post.published, true)))
        .returning({ views: post.views });

    if (!updated) return json({ message: 'post not found' }, { status: 404 });
    return json({ views: updated.views });
};

