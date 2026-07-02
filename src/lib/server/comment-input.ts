import { z } from 'zod';

export const commentInputSchema = z.object({
    authorName: z
        .string()
        .trim()
        .min(1, 'authorName is required')
        .max(50, 'authorName must be 50 characters or less'),
    content: z
        .string()
        .trim()
        .min(1, 'content is required')
        .max(2000, 'content must be 2000 characters or less'),
    parentId: z.number().int().positive().nullable().optional(),
    password: z
        .string()
        .trim()
        .max(200, 'password must be 200 characters or less')
        .optional()
        .default(''),
    isSecret: z.boolean().optional().default(false)
});

export type CommentInput = z.infer<typeof commentInputSchema>;

export function parseId(id: string): number | null {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
}

export function requiresSecretPassword(input: Pick<CommentInput, 'isSecret' | 'password'>) {
    return input.isSecret && !input.password;
}
