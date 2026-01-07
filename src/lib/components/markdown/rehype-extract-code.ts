import { visit } from 'unist-util-visit';

export const rehypeExtractCode = () => {
    return (tree: any) => {
        visit(tree, 'element', (node: any) => {
            if (node.tagName === 'pre') {
                const codeNode = node.children.find((child: any) => child.tagName === 'code');

                if (codeNode) {
                    // 코드 내용 추출 (텍스트 노드)
                    let codeText = '';

                    // codeNode의 자식들을 순회하며 text 합치기
                    if (codeNode.children) {
                        codeNode.children.forEach((child: any) => {
                            if (child.type === 'text') {
                                codeText += child.value;
                            }
                        });
                    }

                    // 언어 추출
                    let language = 'plaintext';
                    if (codeNode.properties && Array.isArray(codeNode.properties.className)) {
                        const classes = codeNode.properties.className;
                        const langClass = classes.find((c: string) => c.startsWith('language-'));
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
