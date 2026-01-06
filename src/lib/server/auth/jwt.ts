import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

export type AuthUser = {
    id: number;
    username: string;
};

export const AUTH_COOKIE_NAME = 'auth_token';

const JWT_ISSUER = 'svelte-shadcn-blog';

function getJwtSecret(): Uint8Array {
    if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }
    return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signAuthToken(user: AuthUser): Promise<string> {
    const secret = getJwtSecret();

    return new SignJWT({ username: user.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(JWT_ISSUER)
        .setSubject(String(user.id))
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
    const secret = getJwtSecret();
    try {
        const { payload } = await jwtVerify(token, secret, {
            issuer: JWT_ISSUER
        });

        const id = Number(payload.sub);
        const username = typeof payload.username === 'string' ? payload.username : null;

        if (!Number.isFinite(id) || id <= 0 || !username) return null;

        return { id, username };
    } catch {
        return null;
    }
}
