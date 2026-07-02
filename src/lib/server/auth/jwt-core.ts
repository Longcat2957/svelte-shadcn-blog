import { SignJWT, jwtVerify } from 'jose';

export type AuthUser = {
    id: number;
    username: string;
};

export const AUTH_COOKIE_NAME = 'auth_token';
export const JWT_ISSUER = 'svelte-shadcn-blog';

export function getJwtSecretFromString(secret: string | undefined): Uint8Array {
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }
    return new TextEncoder().encode(secret);
}

export async function signAuthTokenWithSecret(user: AuthUser, secret: Uint8Array): Promise<string> {
    return new SignJWT({ username: user.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(JWT_ISSUER)
        .setSubject(String(user.id))
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyAuthTokenWithSecret(
    token: string,
    secret: Uint8Array
): Promise<AuthUser | null> {
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
