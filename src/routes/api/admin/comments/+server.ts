import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { desc, lt, gte, eq, and } from 'drizzle-orm';
import { requireAdmin } from '../_utils';

const DEFAULT_LIMIT = 20;

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const url = new URL(event.request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 100);
    const cursor = url.searchParams.get('cursor');
    const filter = url.searchParams.get('filter'); // 'all' | 'today' | 'week'

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let whereClause = cursor ? lt(comment.id, Number(cursor)) : undefined;

    if (filter === 'today') {
        whereClause = cursor
            ? and(lt(comment.id, Number(cursor)), gte(comment.created_at, today))
            : gte(comment.created_at, today);
    } else if (filter === 'week') {
        whereClause = cursor
            ? and(lt(comment.id, Number(cursor)), gte(comment.created_at, sevenDaysAgo))
            : gte(comment.created_at, sevenDaysAgo);
    }

    const rows = await db
        .select({
            id: comment.id,
            post_id: comment.post_id,
            parent_id: comment.parent_id,
            author_name: comment.author_name,
            content: comment.content,
            is_secret: comment.is_secret,
            created_at: comment.created_at,
            post_title: post.title
        })
        .from(comment)
        .leftJoin(post, eq(comment.post_id, post.id))
        .where(whereClause as any)
        .orderBy(desc(comment.id))
        .limit(limit + 1);

    const items = rows.slice(0, limit).map((row) => ({
        id: row.id,
        postId: row.post_id,
        parentId: row.parent_id,
        authorName: row.author_name,
        content: row.is_secret ? '비밀 댓글입니다.' : row.content,
        isSecret: row.is_secret,
        createdAt: row.created_at,
        postTitle: row.post_title
    }));

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return json({ items, nextCursor });
};

export const DELETE: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const url = new URL(event.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return json({ message: 'id is required' }, { status: 400 });
    }

    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) {
        return json({ message: 'invalid id' }, { status: 400 });
    }

    await db.delete(comment).where(eq(comment.id, parsedId));

    return json({ success: true });
};