import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '$lib/server/auth/jwt';

const ADMIN_LOGIN_PATH = '/admin/login';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get(AUTH_COOKIE_NAME);
    event.locals.user = token ? await verifyAuthToken(token) : null;

    const pathname = event.url.pathname;
    const isAdminArea = pathname.startsWith('/admin');
    const isLoginPage = pathname === ADMIN_LOGIN_PATH;

    if (isAdminArea && !isLoginPage && !event.locals.user) {
        throw redirect(303, ADMIN_LOGIN_PATH);
    }

    return resolve(event);
};

