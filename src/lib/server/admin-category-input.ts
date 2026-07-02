import { z } from 'zod';

export const categoryCreateSchema = z.object({
    name: z.string().trim().min(1, 'name is required').max(80, 'name is too long'),
    parentId: z.number().int().positive().nullable().optional().default(null)
});

export const categoryUpdateSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'name cannot be empty')
            .max(80, 'name is too long')
            .optional(),
        parentId: z.number().int().positive().nullable().optional()
    })
    .refine((data) => data.name !== undefined || data.parentId !== undefined, {
        message: 'No category fields provided.'
    });

export const categoryMoveSchema = z.object({
    id: z.number().int().positive('id is required'),
    parentId: z.number().int().positive().nullable().optional().default(null),
    beforeId: z.number().int().positive().nullable().optional().default(null)
});

export const categoryReorderSchema = z
    .object({
        parentId: z.number().int().positive().nullable().optional().default(null),
        orderedIds: z.array(z.number().int().positive()).min(1, 'orderedIds is required')
    })
    .refine((data) => new Set(data.orderedIds).size === data.orderedIds.length, {
        message: 'orderedIds must be unique.'
    });

export function parseAdminCategoryId(id: string): number | null {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
}

export function isSelfParent(id: number, parentId: number | null): boolean {
    return parentId === id;
}

export function hasAncestorCycle({
    id,
    parentId,
    parentById
}: {
    id: number;
    parentId: number | null;
    parentById: Map<number, number | null>;
}): boolean {
    let current = parentId;

    while (current !== null) {
        if (current === id) return true;
        current = parentById.get(current) ?? null;
    }

    return false;
}

export function sameCategoryParent(
    actualParentId: number | null,
    expectedParentId: number | null
): boolean {
    return actualParentId === expectedParentId;
}
