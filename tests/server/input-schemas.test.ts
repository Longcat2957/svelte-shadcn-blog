import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { i2iInputSchema, llmInputSchema, t2iInputSchema } from '../../src/lib/server/ai-input.ts';
import { postCreateSchema, postUpdateSchema } from '../../src/lib/server/post-input.ts';

describe('AI input schemas', () => {
    it('trims LLM prompts and applies a non-streaming default', () => {
        const parsed = llmInputSchema.parse({
            userPrompt: '  summarize this  ',
            temperature: 0.2
        });

        assert.equal(parsed.userPrompt, 'summarize this');
        assert.equal(parsed.stream, false);
    });

    it('rejects empty text-to-image prompts', () => {
        const result = t2iInputSchema.safeParse({ prompt: '   ' });

        assert.equal(result.success, false);
    });

    it('limits image-to-image requests to four source images', () => {
        const result = i2iInputSchema.safeParse({
            prompt: 'make a variant',
            image_urls: [
                'https://example.com/1.png',
                'https://example.com/2.png',
                'https://example.com/3.png',
                'https://example.com/4.png',
                'https://example.com/5.png'
            ]
        });

        assert.equal(result.success, false);
    });
});

describe('post input schemas', () => {
    it('normalizes create payload text fields and tags', () => {
        const parsed = postCreateSchema.parse({
            title: '  Hello  ',
            description: '   ',
            content: 'body',
            categoryId: 1,
            tags: [' svelte ', 'svelte', '', 'kit'],
            thumbnailUrl: ''
        });

        assert.equal(parsed.title, 'Hello');
        assert.equal(parsed.description, null);
        assert.deepEqual(parsed.tags, ['svelte', 'kit']);
        assert.equal(parsed.thumbnailUrl, null);
        assert.equal(parsed.published, false);
    });

    it('rejects updates with no fields', () => {
        const result = postUpdateSchema.safeParse({});

        assert.equal(result.success, false);
    });

    it('keeps omitted update fields undefined while normalizing blank nullable fields', () => {
        const parsed = postUpdateSchema.parse({
            description: '',
            published: true
        });

        assert.equal(parsed.description, null);
        assert.equal(parsed.title, undefined);
        assert.equal(parsed.published, true);
    });
});
