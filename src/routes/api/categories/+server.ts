import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { category, post } from '$lib/server/db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
import {
    attachCategoryPostSummaries,
    buildCategoryTree,
    parseBool,
    parseOptionalInt,
    type CategoryRow,
    type PostPreview
} from '$lib/server/category-tree';

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

    const tree = buildCategoryTree(categoryRows as CategoryRow[]);
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

    return json({
        items: attachCategoryPostSummaries({
            tree,
            totalsByCategoryId,
            previewsByCategoryId
        })
    });
};
