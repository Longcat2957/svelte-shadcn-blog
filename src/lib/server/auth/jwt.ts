import { env } from '$env/dynamic/private';
import {
    AUTH_COOKIE_NAME,
    getJwtSecretFromString,
    signAuthTokenWithSecret,
    verifyAuthTokenWithSecret,
    type AuthUser
} from './jwt-core.js';

export {
    AUTH_COOKIE_NAME,
    getJwtSecretFromString,
    signAuthTokenWithSecret,
    verifyAuthTokenWithSecret,
    type AuthUser
};

function getJwtSecret(): Uint8Array {
    return getJwtSecretFromString(env.JWT_SECRET);
}

export async function signAuthToken(user: AuthUser): Promise<string> {
    return await signAuthTokenWithSecret(user, getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
    return await verifyAuthTokenWithSecret(token, getJwtSecret());
}
