import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { desc, lt, gte, eq, and, type SQL } from 'drizzle-orm';
import { assertSameOrigin, requireAdmin } from '../_utils';

const DEFAULT_LIMIT = 20;

function parsePositiveInt(value: string | null): number | null {
    if (value === null) return null;
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const limit = Math.min(
        parsePositiveInt(event.url.searchParams.get('limit')) ?? DEFAULT_LIMIT,
        100
    );
    const cursor = parsePositiveInt(event.url.searchParams.get('cursor'));
    const cursorParam = event.url.searchParams.get('cursor');
    const filter = event.url.searchParams.get('filter') ?? 'all';

    if (cursorParam !== null && cursor === null) {
        return json({ message: 'invalid cursor' }, { status: 400 });
    }
    if (!['all', 'today', 'week'].includes(filter)) {
        return json({ message: 'invalid filter' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let whereClause: SQL | undefined = cursor ? lt(comment.id, cursor) : undefined;

    if (filter === 'today') {
        whereClause = cursor
            ? and(lt(comment.id, cursor), gte(comment.created_at, today))
            : gte(comment.created_at, today);
    } else if (filter === 'week') {
        whereClause = cursor
            ? and(lt(comment.id, cursor), gte(comment.created_at, sevenDaysAgo))
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
        .where(whereClause)
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

    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = event.url.searchParams.get('id');

    if (!id) {
        return json({ message: 'id is required' }, { status: 400 });
    }

    const parsedId = parsePositiveInt(id);
    if (parsedId === null) {
        return json({ message: 'invalid id' }, { status: 400 });
    }

    const [deleted] = await db
        .delete(comment)
        .where(eq(comment.id, parsedId))
        .returning({ id: comment.id });
    if (!deleted) return json({ message: 'comment not found' }, { status: 404 });

    return json({ success: true });
};
