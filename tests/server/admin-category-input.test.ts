import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    categoryCreateSchema,
    categoryMoveSchema,
    categoryReorderSchema,
    categoryUpdateSchema,
    hasAncestorCycle,
    isSelfParent,
    parseAdminCategoryId,
    sameCategoryParent
} from '../../src/lib/server/admin-category-input.ts';

describe('admin category input helpers', () => {
    it('normalizes create payloads', () => {
        const parsed = categoryCreateSchema.parse({ name: '  Frontend  ' });

        assert.equal(parsed.name, 'Frontend');
        assert.equal(parsed.parentId, null);
    });

    it('rejects empty update payloads', () => {
        const result = categoryUpdateSchema.safeParse({});

        assert.equal(result.success, false);
    });

    it('normalizes move and reorder payload defaults', () => {
        assert.deepEqual(categoryMoveSchema.parse({ id: 10 }), {
            id: 10,
            parentId: null,
            beforeId: null
        });
        assert.deepEqual(categoryReorderSchema.parse({ orderedIds: [3, 1] }), {
            parentId: null,
            orderedIds: [3, 1]
        });
    });

    it('rejects duplicate reorder ids', () => {
        const result = categoryReorderSchema.safeParse({ orderedIds: [1, 1] });

        assert.equal(result.success, false);
    });

    it('detects self-parent and descendant cycles', () => {
        const parentById = new Map<number, number | null>([
            [1, null],
            [2, 1],
            [3, 2]
        ]);

        assert.equal(isSelfParent(2, 2), true);
        assert.equal(isSelfParent(2, null), false);
        assert.equal(hasAncestorCycle({ id: 1, parentId: 3, parentById }), true);
        assert.equal(hasAncestorCycle({ id: 3, parentId: 1, parentById }), false);
    });

    it('preserves existing finite-number route id semantics', () => {
        assert.equal(parseAdminCategoryId('12'), 12);
        assert.equal(parseAdminCategoryId('0'), 0);
        assert.equal(parseAdminCategoryId('abc'), null);
    });

    it('compares category parent ids', () => {
        assert.equal(sameCategoryParent(null, null), true);
        assert.equal(sameCategoryParent(1, 1), true);
        assert.equal(sameCategoryParent(null, 1), false);
        assert.equal(sameCategoryParent(2, 1), false);
    });
});
