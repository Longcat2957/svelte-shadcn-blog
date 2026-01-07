import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { assertSameOrigin, readJson } from '../../../_utils';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const postId = parseId(event.params.id);
    if (postId === null) return json({ message: 'invalid id' }, { status: 400 });

    // published 글만 댓글 노출
    const foundPost = await db.query.post.findFirst({
        where: and(eq(post.id, postId), eq(post.published, true))
    });
    if (!foundPost) return json({ message: 'post not found' }, { status: 404 });

    const itemsRaw = await db
        .select({
            id: comment.id,
            author_name: comment.author_name,
            content: comment.content,
            created_at: comment.created_at,
            parent_id: comment.parent_id,
            is_secret: comment.is_secret
        })
        .from(comment)
        .where(eq(comment.post_id, postId))
        .orderBy(asc(comment.created_at));

    const isAdmin = !!event.locals.user;
    const items = itemsRaw.map((item) => {
        if (item.is_secret && !isAdmin) {
            return {
                ...item,
                content: '비밀 댓글입니다.'
            };
        }
        return item;
    });

    return json({ items });
};

export const POST: RequestHandler = async (event) => {
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const postId = parseId(event.params.id);
    if (postId === null) return json({ message: 'invalid id' }, { status: 400 });

    // published 글에만 댓글 허용
    const foundPost = await db.query.post.findFirst({
        where: and(eq(post.id, postId), eq(post.published, true))
    });
    if (!foundPost) return json({ message: 'post not found' }, { status: 404 });

    const body = await readJson<{
        authorName?: string;
        content?: string;
        parentId?: number | null;
        password?: string;
        isSecret?: boolean;
    }>(event);
    if (body instanceof Response) return body;

    const authorName = (body.authorName ?? '').trim();
    const content = (body.content ?? '').trim();
    const parentId = body.parentId ?? null;
    const password = (body.password ?? '').trim();
    const isSecret = !!body.isSecret;

    if (!authorName) return json({ message: 'authorName is required' }, { status: 400 });
    if (!content) return json({ message: 'content is required' }, { status: 400 });
    if (isSecret && !password)
        return json({ message: '비밀 댓글은 비밀번호가 필요합니다.' }, { status: 400 });

    if (parentId !== null) {
        const parent = await db.query.comment.findFirst({ where: eq(comment.id, parentId) });
        if (!parent) return json({ message: 'parent comment not found' }, { status: 404 });
        if (parent.post_id !== postId)
            return json({ message: 'parentId mismatch' }, { status: 400 });
    }

    const [created] = await db
        .insert(comment)
        .values({
            post_id: postId,
            author_name: authorName,
            content,
            parent_id: parentId,
            password: password || null,
            is_secret: isSecret
        })
        .returning();

    return json(
        {
            item: {
                id: created.id,
                author_name: created.author_name,
                content: created.content,
                created_at: created.created_at,
                parent_id: created.parent_id,
                is_secret: created.is_secret
            }
        },
        { status: 201 }
    );
};
