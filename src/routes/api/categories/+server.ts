import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';

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

export const GET: RequestHandler = async () => {
    // 공개 API: 전체 카테고리 트리 반환
    const rows = await db.select().from(category);
    return json({ items: buildTree(rows) });
};
