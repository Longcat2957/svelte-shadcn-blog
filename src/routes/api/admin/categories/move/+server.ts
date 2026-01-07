import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';

type Body = {
    id: number;
    parentId: number | null;
    beforeId?: number | null;
};

function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
}

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson<Body>(event);
    if (body instanceof Response) return body;

    if (!isFiniteNumber(body.id)) return json({ message: 'id is required' }, { status: 400 });
    const id = body.id;
    const parentId = body.parentId ?? null;
    const beforeId = body.beforeId ?? null;

    if (parentId === id) return json({ message: 'parentId cannot be self' }, { status: 400 });

    const moving = await db.query.category.findFirst({ where: eq(category.id, id) });
    if (!moving) return json({ message: 'category not found' }, { status: 404 });

    if (parentId !== null) {
        const parent = await db.query.category.findFirst({ where: eq(category.id, parentId) });
        if (!parent) return json({ message: 'parent category not found' }, { status: 404 });

        // 사이클 방지: parent가 moving의 자손이면 금지
        const rows = await db
            .select({ id: category.id, parentId: category.parent_id })
            .from(category);
        const parentById = new Map<number, number | null>(rows.map((r) => [r.id, r.parentId]));
        let cur: number | null = parentId;
        while (cur !== null) {
            if (cur === id)
                return json({ message: 'cannot move into descendant' }, { status: 400 });
            cur = parentById.get(cur) ?? null;
        }
    }

    if (beforeId !== null) {
        const target = await db.query.category.findFirst({ where: eq(category.id, beforeId) });
        if (!target) return json({ message: 'beforeId category not found' }, { status: 404 });
        const sameParent =
            (target.parent_id === null && parentId === null) ||
            (target.parent_id !== null && target.parent_id === parentId);
        if (!sameParent)
            return json(
                { message: 'beforeId must be within the destination parent' },
                { status: 400 }
            );
    }

    await db.transaction(async (tx) => {
        // destination parent의 정렬 기준점 계산
        let nextSort: number;
        if (beforeId === null) {
            const [{ maxSort }] = await tx
                .select({ maxSort: sql<number | null>`max(${category.sort_order})` })
                .from(category)
                .where(sql`${category.parent_id} is not distinct from ${parentId}`);
            nextSort = (maxSort ?? -1) + 1;
        } else {
            const before = await tx.query.category.findFirst({ where: eq(category.id, beforeId) });
            if (!before) throw new Error('beforeId not found');

            // before.sort_order 이상인 항목들을 +1 밀어내고, 그 자리에 삽입
            await tx.execute(sql`
                update category
                set sort_order = sort_order + 1
                where ${category.parent_id} is not distinct from ${parentId}
                and sort_order >= ${before.sort_order};
            `);
            nextSort = before.sort_order;
        }

        await tx
            .update(category)
            .set({ parent_id: parentId, sort_order: nextSort })
            .where(eq(category.id, id));
    });

    return new Response(null, { status: 204 });
};
