import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, assertSameOrigin, readJson } from '../_utils';
import { AUTH_COOKIE_NAME, signAuthToken } from '$lib/server/auth/jwt';

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

    const schema = z.object({
        username: z.string().min(1, 'Username is required'),
        avatar_url: z.string().nullable().optional()
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { username, avatar_url } = parsed.data;
    const userId = event.locals.user!.id;

    try {
        const [updated] = await db
            .update(user)
            .set({
                username,
                avatar_url: avatar_url || null
            })
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

    } catch (e: any) {
        if (e.code === '23505') {
            return json({ message: 'Username already taken' }, { status: 409 });
        }
        console.error(e);
        return json({ message: 'Internal server error' }, { status: 500 });
    }
};
