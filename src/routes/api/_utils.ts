import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function assertSameOrigin(event: RequestEvent) {
    const origin = event.request.headers.get('origin');
    const referer = event.request.headers.get('referer');

    try {
        if (origin) {
            const requestOrigin = new URL(origin).origin;
            if (requestOrigin !== event.url.origin) {
                return json({ message: 'Cross-origin request is not allowed.' }, { status: 403 });
            }
        } else if (referer) {
            const refererOrigin = new URL(referer).origin;
            if (refererOrigin !== event.url.origin) {
                return json({ message: 'Cross-origin request is not allowed.' }, { status: 403 });
            }
        }
    } catch {
        return json({ message: 'Invalid request origin.' }, { status: 403 });
    }

    return null;
}

export async function readJson(event: RequestEvent): Promise<unknown | Response> {
    try {
        return await event.request.json();
    } catch {
        return json({ message: 'Invalid JSON body.' }, { status: 400 });
    }
}
