<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.ico';
    import { ModeWatcher } from 'mode-watcher';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>블로그</title>
    <meta name="description" content="개발, 설계, 그리고 일상에 대한 이야기를 담은 블로그입니다." />
    <meta property="og:site_name" content="블로그" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
</svelte:head>

<ModeWatcher />

{@render children()}
