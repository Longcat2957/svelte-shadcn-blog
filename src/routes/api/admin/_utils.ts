import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export { assertSameOrigin, readJson } from '../_utils';

export function requireAdmin(event: RequestEvent) {
    if (!event.locals.user) {
        return json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }
    return null;
}
