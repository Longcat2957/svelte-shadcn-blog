import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

    const [updated] = await db
        .update(category)
        .set(next)
        .where(eq(category.id, id))
        .returning();

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

    const [deleted] = await db.delete(category).where(eq(category.id, id)).returning({ id: category.id });
    if (!deleted) return json({ message: 'category not found' }, { status: 404 });
    return new Response(null, { status: 204 });
};

