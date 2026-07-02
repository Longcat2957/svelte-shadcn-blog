import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hashPassword, verifyPassword } from '../../src/lib/server/auth/password.ts';

describe('password hashing', () => {
    it('verifies the original password and rejects a different password', async () => {
        const hash = await hashPassword('correct horse battery staple');

        assert.match(hash, /^scrypt\$/);
        assert.equal(await verifyPassword('correct horse battery staple', hash), true);
        assert.equal(await verifyPassword('wrong password', hash), false);
    });

    it('rejects malformed hashes', async () => {
        assert.equal(await verifyPassword('password', 'not-a-valid-hash'), false);
        assert.equal(await verifyPassword('password', 'bcrypt$salt$hash'), false);
    });
});
