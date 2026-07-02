import { z } from 'zod';

const nullableTextForCreate = (max: number, message: string) =>
    z
        .string()
        .trim()
        .max(max, message)
        .nullable()
        .optional()
        .transform((value) => value || null);

const nullableTextForUpdate = (max: number, message: string) =>
    z
        .string()
        .trim()
        .max(max, message)
        .nullable()
        .optional()
        .transform((value) => {
            if (value === undefined) return undefined;
            return value || null;
        });

const tagsSchema = z
    .array(z.string(), { message: 'tags must be an array' })
    .max(30, 'tags must contain 30 items or less')
    .transform((tags) => Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))))
    .pipe(z.array(z.string().max(50, 'tag must be 50 characters or less')));

export const postCreateSchema = z.object({
    title: z.string().trim().min(1, 'title is required').max(200, 'title is too long'),
    description: nullableTextForCreate(500, 'description is too long'),
    content: z.string().min(1, 'content is required').max(500_000, 'content is too long'),
    categoryId: z.number().int().positive('categoryId is required'),
    tags: tagsSchema.optional().default([]),
    published: z.boolean().optional().default(false),
    thumbnailUrl: nullableTextForCreate(2048, 'thumbnailUrl is too long')
});

export const postUpdateSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, 'title cannot be empty')
            .max(200, 'title is too long')
            .optional(),
        description: nullableTextForUpdate(500, 'description is too long'),
        content: z
            .string()
            .min(1, 'content cannot be empty')
            .max(500_000, 'content is too long')
            .optional(),
        categoryId: z.number().int().positive('categoryId must be positive').optional(),
        tags: tagsSchema.optional(),
        published: z.boolean().optional(),
        thumbnailUrl: nullableTextForUpdate(2048, 'thumbnailUrl is too long')
    })
    .refine(
        (data) =>
            data.title !== undefined ||
            data.description !== undefined ||
            data.content !== undefined ||
            data.categoryId !== undefined ||
            data.tags !== undefined ||
            data.published !== undefined ||
            data.thumbnailUrl !== undefined,
        { message: 'No post fields provided.' }
    );
