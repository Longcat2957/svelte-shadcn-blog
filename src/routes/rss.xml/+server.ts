import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/public';
import { defaultSiteConfig } from '$lib/config/site';

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ url }) => {
    const origin = url.origin;

    const siteName = env.PUBLIC_SITE_NAME || defaultSiteConfig.name;
    const siteDescription = env.PUBLIC_SITE_DESCRIPTION || defaultSiteConfig.description;

    const posts = await db.query.post.findMany({
        where: eq(post.published, true),
        columns: {
            id: true,
            title: true,
            description: true,
            tags: true,
            created_at: true,
            updated_at: true
        },
        orderBy: (p, { desc }) => desc(p.created_at),
        limit: 50
    });

    const items = posts
        .map((p) => {
            const postUrl = `${origin}/blog/${p.id}`;
            const pubDate = p.created_at.toUTCString();
            const description = p.description ? escapeXml(p.description) : '';
            return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      ${description ? `<description>${description}</description>` : ''}
      ${p.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
    </item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${origin}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ko</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'max-age=3600'
        }
    });
};
