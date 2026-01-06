import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) throw error(400, 'Invalid id');

    const found = await db.query.post.findFirst({
        where: and(eq(post.id, id), eq(post.published, true))
    });

    if (!found) {
        throw error(404, 'Post not found');
    }

    return {
        post: {
            id: found.id,
            title: found.title,
            description: found.description,
            content: found.content,
            tags: found.tags,
            date: found.created_at.toISOString()
        }
    };
};
