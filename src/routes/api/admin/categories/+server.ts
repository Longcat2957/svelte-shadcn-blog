import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../_utils';

type CategoryNode = {
    id: number;
    name: string;
    parentId: number | null;
    children: CategoryNode[];
};

function buildTree(rows: { id: number; name: string; parent_id: number | null }[]): CategoryNode[] {
    const map = new Map<number, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const r of rows) {
        map.set(r.id, { id: r.id, name: r.name, parentId: r.parent_id, children: [] });
    }
    for (const node of map.values()) {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const rows = await db.select().from(category);
    return json({ items: buildTree(rows) });
};

export const POST: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson<{ name?: string; parentId?: number | null }>(event);
    if (body instanceof Response) return body;

    const name = (body.name ?? '').trim();
    const parentId = body.parentId ?? null;
    if (!name) return json({ message: 'name is required' }, { status: 400 });

    // parentId가 있을 때 존재 여부 간단 체크
    if (parentId !== null) {
        const parent = await db.query.category.findFirst({ where: eq(category.id, parentId) });
        if (!parent) return json({ message: 'parent category not found' }, { status: 404 });
    }

    const [created] = await db
        .insert(category)
        .values({ name, parent_id: parentId })
        .returning();

    return json(
        {
            item: {
                id: created.id,
                name: created.name,
                parentId: created.parent_id,
                children: []
            }
        },
        { status: 201 }
    );
};

