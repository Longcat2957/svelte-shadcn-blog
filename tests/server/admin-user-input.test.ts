import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    isUniqueViolation,
    requiresCurrentPasswordForChange,
    userUpdateSchema
} from '../../src/lib/server/admin-user-input.ts';

describe('admin user input helpers', () => {
    it('normalizes profile update payloads', () => {
        const parsed = userUpdateSchema.parse({
            username: '  admin  ',
            avatar_url: ''
        });

        assert.equal(parsed.username, 'admin');
        assert.equal(parsed.avatar_url, null);
    });

    it('requires long enough new passwords', () => {
        const result = userUpdateSchema.safeParse({
            username: 'admin',
            newPassword: 'short'
        });

        assert.equal(result.success, false);
    });

    it('detects missing current password only for password changes', () => {
        assert.equal(requiresCurrentPasswordForChange({ newPassword: 'new-password' }), true);
        assert.equal(
            requiresCurrentPasswordForChange({
                currentPassword: 'old-password',
                newPassword: 'new-password'
            }),
            false
        );
        assert.equal(requiresCurrentPasswordForChange({ currentPassword: undefined }), false);
    });

    it('detects postgres unique violation errors', () => {
        assert.equal(isUniqueViolation({ code: '23505' }), true);
        assert.equal(isUniqueViolation({ code: '23503' }), false);
        assert.equal(isUniqueViolation(null), false);
    });
});
