import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { assertSameOrigin, readJson, requireAdmin } from '../_utils';

type CategoryNode = {
    id: number;
    name: string;
    parentId: number | null;
    sortOrder: number;
    postsTotal?: number;
    children: CategoryNode[];
};

function buildTree(
    rows: {
        id: number;
        name: string;
        parent_id: number | null;
        sort_order: number;
        postsTotal?: number;
    }[]
): CategoryNode[] {
    const map = new Map<number, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const r of rows) {
        map.set(r.id, {
            id: r.id,
            name: r.name,
            parentId: r.parent_id,
            sortOrder: r.sort_order,
            postsTotal: r.postsTotal,
            children: []
        });
    }
    for (const node of map.values()) {
        if (node.parentId !== null && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: CategoryNode[]) => {
        nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(roots);

    return roots;
}

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const includeCounts =
        (event.url.searchParams.get('includeCounts') ?? '').toLowerCase() === 'true';

    if (!includeCounts) {
        const rows = await db
            .select({
                id: category.id,
                name: category.name,
                parent_id: category.parent_id,
                sort_order: category.sort_order
            })
            .from(category);
        return json({ items: buildTree(rows) });
    }

    // 카테고리별 전체 글 개수(관리자 기준: published 상관 없이)
    const rows = await db.execute(sql`
        select c.id,
            c.name,
            c.parent_id,
            c.sort_order,
            coalesce(p.total, 0) as "postsTotal"
        from category c
        left join (
            select category_id, count(*)::int as total
            from post
            group by category_id
        ) p on p.category_id = c.id;
    `);

    const items = (rows as unknown as { rows: any[] }).rows as {
        id: number;
        name: string;
        parent_id: number | null;
        sort_order: number;
        postsTotal: number;
    }[];

    return json({ items: buildTree(items) });
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

    // 새로 만드는 카테고리는 같은 parent 내 맨 뒤에 붙인다.
    const [{ maxSort }] = await db
        .select({ maxSort: sql<number | null>`max(${category.sort_order})` })
        .from(category)
        .where(sql`${category.parent_id} is not distinct from ${parentId}`);
    const nextSort = (maxSort ?? -1) + 1;

    const [created] = await db
        .insert(category)
        .values({ name, parent_id: parentId, sort_order: nextSort })
        .returning();

    return json(
        {
            item: {
                id: created.id,
                name: created.name,
                parentId: created.parent_id,
                sortOrder: created.sort_order,
                children: []
            }
        },
        { status: 201 }
    );
};
