import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { signAuthToken, AUTH_COOKIE_NAME } from '$lib/server/auth/jwt';
import { verifyPassword } from '$lib/server/auth/password';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        throw redirect(303, '/admin');
    }
    return {};
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const formData = await request.formData();
        const username = String(formData.get('username') ?? '').trim();
        const password = String(formData.get('password') ?? '');

        if (!username || !password) {
            return fail(400, { message: '아이디와 비밀번호를 입력해주세요.' });
        }

        const found = await db.query.user.findFirst({
            where: eq(user.username, username)
        });

        if (!found) {
            return fail(401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const ok = await verifyPassword(password, found.password);
        if (!ok) {
            return fail(401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const token = await signAuthToken({ id: found.id, username: found.username });

        cookies.set(AUTH_COOKIE_NAME, token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
        });

        throw redirect(303, '/admin');
    }
};
