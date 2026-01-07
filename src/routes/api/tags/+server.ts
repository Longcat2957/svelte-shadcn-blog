import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
    const rows = await db.select({ tags: post.tags }).from(post).where(eq(post.published, true));
    const set = new Set<string>();
    for (const r of rows) {
        for (const t of r.tags) set.add(t);
    }
    return json({ items: [...set].sort() });
};
