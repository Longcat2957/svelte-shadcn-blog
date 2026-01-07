import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';

type CategoryRow = {
    id: number;
    name: string;
    parent_id: number | null;
    sort_order: number;
};

type PostPreview = {
    id: number;
    title: string;
};

export type CategoryTreeNode = {
    type: 'category';
    id: number;
    name: string;
    parentId: number | null;
    children: CategoryTreeNode[];
    postsPreview: PostPreview[];
    postsTotal: number;
};

function parseBool(v: string | null): boolean {
    if (!v) return false;
    return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
}

function parseOptionalInt(v: string | null): number | null {
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function buildTree(rows: CategoryRow[]): CategoryTreeNode[] {
    const map = new Map<number, CategoryTreeNode & { sortOrder: number }>();
    const roots: (CategoryTreeNode & { sortOrder: number })[] = [];

    for (const r of rows) {
        map.set(r.id, {
            type: 'category',
            id: r.id,
            name: r.name,
            parentId: r.parent_id,
            children: [],
            postsPreview: [],
            postsTotal: 0,
            sortOrder: r.sort_order
        });
    }

    for (const node of map.values()) {
        if (node.parentId !== null && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: (CategoryTreeNode & { sortOrder: number })[]) => {
        nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        for (const n of nodes) {
            sortNodes(n.children as any);
        }
    };
    sortNodes(roots);

    // 응답에서 내부 정렬키 제거
    const strip = (nodes: (CategoryTreeNode & { sortOrder: number })[]): CategoryTreeNode[] =>
        nodes.map(({ sortOrder: _sortOrder, ...rest }) => ({
            ...rest,
            children: strip(rest.children as any)
        }));

    return strip(roots);
}

export const GET: RequestHandler = async (event) => {
    // 공개 API: 카테고리 트리 반환 (선택적으로 카테고리별 글 프리뷰 포함)
    const includePosts = parseBool(event.url.searchParams.get('includePosts'));
    const postLimit = Math.min(
        Math.max(parseOptionalInt(event.url.searchParams.get('postLimit')) ?? 5, 1),
        20
    );

    const categoryRows = await db
        .select({
            id: category.id,
            name: category.name,
            parent_id: category.parent_id,
            sort_order: category.sort_order
        })
        .from(category);

    const tree = buildTree(categoryRows as CategoryRow[]);
    if (!includePosts) return json({ items: tree });

    // 카테고리별 published 글 개수
    const countRows = await db
        .select({
            categoryId: post.category_id,
            total: sql<number>`count(*)`
        })
        .from(post)
        .where(eq(post.published, true))
        .groupBy(post.category_id);
    const totalsByCategoryId = new Map<number, number>(
        countRows.map((r) => [r.categoryId, Number(r.total)])
    );

    // 카테고리별 최신 글 N개
    // 환경에 따라 window function + db.execute 반환 형태가 달라 500이 나올 수 있어,
    // 안정성을 위해 drizzle query로 가져온 뒤 서버에서 N개로 잘라준다.
    const latestPosts = await db
        .select({
            id: post.id,
            title: post.title,
            categoryId: post.category_id
        })
        .from(post)
        .where(eq(post.published, true))
        .orderBy(asc(post.category_id), desc(post.id));

    const previewsByCategoryId = new Map<number, PostPreview[]>();
    for (const p of latestPosts) {
        const list = previewsByCategoryId.get(p.categoryId) ?? [];
        if (list.length >= postLimit) continue;
        list.push({ id: p.id, title: p.title });
        previewsByCategoryId.set(p.categoryId, list);
    }

    const attach = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
        nodes.map((n) => ({
            ...n,
            postsTotal: totalsByCategoryId.get(n.id) ?? 0,
            postsPreview: previewsByCategoryId.get(n.id) ?? [],
            children: attach(n.children)
        }));

    return json({ items: attach(tree) });
};
