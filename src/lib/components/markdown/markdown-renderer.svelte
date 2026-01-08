<script lang="ts">
    import Markdown from 'svelte-exmarkdown';
    import { rehypeExtractCode } from './rehype-extract-code';
    import { gfmPlugin } from 'svelte-exmarkdown/gfm';
    import rehypeRaw from 'rehype-raw';
    import CodeBlock from './code-block.svelte';

    type Props = { md: string; class?: string };
    let { md, class: className }: Props = $props();

    const plugins = [gfmPlugin(), { rehypePlugin: rehypeExtractCode }, { rehypePlugin: rehypeRaw }];
</script>

{#snippet customPre(props: any)}
    <CodeBlock {...props} />
{/snippet}

<div class={className}>
    <Markdown {md} {plugins} pre={customPre} />
</div>
