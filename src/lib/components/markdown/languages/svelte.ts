import type { HLJSApi } from 'highlight.js';
import typescriptRegister from 'highlight.js/lib/languages/typescript';

function svelteDefinition(hljs: HLJSApi) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const tsLang = typescriptRegister(hljs) as any;

	// Svelte Runes: $state, $derived, $effect, $props, $bindable, $inspect, $host
	const RUNES = {
		className: 'keyword',
		begin: /\$(?:state|derived|effect|props|bindable|inspect|host)\b/,
		relevance: 10
	};

	// Svelte 블록 디렉티브: {#if}, {:else if}, {/each}, {@html}, {#snippet} 등
	const SVELTE_BLOCK = {
		className: 'keyword',
		begin: /\{[#/:@]/,
		end: /\}/,
		contains: [
			{
				className: 'keyword',
				begin: /\b(?:if|else if|else|each|await|then|catch|key|snippet|render|const|html|debug)\b/
			},
			hljs.QUOTE_STRING_MODE,
			hljs.NUMBER_MODE
		]
	};

	// TypeScript 패턴 앞에 Svelte 고유 패턴만 삽입
	tsLang.contains = [RUNES, SVELTE_BLOCK, ...tsLang.contains];

	return { ...tsLang, name: 'Svelte', aliases: ['svelte'] };
}

export const svelte = {
	name: 'svelte',
	register: svelteDefinition
};

export default svelte;
