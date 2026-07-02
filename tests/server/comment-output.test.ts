import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    maskSecretCommentsForViewer,
    SECRET_COMMENT_PLACEHOLDER
} from '../../src/lib/server/comment-output.ts';

describe('comment output helpers', () => {
    const comments = [
        { id: 1, content: 'public', is_secret: false },
        { id: 2, content: 'hidden', is_secret: true }
    ];

    it('keeps all comment content visible for admins', () => {
        assert.deepEqual(maskSecretCommentsForViewer({ items: comments, isAdmin: true }), comments);
    });

    it('masks secret comment content for public viewers', () => {
        const masked = maskSecretCommentsForViewer({ items: comments, isAdmin: false });

        assert.equal(masked[0].content, 'public');
        assert.equal(masked[1].content, SECRET_COMMENT_PLACEHOLDER);
        assert.equal(masked[1].id, 2);
    });
});
