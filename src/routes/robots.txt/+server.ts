import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => {
    const body = `User-agent: *
Disallow:

Sitemap: ${url.origin}/sitemap.xml
`;

    return new Response(body, {
        headers: { 'Content-Type': 'text/plain' }
    });
};
