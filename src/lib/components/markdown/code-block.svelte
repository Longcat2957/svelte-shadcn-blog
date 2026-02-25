<script lang="ts">
    import { createHighlighter, type Highlighter } from 'shiki';
    import { Check, Copy } from '@lucide/svelte';
    import { fade } from 'svelte/transition';
    import type { HTMLAttributes } from 'svelte/elements';

    let {
        code = '',
        lang = '',
        ...rest
    }: { code?: string; lang?: string } & HTMLAttributes<HTMLPreElement> = $props();

    let highlighter: Highlighter | null = $state(null);
    let copied = $state(false);
    let cleanCode = $derived(code.endsWith('\n') ? code.slice(0, -1) : code);
    let lines = $derived(cleanCode.split('\n'));

    // Shiki 초기화
    $effect(() => {
        if (!highlighter) {
            createHighlighter({
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
                highlighter = h;
            });
        }
    });

    // 언어 매핑 (shiki는 문자열로 언어 지정)
    const langMap: Record<string, string> = {
        sh: 'bash',
        shell: 'bash',
        'c++': 'cpp',
        cs: 'csharp',
        golang: 'go',
        js: 'javascript',
        kt: 'kotlin',
        md: 'markdown',
        py: 'python',
        rb: 'ruby',
        rs: 'rust',
        ts: 'typescript',
        html: 'html',
        yml: 'yaml'
    };

    // 언어 이름 정규화
    const normalizedLang = $derived(langMap[lang] || lang);

    // 하이라이팅된 코드
    let highlightedCode = $state('');

    $effect(() => {
        if (highlighter && cleanCode && normalizedLang) {
            try {
                highlightedCode = highlighter.codeToHtml(cleanCode, {
                    lang: normalizedLang,
                    theme: 'github-dark'
                });
            } catch {
                // 지원하지 않는 언어인 경우 plaintext로 폴백
                highlightedCode = highlighter.codeToHtml(cleanCode, {
                    lang: 'text',
                    theme: 'github-dark'
                });
            }
        }
    });

    function copyToClipboard() {
        if (!code) return;
        navigator.clipboard.writeText(code);
        copied = true;
        setTimeout(() => {
            copied = false;
        }, 2000);
    }
</script>

{#if code}
    <div
        class="dark group relative my-4 overflow-hidden rounded-lg border border-border bg-muted font-mono text-base leading-6"
        style="font-family: 'D2Coding', monospace;"
    >
        <button
            onclick={copyToClipboard}
            class="absolute top-2 right-2 z-10 rounded-md p-2 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground focus:opacity-100"
            aria-label="Copy code"
        >
            {#if copied}
                <div in:fade={{ duration: 100 }} class="flex items-center justify-center">
                    <Check class="h-4 w-4 text-green-500" />
                </div>
            {:else}
                <div in:fade={{ duration: 100 }} class="flex items-center justify-center">
                    <Copy class="h-4 w-4" />
                </div>
            {/if}
        </button>

        <div class="flex overflow-x-auto py-3">
            <!-- Line Numbers -->
            <div
                class="min-w-12 flex-none border-r border-border pr-2 pl-2 text-right text-muted-foreground/50 select-none"
            >
                {#each lines as _, i}
                    <div class="leading-6">{i + 1}</div>
                {/each}
            </div>

            <!-- Code -->
            <div class="min-w-0 flex-1 pr-10 pl-2">
                {#if highlightedCode}
                    {@html highlightedCode}
                {:else}
                    <pre class="not-prose m-0! bg-transparent! p-0! leading-6 whitespace-pre"><code>{cleanCode}</code></pre>
                {/if}
            </div>
        </div>
    </div>
{:else}
    <pre {...rest}>{@render rest.children?.()}</pre>
{/if}