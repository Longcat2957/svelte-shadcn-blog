import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
    const origin = url.origin;

    const posts = await db.query.post.findMany({
        where: eq(post.published, true),
        columns: { id: true, created_at: true }
    });

    const staticRoutes = ['', '/about'];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
    .map(
        (route) => `  <url>
    <loc>${origin}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('\n')}
${posts
    .map(
        (p) => `  <url>
    <loc>${origin}/blog/${p.id}</loc>
    <lastmod>${p.created_at.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=3600'
        }
    });
};
