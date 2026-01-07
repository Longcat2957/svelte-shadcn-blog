import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const body = await readJson<{ name?: string; parentId?: number | null }>(event);
    if (body instanceof Response) return body;

    const next: { name?: string; parent_id?: number | null } = {};
    if (body.name !== undefined) {
        const name = body.name.trim();
        if (!name) return json({ message: 'name cannot be empty' }, { status: 400 });
        next.name = name;
    }
    if (body.parentId !== undefined) {
        const parentId = body.parentId;
        if (parentId === id) return json({ message: 'parentId cannot be self' }, { status: 400 });
        if (parentId !== null) {
            const parent = await db.query.category.findFirst({ where: eq(category.id, parentId) });
            if (!parent) return json({ message: 'parent category not found' }, { status: 404 });
        }
        next.parent_id = parentId;
    }

    const [updated] = await db.update(category).set(next).where(eq(category.id, id)).returning();

    if (!updated) return json({ message: 'category not found' }, { status: 404 });

    return json({
        item: {
            id: updated.id,
            name: updated.name,
            parentId: updated.parent_id
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

    try {
        // 삭제 대상(해당 카테고리 + 모든 자손 카테고리)을 구해서,
        // 그 중 하나라도 post와 연결되어 있으면 삭제를 명시적으로 차단한다.
        const rows = await db
            .select({ id: category.id, parentId: category.parent_id })
            .from(category);
        const childrenByParent = new Map<number, number[]>();
        for (const r of rows) {
            if (r.parentId === null) continue;
            const list = childrenByParent.get(r.parentId) ?? [];
            list.push(r.id);
            childrenByParent.set(r.parentId, list);
        }

        const toCheck: number[] = [];
        const seen = new Set<number>();
        const queue: number[] = [id];
        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (seen.has(cur)) continue;
            seen.add(cur);
            toCheck.push(cur);
            const children = childrenByParent.get(cur) ?? [];
            for (const childId of children) queue.push(childId);
        }

        const foundPost = await db.query.post.findFirst({
            columns: { id: true },
            where: inArray(post.category_id, toCheck)
        });

        if (foundPost) {
            return json(
                {
                    code: 'CATEGORY_IN_USE',
                    message: '포스트가 연결된 카테고리는 삭제할 수 없습니다.'
                },
                { status: 409 }
            );
        }

        const [deleted] = await db
            .delete(category)
            .where(eq(category.id, id))
            .returning({ id: category.id });
        if (!deleted) return json({ message: 'category not found' }, { status: 404 });
        return new Response(null, { status: 204 });
    } catch {
        return json({ message: '카테고리 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
};
