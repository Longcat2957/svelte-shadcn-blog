<script lang="ts">
    import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
    import { md } from './markdown';
</script>

<MarkdownRenderer class="prose max-w-none pb-24 prose-zinc dark:prose-invert" {md} />
