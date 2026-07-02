export type CategoryRow = {
    id: number;
    name: string;
    parent_id: number | null;
    sort_order: number;
};

export type PostPreview = {
    id: number;
    title: string;
};

export type CategoryTreeNode = {
    type: 'category';
    id: number;
    name: string;
    parentId: number | null;
    children: CategoryTreeNode[];
    postsPreview: PostPreview[];
    postsTotal: number;
};

type CategoryTreeNodeInternal = CategoryTreeNode & {
    sortOrder: number;
};

export function parseBool(value: string | null): boolean {
    if (!value) return false;
    return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

export function parseOptionalInt(value: string | null): number | null {
    if (value === null) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
}

export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
    const map = new Map<number, CategoryTreeNodeInternal>();
    const roots: CategoryTreeNodeInternal[] = [];

    for (const row of rows) {
        map.set(row.id, {
            type: 'category',
            id: row.id,
            name: row.name,
            parentId: row.parent_id,
            children: [],
            postsPreview: [],
            postsTotal: 0,
            sortOrder: row.sort_order
        });
    }

    for (const node of map.values()) {
        if (node.parentId !== null && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    sortCategoryNodes(roots);
    return stripInternalSortOrder(roots);
}

function sortCategoryNodes(nodes: CategoryTreeNodeInternal[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    for (const node of nodes) {
        sortCategoryNodes(node.children as CategoryTreeNodeInternal[]);
    }
}

function stripInternalSortOrder(nodes: CategoryTreeNodeInternal[]): CategoryTreeNode[] {
    return nodes.map((node) => ({
        type: node.type,
        id: node.id,
        name: node.name,
        parentId: node.parentId,
        postsPreview: node.postsPreview,
        postsTotal: node.postsTotal,
        children: stripInternalSortOrder(node.children as CategoryTreeNodeInternal[])
    }));
}

export function attachCategoryPostSummaries({
    tree,
    totalsByCategoryId,
    previewsByCategoryId
}: {
    tree: CategoryTreeNode[];
    totalsByCategoryId: Map<number, number>;
    previewsByCategoryId: Map<number, PostPreview[]>;
}): CategoryTreeNode[] {
    return tree.map((node) => ({
        ...node,
        postsTotal: totalsByCategoryId.get(node.id) ?? 0,
        postsPreview: previewsByCategoryId.get(node.id) ?? [],
        children: attachCategoryPostSummaries({
            tree: node.children,
            totalsByCategoryId,
            previewsByCategoryId
        })
    }));
}
