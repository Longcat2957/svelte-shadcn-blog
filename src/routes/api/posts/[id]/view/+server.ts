import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertSameOrigin } from '../../../_utils';
import { trackPublishedPostView } from '$lib/server/post-views';

function parseId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async (event) => {
    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const id = parseId(event.params.id);
    if (id === null) return json({ message: 'invalid id' }, { status: 400 });

    const result = await trackPublishedPostView({
        postId: id,
        cookies: event.cookies,
        clientAddress: event.getClientAddress(),
        referer: event.request.headers.get('referer') ?? '',
        origin: event.url.origin
    });

    if (!result) return json({ message: 'post not found' }, { status: 404 });
    return json(result);
};
