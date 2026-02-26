import { visit } from 'unist-util-visit';

export const remarkInlineCode = () => {
    return (tree: any) => {
        visit(tree, 'inlineCode', (node: any, index: number | undefined, parent: any) => {
            if (index === undefined || !parent) return;
            const html = `<inline-code>${escapeHtml(node.value)}</inline-code>`;
            parent.children.splice(index, 1, { type: 'html', value: html });
        });
    };
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
