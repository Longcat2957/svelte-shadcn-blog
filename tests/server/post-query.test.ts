import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clampInt, parseOptionalInt, parsePostListQuery } from '../../src/lib/server/post-query.ts';

describe('post query helpers', () => {
    it('parses optional integers', () => {
        assert.equal(parseOptionalInt(null), null);
        assert.equal(parseOptionalInt('42'), 42);
        assert.equal(parseOptionalInt('abc'), null);
    });

    it('clamps integer ranges', () => {
        assert.equal(clampInt(-1, 1, 100), 1);
        assert.equal(clampInt(200, 1, 100), 100);
        assert.equal(clampInt(20, 1, 100), 20);
    });

    it('parses list query defaults and clamps limit/page', () => {
        const parsed = parsePostListQuery(
            new URLSearchParams({
                limit: '1000',
                page: '-5',
                categoryId: '7',
                tag: ' svelte ',
                q: ' search '
            })
        );

        assert.deepEqual(parsed, {
            limit: 100,
            page: 1,
            offset: 0,
            categoryId: 7,
            tag: 'svelte',
            q: 'search'
        });
    });

    it('uses stable defaults for empty search params', () => {
        assert.deepEqual(parsePostListQuery(new URLSearchParams()), {
            limit: 20,
            page: 1,
            offset: 0,
            categoryId: null,
            tag: '',
            q: ''
        });
    });
});
