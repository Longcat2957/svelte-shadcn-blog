import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../../_utils';
import { categoryReorderSchema, sameCategoryParent } from '$lib/server/admin-category-input';

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson(event);
    if (body instanceof Response) return body;

    const parsed = categoryReorderSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid reorder body.' },
            { status: 400 }
        );
    }

    const { parentId, orderedIds } = parsed.data;

    // 입력된 orderedIds가 모두 같은 parent에 속하는지 검증
    const rows = await db
        .select({ id: category.id, parentId: category.parent_id })
        .from(category)
        .where(inArray(category.id, orderedIds));

    if (rows.length !== orderedIds.length) {
        return json({ message: 'some categories not found' }, { status: 404 });
    }
    for (const r of rows) {
        if (!sameCategoryParent(r.parentId, parentId))
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
