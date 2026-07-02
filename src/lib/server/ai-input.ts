import { z } from 'zod';

const aspectRatioSchema = z.enum([
    'auto',
    '21:9',
    '16:9',
    '3:2',
    '4:3',
    '5:4',
    '1:1',
    '4:5',
    '3:4',
    '2:3',
    '9:16'
]);

const imageOutputSchema = {
    num_images: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    aspect_ratio: aspectRatioSchema.optional(),
    output_format: z.enum(['jpeg', 'png', 'webp']).optional(),
    safety_tolerance: z.enum(['1', '2', '3', '4', '5', '6']).optional(),
    sync_mode: z.boolean().optional(),
    resolution: z.enum(['0.5K', '1K', '2K', '4K']).optional(),
    limit_generations: z.boolean().optional(),
    enable_web_search: z.boolean().optional()
};

export const llmInputSchema = z.object({
    systemPrompt: z.string().trim().max(8000, 'systemPrompt is too long').optional(),
    userPrompt: z
        .string()
        .trim()
        .min(1, 'userPrompt is required.')
        .max(32000, 'userPrompt is too long'),
    model: z.string().trim().min(1).max(160, 'model is too long').optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().min(1).max(8000).optional(),
    stream: z.boolean().optional().default(false)
});

export const t2iInputSchema = z.object({
    prompt: z.string().trim().min(1, 'prompt is required.').max(4000, 'prompt is too long'),
    ...imageOutputSchema
});

export const i2iInputSchema = t2iInputSchema.extend({
    image_urls: z
        .array(z.string().trim().url('image_urls must contain valid URLs.').max(2048))
        .min(1, 'image_urls is required and must be a non-empty array.')
        .max(4, 'image_urls must contain 4 items or less')
});

export const falRequestIdSchema = z
    .string()
    .trim()
    .min(1, 'requestId is required.')
    .max(200, 'requestId is too long.');

export type LLMInput = z.infer<typeof llmInputSchema>;
export type T2IInput = z.infer<typeof t2iInputSchema>;
export type I2IInput = z.infer<typeof i2iInputSchema>;
