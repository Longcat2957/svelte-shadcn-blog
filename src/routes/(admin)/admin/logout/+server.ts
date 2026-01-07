import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE_NAME } from '$lib/server/auth/jwt';

export const POST: RequestHandler = async ({ cookies }) => {
    cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
    throw redirect(303, '/admin/login');
};
