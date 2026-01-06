import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireAdmin(event: RequestEvent) {
    if (!event.locals.user) {
        return json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }
    return null;
}

export function assertSameOrigin(event: RequestEvent) {
    const origin = event.request.headers.get('origin');
    const referer = event.request.headers.get('referer');

    // 브라우저/환경에 따라 same-origin 요청에 origin이 없을 수 있으므로
    // origin이 있으면 origin을, 없으면 referer를 사용해 host를 비교한다.
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
