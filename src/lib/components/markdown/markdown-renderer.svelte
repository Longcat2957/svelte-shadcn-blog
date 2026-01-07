<script lang="ts">
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';

	type Props = { md: string; class?: string };
	let { md, class: className }: Props = $props();

	const plugins = [gfmPlugin(), { rehypePlugin: rehypeHighlight }];
</script>

<div class={className}>
	<Markdown {md} {plugins} />
</div>
