import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    extensionFromMime,
    isBlockedHostname,
    isBlockedIp,
    isRedirectResponse,
    MAX_IMAGE_BYTES,
    readLimitedResponseBody,
    UploadInputError,
    validateImageFile
} from '../../src/lib/server/image-upload-input.ts';

describe('image upload input helpers', () => {
    it('accepts image files within the size limit', () => {
        const file = new File(['image'], 'image.png', { type: 'image/png' });

        assert.doesNotThrow(() => validateImageFile(file));
    });

    it('rejects non-image files and oversized files', () => {
        const textFile = new File(['text'], 'note.txt', { type: 'text/plain' });
        const oversized = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'image.png', {
            type: 'image/png'
        });

        assert.throws(() => validateImageFile(textFile), UploadInputError);
        assert.throws(() => validateImageFile(oversized), UploadInputError);
    });

    it('maps common image MIME types to extensions', () => {
        assert.equal(extensionFromMime('image/png'), 'png');
        assert.equal(extensionFromMime('image/webp'), 'webp');
        assert.equal(extensionFromMime('image/gif'), 'gif');
        assert.equal(extensionFromMime('image/svg+xml'), 'svg');
        assert.equal(extensionFromMime('image/jpeg'), 'jpg');
    });

    it('identifies redirect status codes', () => {
        assert.equal(isRedirectResponse(299), false);
        assert.equal(isRedirectResponse(300), true);
        assert.equal(isRedirectResponse(399), true);
        assert.equal(isRedirectResponse(400), false);
    });

    it('blocks local and private hostnames or IP ranges', () => {
        assert.equal(isBlockedHostname('localhost'), true);
        assert.equal(isBlockedHostname('app.localhost.'), true);
        assert.equal(isBlockedHostname('example.com'), false);
        assert.equal(isBlockedIp('127.0.0.1'), true);
        assert.equal(isBlockedIp('10.0.0.1'), true);
        assert.equal(isBlockedIp('172.16.0.1'), true);
        assert.equal(isBlockedIp('192.168.1.1'), true);
        assert.equal(isBlockedIp('::1'), true);
        assert.equal(isBlockedIp('::ffff:127.0.0.1'), true);
        assert.equal(isBlockedIp('8.8.8.8'), false);
    });

    it('reads response bodies within the configured limit', async () => {
        const chunks = await readLimitedResponseBody(new Response('abc'));
        const merged = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

        assert.equal(merged.toString('utf8'), 'abc');
    });
});
