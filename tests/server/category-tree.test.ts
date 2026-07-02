import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    attachCategoryPostSummaries,
    buildCategoryTree,
    parseBool,
    parseOptionalInt
} from '../../src/lib/server/category-tree.ts';

describe('category tree helpers', () => {
    it('parses boolean query flags', () => {
        assert.equal(parseBool(null), false);
        assert.equal(parseBool(''), false);
        assert.equal(parseBool('1'), true);
        assert.equal(parseBool('true'), true);
        assert.equal(parseBool('yes'), true);
        assert.equal(parseBool('false'), false);
    });

    it('parses optional integers without clamping', () => {
        assert.equal(parseOptionalInt(null), null);
        assert.equal(parseOptionalInt('10'), 10);
        assert.equal(parseOptionalInt('0'), 0);
        assert.equal(parseOptionalInt('abc'), null);
    });

    it('builds a sorted nested tree and treats missing parents as roots', () => {
        const tree = buildCategoryTree([
            { id: 3, name: 'Child B', parent_id: 1, sort_order: 2 },
            { id: 2, name: 'Child A', parent_id: 1, sort_order: 1 },
            { id: 1, name: 'Root B', parent_id: null, sort_order: 2 },
            { id: 4, name: 'Root A', parent_id: null, sort_order: 1 },
            { id: 5, name: 'Missing Parent', parent_id: 999, sort_order: 3 }
        ]);

        assert.deepEqual(
            tree.map((node) => node.name),
            ['Root A', 'Root B', 'Missing Parent']
        );
        assert.deepEqual(
            tree[1].children.map((node) => node.name),
            ['Child A', 'Child B']
        );
        assert.equal('sortOrder' in tree[0], false);
    });

    it('attaches post totals and previews recursively', () => {
        const tree = buildCategoryTree([
            { id: 1, name: 'Root', parent_id: null, sort_order: 1 },
            { id: 2, name: 'Child', parent_id: 1, sort_order: 1 }
        ]);

        const withPosts = attachCategoryPostSummaries({
            tree,
            totalsByCategoryId: new Map([
                [1, 3],
                [2, 1]
            ]),
            previewsByCategoryId: new Map([
                [1, [{ id: 10, title: 'Root post' }]],
                [2, [{ id: 20, title: 'Child post' }]]
            ])
        });

        assert.equal(withPosts[0].postsTotal, 3);
        assert.deepEqual(withPosts[0].postsPreview, [{ id: 10, title: 'Root post' }]);
        assert.equal(withPosts[0].children[0].postsTotal, 1);
        assert.deepEqual(withPosts[0].children[0].postsPreview, [{ id: 20, title: 'Child post' }]);
    });
});
