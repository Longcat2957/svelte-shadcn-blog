import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function assertSameOrigin(event: RequestEvent) {
    const origin = event.request.headers.get('origin');
    const referer = event.request.headers.get('referer');

    if (origin) {
        const originHost = new URL(origin).host;
        if (originHost !== event.url.host) {
            return json({ message: 'Cross-origin request is not allowed.' }, { status: 403 });
        }
    } else if (referer) {
        const refererHost = new URL(referer).host;
        if (refererHost !== event.url.host) {
            return json({ message: 'Cross-origin request is not allowed.' }, { status: 403 });
        }
    }
    return null;
}

export async function readJson<T>(event: RequestEvent): Promise<T | Response> {
    try {
        return (await event.request.json()) as T;
    } catch {
        return json({ message: 'Invalid JSON body.' }, { status: 400 });
    }
}
