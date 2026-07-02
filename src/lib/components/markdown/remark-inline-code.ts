import { visit } from 'unist-util-visit';

type MarkdownNode = {
    type: string;
    value?: string;
    children?: MarkdownNode[];
};

type MarkdownRoot = {
    type: 'root';
    children: MarkdownNode[];
};

type InlineCodeNode = MarkdownNode & {
    type: 'inlineCode';
    value: string;
};

type HtmlNode = {
    type: 'html';
    value: string;
};

type ParentNode = {
    children: Array<MarkdownNode | HtmlNode>;
};

export const remarkInlineCode = () => {
    return (tree: MarkdownRoot) => {
        visit(
            tree,
            'inlineCode',
            (node: InlineCodeNode, index: number | undefined, parent: ParentNode | undefined) => {
                if (index === undefined || !parent) return;
                const html = `<inline-code>${escapeHtml(node.value)}</inline-code>`;
                const htmlNode: HtmlNode = { type: 'html', value: html };
                parent.children.splice(index, 1, htmlNode);
            }
        );
    };
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
