export type CommentVisibilityItem = {
    is_secret: boolean;
    content: string;
};

export const SECRET_COMMENT_PLACEHOLDER = '비밀 댓글입니다.';

export function maskSecretCommentsForViewer<T extends CommentVisibilityItem>({
    items,
    isAdmin
}: {
    items: T[];
    isAdmin: boolean;
}): T[] {
    if (isAdmin) return items;

    return items.map((item) => {
        if (!item.is_secret) return item;
        return {
            ...item,
            content: SECRET_COMMENT_PLACEHOLDER
        };
    });
}
