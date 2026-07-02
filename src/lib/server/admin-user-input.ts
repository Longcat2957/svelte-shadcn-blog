import { z } from 'zod';

export const userUpdateSchema = z.object({
    username: z.string().trim().min(1, 'Username is required').max(50, 'Username is too long'),
    avatar_url: z
        .string()
        .trim()
        .max(2048, 'Avatar URL is too long')
        .nullable()
        .optional()
        .transform((value) => value || null),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional()
});

export function isUniqueViolation(error: unknown): error is { code: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === '23505'
    );
}

export function requiresCurrentPasswordForChange({
    currentPassword,
    newPassword
}: {
    currentPassword?: string;
    newPassword?: string;
}): boolean {
    return !!newPassword && !currentPassword;
}
