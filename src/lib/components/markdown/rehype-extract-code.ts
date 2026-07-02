import { visit } from 'unist-util-visit';

type HastNode = HastElement | HastText | { type: string; [key: string]: unknown };

type HastRoot = {
    type: 'root';
    children: HastNode[];
};

type HastElement = {
    type: 'element';
    tagName: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

type HastText = {
    type: 'text';
    value: string;
};

type CodeElement = HastElement & {
    tagName: 'code';
    children: HastNode[];
    properties: {
        className?: string[];
        [key: string]: unknown;
    };
};

type PreElement = HastElement & {
    tagName: 'pre';
    children: HastNode[];
    properties: {
        code?: string;
        lang?: string;
        [key: string]: unknown;
    };
};

export const rehypeExtractCode = () => {
    return (tree: HastRoot) => {
        visit(tree, 'element', (node: HastElement) => {
            if (isPreElement(node)) {
                const codeNode = node.children.find(isCodeElement);

                if (codeNode) {
                    // 코드 내용 추출 (텍스트 노드)
                    let codeText = '';

                    // codeNode의 자식들을 순회하며 text 합치기
                    codeNode.children.forEach((child) => {
                        if (isTextNode(child)) {
                            codeText += child.value;
                        }
                    });

                    // 언어 추출
                    let language = 'plaintext';
                    const classes = codeNode.properties.className;
                    if (Array.isArray(classes)) {
                        const langClass = classes.find((c) => c.startsWith('language-'));
                        if (langClass) {
                            language = langClass.replace('language-', '');
                        }
                    }

                    // pre 요소의 속성으로 주입
                    node.properties = node.properties || {};
                    node.properties.code = codeText;
                    node.properties.lang = language;
                }
            }
        });
    };
};

function isPreElement(node: HastElement): node is PreElement {
    return node.tagName === 'pre';
}

function isCodeElement(node: HastNode): node is CodeElement {
    return node.type === 'element' && node.tagName === 'code';
}

function isTextNode(node: HastNode): node is HastText {
    return node.type === 'text';
}
