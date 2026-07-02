import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { RequestEvent } from '@sveltejs/kit';

import { assertSameOrigin, readJson } from '../../src/routes/api/_utils.ts';

function makeEvent({
    url = 'https://blog.test/api/example',
    headers,
    body
}: {
    url?: string;
    headers?: HeadersInit;
    body?: BodyInit;
} = {}): RequestEvent {
    return {
        request: new Request(url, {
            method: body === undefined ? 'GET' : 'POST',
            headers,
            body
        }),
        url: new URL(url),
        locals: {}
    } as RequestEvent;
}

describe('assertSameOrigin', () => {
    it('allows requests with a matching origin', () => {
        const result = assertSameOrigin(
            makeEvent({
                headers: { origin: 'https://blog.test' }
            })
        );

        assert.equal(result, null);
    });

    it('blocks cross-origin requests', async () => {
        const result = assertSameOrigin(
            makeEvent({
                headers: { origin: 'https://evil.test' }
            })
        );

        assert.ok(result instanceof Response);
        assert.equal(result.status, 403);
        assert.deepEqual(await result.json(), {
            message: 'Cross-origin request is not allowed.'
        });
    });

    it('falls back to referer when origin is absent', () => {
        const result = assertSameOrigin(
            makeEvent({
                headers: { referer: 'https://blog.test/posts/1' }
            })
        );

        assert.equal(result, null);
    });

    it('rejects malformed origin headers', async () => {
        const result = assertSameOrigin(
            makeEvent({
                headers: { origin: 'not a url' }
            })
        );

        assert.ok(result instanceof Response);
        assert.equal(result.status, 403);
        assert.deepEqual(await result.json(), {
            message: 'Invalid request origin.'
        });
    });
});

describe('readJson', () => {
    it('returns parsed JSON bodies', async () => {
        const payload = await readJson(
            makeEvent({
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ ok: true })
            })
        );

        assert.deepEqual(payload, { ok: true });
    });

    it('returns a 400 response for invalid JSON', async () => {
        const result = await readJson(
            makeEvent({
                headers: { 'content-type': 'application/json' },
                body: '{'
            })
        );

        assert.ok(result instanceof Response);
        assert.equal(result.status, 400);
        assert.deepEqual(await result.json(), { message: 'Invalid JSON body.' });
    });
});
