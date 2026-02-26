import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = $state(null);
let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter(): Promise<Highlighter> {
    // 이미 초기화된 인스턴스가 있으면 반환
    if (highlighterInstance) {
        return highlighterInstance;
    }

    // 초기화 진행 중인 Promise가 있으면 대기
    if (highlighterPromise) {
        return highlighterPromise;
    }

    // 새로운 인스턴스 생성
    highlighterPromise = createHighlighter({
        themes: ['github-dark'],
        langs: [
            'bash',
            'c',
            'cpp',
            'csharp',
            'css',
            'go',
            'java',
            'javascript',
            'json',
            'kotlin',
            'markdown',
            'php',
            'python',
            'ruby',
            'rust',
            'sql',
            'swift',
            'typescript',
            'xml',
            'yaml',
            'svelte',
            'dockerfile'
        ]
    }).then((h) => {
        highlighterInstance = h;
        return h;
    });

    return highlighterPromise;
}
