import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SignJWT } from 'jose';

import {
    AUTH_COOKIE_NAME,
    JWT_ISSUER,
    signAuthTokenWithSecret,
    verifyAuthTokenWithSecret
} from '../../src/lib/server/auth/jwt-core.ts';
const secret = new TextEncoder().encode('test-secret-at-least-long-enough');
const otherSecret = new TextEncoder().encode('different-test-secret');

describe('JWT auth helpers', () => {
    it('uses a stable auth cookie name', () => {
        assert.equal(AUTH_COOKIE_NAME, 'auth_token');
    });

    it('round-trips signed auth tokens', async () => {
        const token = await signAuthTokenWithSecret({ id: 12, username: 'admin' }, secret);

        assert.deepEqual(await verifyAuthTokenWithSecret(token, secret), {
            id: 12,
            username: 'admin'
        });
    });

    it('rejects malformed or incorrectly signed tokens', async () => {
        const token = await signAuthTokenWithSecret({ id: 1, username: 'admin' }, secret);

        assert.equal(await verifyAuthTokenWithSecret('not-a-token', secret), null);
        assert.equal(await verifyAuthTokenWithSecret(token, otherSecret), null);
    });

    it('rejects tokens with invalid auth payloads', async () => {
        const missingUsername = await new SignJWT({})
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer(JWT_ISSUER)
            .setSubject('1')
            .setExpirationTime('1h')
            .sign(secret);

        const invalidId = await new SignJWT({ username: 'admin' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer(JWT_ISSUER)
            .setSubject('0')
            .setExpirationTime('1h')
            .sign(secret);

        assert.equal(await verifyAuthTokenWithSecret(missingUsername, secret), null);
        assert.equal(await verifyAuthTokenWithSecret(invalidId, secret), null);
    });
});
