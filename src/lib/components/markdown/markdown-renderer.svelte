<script lang="ts">
    import Markdown from 'svelte-exmarkdown';
    import { rehypeExtractCode } from './rehype-extract-code';
    import { remarkInlineCode } from './remark-inline-code';
    import { gfmPlugin } from 'svelte-exmarkdown/gfm';
    import rehypeRaw from 'rehype-raw';
    import remarkMath from 'remark-math';
    import rehypeKatex from 'rehype-katex';
    import CodeBlock from './code-block.svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    type Props = { md: string; class?: string };
    type CodeBlockSnippetProps = HTMLAttributes<HTMLPreElement> & {
        code?: string;
        lang?: string | null;
    };
    let { md, class: className }: Props = $props();

    const plugins = [
        gfmPlugin(),
        { remarkPlugin: remarkInlineCode },
        { remarkPlugin: remarkMath },
        { rehypePlugin: rehypeExtractCode },
        { rehypePlugin: rehypeRaw },
        { rehypePlugin: rehypeKatex }
    ];
</script>

{#snippet customPre(props: CodeBlockSnippetProps)}
    {@const { code, lang, ...rest } = props}
    <CodeBlock {...rest} {code} lang={lang ?? undefined} />
{/snippet}

<div class={className}>
    <Markdown {md} {plugins} pre={customPre} />
</div>
