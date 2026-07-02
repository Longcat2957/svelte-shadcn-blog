import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { assertSameOrigin, readJson } from '../../../_utils';
import { hashPassword } from '$lib/server/auth/password';
import { consumeRateLimit } from '$lib/server/rate-limit';
import { commentInputSchema, parseId, requiresSecretPassword } from '$lib/server/comment-input';
import { maskSecretCommentsForViewer } from '$lib/server/comment-output';

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

    const items = maskSecretCommentsForViewer({
        items: itemsRaw,
        isAdmin: !!event.locals.user
    });

    return json({ items });
};

export const POST: RequestHandler = async (event) => {
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const postId = parseId(event.params.id);
    if (postId === null) return json({ message: 'invalid id' }, { status: 400 });

    const limit = consumeRateLimit(`comment:${event.getClientAddress()}:${postId}`, {
        windowMs: 10 * 60 * 1000,
        max: 5
    });
    if (limit.limited) {
        return json(
            { message: 'Too many comment attempts. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
        );
    }

    // published 글에만 댓글 허용
    const foundPost = await db.query.post.findFirst({
        where: and(eq(post.id, postId), eq(post.published, true))
    });
    if (!foundPost) return json({ message: 'post not found' }, { status: 404 });

    const body = await readJson(event);
    if (body instanceof Response) return body;

    const parsed = commentInputSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid comment body.' },
            { status: 400 }
        );
    }

    const { authorName, content, password, isSecret } = parsed.data;
    const parentId = parsed.data.parentId ?? null;
    if (requiresSecretPassword(parsed.data))
        return json({ message: '비밀 댓글은 비밀번호가 필요합니다.' }, { status: 400 });

    if (parentId !== null) {
        const parent = await db.query.comment.findFirst({ where: eq(comment.id, parentId) });
        if (!parent) return json({ message: 'parent comment not found' }, { status: 404 });
        if (parent.post_id !== postId)
            return json({ message: 'parentId mismatch' }, { status: 400 });
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const [created] = await db
        .insert(comment)
        .values({
            post_id: postId,
            author_name: authorName,
            content,
            parent_id: parentId,
            password: passwordHash,
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
