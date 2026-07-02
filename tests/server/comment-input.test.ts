import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    commentInputSchema,
    parseId,
    requiresSecretPassword
} from '../../src/lib/server/comment-input.ts';

describe('comment input helpers', () => {
    it('normalizes comment input and applies defaults', () => {
        const parsed = commentInputSchema.parse({
            authorName: '  Min  ',
            content: '  hello  ',
            parentId: null
        });

        assert.equal(parsed.authorName, 'Min');
        assert.equal(parsed.content, 'hello');
        assert.equal(parsed.parentId, null);
        assert.equal(parsed.password, '');
        assert.equal(parsed.isSecret, false);
    });

    it('rejects empty author names and content after trimming', () => {
        assert.equal(
            commentInputSchema.safeParse({
                authorName: ' ',
                content: 'hello'
            }).success,
            false
        );
        assert.equal(
            commentInputSchema.safeParse({
                authorName: 'Min',
                content: ' '
            }).success,
            false
        );
    });

    it('accepts only positive integer parent ids when provided', () => {
        assert.equal(
            commentInputSchema.safeParse({
                authorName: 'Min',
                content: 'hello',
                parentId: 1
            }).success,
            true
        );
        assert.equal(
            commentInputSchema.safeParse({
                authorName: 'Min',
                content: 'hello',
                parentId: 0
            }).success,
            false
        );
    });

    it('detects secret comments without a usable password', () => {
        const parsed = commentInputSchema.parse({
            authorName: 'Min',
            content: 'hidden',
            isSecret: true,
            password: '   '
        });

        assert.equal(parsed.password, '');
        assert.equal(requiresSecretPassword(parsed), true);
        assert.equal(requiresSecretPassword({ isSecret: true, password: 'secret' }), false);
        assert.equal(requiresSecretPassword({ isSecret: false, password: '' }), false);
    });

    it('parses route ids using the existing finite-number semantics', () => {
        assert.equal(parseId('123'), 123);
        assert.equal(parseId('0'), 0);
        assert.equal(parseId('-1'), -1);
        assert.equal(parseId('abc'), null);
    });
});
