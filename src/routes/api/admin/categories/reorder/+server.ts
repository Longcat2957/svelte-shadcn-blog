import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';

type Body = {
    parentId: number | null;
    orderedIds: number[];
};

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson<Body>(event);
    if (body instanceof Response) return body;

    const parentId = body.parentId ?? null;
    const orderedIds = Array.from(new Set(body.orderedIds ?? [])).filter((n) => Number.isFinite(n));
    if (orderedIds.length === 0)
        return json({ message: 'orderedIds is required' }, { status: 400 });

    // 입력된 orderedIds가 모두 같은 parent에 속하는지 검증
    const rows = await db
        .select({ id: category.id, parentId: category.parent_id })
        .from(category)
        .where(inArray(category.id, orderedIds));

    if (rows.length !== orderedIds.length) {
        return json({ message: 'some categories not found' }, { status: 404 });
    }
    for (const r of rows) {
        const sameParent = (r.parentId === null && parentId === null) || r.parentId === parentId;
        if (!sameParent)
            return json(
                { message: 'all categories must share the same parentId' },
                { status: 400 }
            );
    }

    await db.transaction(async (tx) => {
        for (let idx = 0; idx < orderedIds.length; idx++) {
            const id = orderedIds[idx]!;
            await tx.update(category).set({ sort_order: idx }).where(eq(category.id, id));
        }
    });

    return new Response(null, { status: 204 });
};
