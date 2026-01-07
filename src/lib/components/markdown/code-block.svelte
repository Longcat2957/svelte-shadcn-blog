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
</script>

<svelte:head>
  {@html githubDark}
</svelte:head>

{#if code}
  <Highlight {language} {code} class="not-prose rounded-md" />
{:else}
  <pre {...rest}>{@render rest.children?.()}</pre>
{/if}
