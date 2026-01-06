import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const found = await db.query.post.findFirst({
        where: and(eq(post.id, id), eq(post.published, true))
    });

    if (!found) return json({ message: 'post not found' }, { status: 404 });

    // content는 현재 UI가 {@html ...} 이므로, 일단 text(HTML 문자열이라고 가정)를 그대로 반환
    return json({
        item: {
            id: found.id,
            title: found.title,
            description: found.description,
            content: found.content,
            tags: found.tags,
            views: found.views,
            createdAt: found.created_at,
            updatedAt: found.updated_at,
            categoryId: found.category_id
        }
    });
};

