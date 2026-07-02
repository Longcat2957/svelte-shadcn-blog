import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, assertSameOrigin, readJson } from '../_utils';
import { AUTH_COOKIE_NAME, signAuthToken } from '$lib/server/auth/jwt';
import { verifyPassword, hashPassword } from '$lib/server/auth/password';
import {
    isUniqueViolation,
    requiresCurrentPasswordForChange,
    userUpdateSchema
} from '$lib/server/admin-user-input';

export const GET: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const userId = event.locals.user!.id;

    const userData = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: {
            username: true,
            avatar_url: true
        }
    });

    if (!userData) {
        return json({ message: 'User not found' }, { status: 404 });
    }

    return json({ user: userData });
};

export const PATCH: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const origin = assertSameOrigin(event);
    if (origin) return origin;

    const body = await readJson(event);
    if (body instanceof Response) return body;

    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { message: parsed.error.issues[0]?.message ?? 'Invalid user body.' },
            { status: 400 }
        );
    }

    const { username, avatar_url, currentPassword, newPassword } = parsed.data;
    const userId = event.locals.user!.id;

    // 비밀번호 변경 요청 시 현재 비밀번호 검증
    if (newPassword) {
        if (requiresCurrentPasswordForChange({ currentPassword, newPassword })) {
            return json(
                { message: 'Current password is required to change password' },
                { status: 400 }
            );
        }

        const userData = await db.query.user.findFirst({
            where: eq(user.id, userId),
            columns: { password: true }
        });

        if (!userData || !(await verifyPassword(currentPassword ?? '', userData.password))) {
            return json({ message: 'Current password is incorrect' }, { status: 400 });
        }
    }

    try {
        const updateData: { username: string; avatar_url: string | null; password?: string } = {
            username,
            avatar_url
        };

        if (newPassword) {
            updateData.password = await hashPassword(newPassword);
        }

        const [updated] = await db
            .update(user)
            .set(updateData)
            .where(eq(user.id, userId))
            .returning();

        // If username changed, update cookie
        if (username !== event.locals.user!.username) {
            const token = await signAuthToken({ id: updated.id, username: updated.username });
            event.cookies.set(AUTH_COOKIE_NAME, token, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7
            });
        }

        return json({ user: { username: updated.username, avatar_url: updated.avatar_url } });
    } catch (e: unknown) {
        if (isUniqueViolation(e)) {
            return json({ message: 'Username already taken' }, { status: 409 });
        }
        console.error(e);
        return json({ message: 'Internal server error' }, { status: 500 });
    }
};
