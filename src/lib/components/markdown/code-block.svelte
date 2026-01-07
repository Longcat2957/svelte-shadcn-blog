<script lang="ts">
  import { Highlight } from "svelte-highlight";
  import bash from "svelte-highlight/languages/bash";
  import c from "svelte-highlight/languages/c";
  import cpp from "svelte-highlight/languages/cpp";
  import csharp from "svelte-highlight/languages/csharp";
  import css from "svelte-highlight/languages/css";
  import go from "svelte-highlight/languages/go";
  import java from "svelte-highlight/languages/java";
  import javascript from "svelte-highlight/languages/javascript";
  import json from "svelte-highlight/languages/json";
  import kotlin from "svelte-highlight/languages/kotlin";
  import markdown from "svelte-highlight/languages/markdown";
  import php from "svelte-highlight/languages/php";
  import python from "svelte-highlight/languages/python";
  import ruby from "svelte-highlight/languages/ruby";
  import rust from "svelte-highlight/languages/rust";
  import sql from "svelte-highlight/languages/sql";
  import swift from "svelte-highlight/languages/swift";
  import typescript from "svelte-highlight/languages/typescript";
  import xml from "svelte-highlight/languages/xml";
  import yaml from "svelte-highlight/languages/yaml";
  import { dockerfile } from "svelte-highlight/languages";
  import githubDark from "svelte-highlight/styles/github-dark";
  import type { HTMLAttributes } from 'svelte/elements';
  import { Check, Copy } from "@lucide/svelte";
  import { fade } from 'svelte/transition';
  
  let { code = '', lang = '', ...rest }: { code?: string; lang?: string } & HTMLAttributes<HTMLPreElement> = $props();

  const languages: Record<string, any> = {
    bash,
    sh: bash,
    shell: bash,
    c,
    cpp,
    'c++': cpp,
    cs: csharp,
    csharp,
    css,
    go,
    golang: go,
    java,
    javascript,
    js: javascript,
    json,
    kotlin,
    kt: kotlin,
    markdown,
    md: markdown,
    php,
    python,
    py: python,
    ruby,
    rb: ruby,
    rust,
    rs: rust,
    sql,
    swift,
    typescript,
    ts: typescript,
    xml,
    html: xml,
    svelte: xml,
    yaml,
    yml: yaml,
    dockerfile: dockerfile
  };

  const language = languages[lang] || xml;

  let copied = $state(false);
  let cleanCode = $derived(code.endsWith('\n') ? code.slice(0, -1) : code);
  let lines = $derived(cleanCode.split('\n'));

  function copyToClipboard() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<svelte:head>
  {@html githubDark}
</svelte:head>

{#if code}
  <div class="dark relative my-4 overflow-hidden rounded-lg bg-muted border border-border group font-mono text-base leading-6" style="font-family: 'D2Coding', monospace;">
    <button
      onclick={copyToClipboard}
      class="absolute right-2 top-2 z-10 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
        <div class="flex-none select-none text-right pr-2 pl-2 text-muted-foreground/50 min-w-[3rem] border-r border-border">
            {#each lines as _, i}
                <div class="leading-6">{i + 1}</div>
            {/each}
        </div>

        <!-- Code -->
        <div class="min-w-0 flex-1 pl-2 pr-10">
            <Highlight
                {language}
                code={cleanCode}
                class="not-prose !bg-transparent !p-0 !m-0 !font-inherit !leading-6 whitespace-pre [&_code]:!bg-transparent [&_code]:!py-0 [&_code]:!px-0.5 [&_code]:!m-0" 
            />
        </div>
    </div>
  </div>
{:else}
  <pre {...rest}>{@render rest.children?.()}</pre>
{/if}
