<script lang="ts">
    import { getHighlighter } from './shiki-highlighter.svelte';
    import { Check, Copy } from '@lucide/svelte';
    import { fade } from 'svelte/transition';
    import type { HTMLAttributes } from 'svelte/elements';
    import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

    let {
        code = '',
        lang = '',
        ...rest
    }: { code?: string; lang?: string } & HTMLAttributes<HTMLPreElement> = $props();

    let highlighter = $state<Awaited<ReturnType<typeof getHighlighter>> | null>(null);
    let copied = $state(false);
    let cleanCode = $derived(code.endsWith('\n') ? code.slice(0, -1) : code);
    let lines = $derived(cleanCode.split('\n'));

    // Shiki 싱글톤 초기화
    $effect(() => {
        getHighlighter().then((h) => {
            highlighter = h;
        });
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

    // 배경색 제거하고 텍스트 색상만 유지
    function removeBackgroundStyles(html: string): string {
        // pre, code 태그의 style 속성에서 background 관련 스타일 제거
        return html
            .replace(/style="([^"]*)"/g, (match, styles) => {
                const filteredStyles = styles
                    .split(';')
                    .filter((s: string) => {
                        const prop = s.trim().toLowerCase();
                        // color 관련만 유지, background는 제거
                        return prop.startsWith('color:') && !prop.includes('background');
                    })
                    .join(';');
                return filteredStyles ? `style="${filteredStyles}"` : '';
            })
            .replace(/style=""/g, '')
            .replace(/<pre([^>]*)style=""/g, '<pre$1')
            .replace(/<code([^>]*)style=""/g, '<code$1');
    }

    $effect(() => {
        if (highlighter && cleanCode && normalizedLang) {
            try {
                const rawHtml = highlighter.codeToHtml(cleanCode, {
                    lang: normalizedLang,
                    theme: 'github-dark'
                });
                highlightedCode = removeBackgroundStyles(rawHtml);
            } catch {
                // 지원하지 않는 언어인 경우 plaintext로 폴백
                const rawHtml = highlighter.codeToHtml(cleanCode, {
                    lang: 'text',
                    theme: 'github-dark'
                });
                highlightedCode = removeBackgroundStyles(rawHtml);
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

        {#if normalizedLang}
            <div
                class="absolute right-2 bottom-2 font-mono text-xs text-muted-foreground/40 select-none"
            >
                {normalizedLang}
            </div>
        {/if}

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
            <div class="code-content min-w-0 flex-1 pr-10 pl-2">
                {#if highlightedCode}
                    {@html highlightedCode}
                {:else}
                    <div class="space-y-1">
                        {#each lines as line, i}
                            <div class="flex items-center gap-2">
                                <Skeleton
                                    class="h-4"
                                    style="width: {Math.max(20, Math.min(line.length * 0.6, 80))}%"
                                />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{:else}
    <pre {...rest}>{@render rest.children?.()}</pre>
{/if}

<style>
    .code-content :global(pre) {
        margin: 0;
        padding: 0;
        background: transparent;
        line-height: 1.5rem;
    }
    .code-content :global(code) {
        background: transparent;
        line-height: 1.5rem;
    }
</style>
