<script lang="ts">
	import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
	import { md } from './markdown';
</script>

<MarkdownRenderer class="prose prose-zinc dark:prose-invert max-w-none" {md} />
