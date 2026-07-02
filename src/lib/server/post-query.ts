export type PostListQuery = {
    limit: number;
    page: number;
    offset: number;
    categoryId: number | null;
    tag: string;
    q: string;
};

export function parseOptionalInt(value: string | null): number | null {
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function clampInt(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function parsePostListQuery(searchParams: URLSearchParams): PostListQuery {
    const limit = clampInt(parseOptionalInt(searchParams.get('limit')) ?? 20, 1, 100);
    const page = Math.max(parseOptionalInt(searchParams.get('page')) ?? 1, 1);

    return {
        limit,
        page,
        offset: (page - 1) * limit,
        categoryId: parseOptionalInt(searchParams.get('categoryId')),
        tag: (searchParams.get('tag') ?? '').trim(),
        q: (searchParams.get('q') ?? '').trim()
    };
}
