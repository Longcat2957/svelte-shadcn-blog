<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { ModeWatcher } from 'mode-watcher';
    import Sidebar from '$lib/components/layout/sidebar.svelte';
    import MobileHeader from '$lib/components/layout/mobile-header.svelte';

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />

<div class="flex flex-col min-h-screen md:flex-row">
    <Sidebar />
    <div class="flex flex-col flex-1 min-w-0">
        <MobileHeader />
        <main class="flex-1 p-4 md:p-8 container mx-auto max-w-4xl">
             {@render children()}
        </main>
    </div>
</div>
