import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
    // 모든 포스트(발행 여부 관계없이)에서 태그 수집
    const rows = await db.select({ tags: post.tags }).from(post);

    // 태그별 사용 횟수 계산
    const tagCount = new Map<string, number>();
    for (const r of rows) {
        for (const t of r.tags) {
            tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
        }
    }

    // 사용 빈도 내림차순 → 알파벳 오름차순 정렬
    const items = [...tagCount.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });

    return json({ items });
};
