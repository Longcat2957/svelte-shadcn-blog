<script lang="ts">
    import '../layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { ModeWatcher } from 'mode-watcher';
    import Sidebar from '$lib/components/layout/sidebar.svelte';
    import MobileHeader from '$lib/components/layout/mobile-header.svelte';
    import TopNav from '$lib/components/layout/top-nav.svelte';

    let { children } = $props();
    let mobileMenuOpen = $state(false);
</script>

<div class="flex flex-col min-h-screen">
    <!-- Top Navigation Area -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto max-w-6xl">
            <TopNav onMenuClick={() => (mobileMenuOpen = !mobileMenuOpen)} />
        </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex flex-1 justify-center w-full border-x border-transparent">
        <div class="container mx-auto max-w-6xl flex flex-col md:flex-row relative border-x border-border/50 min-h-[calc(100vh-3.5rem)]">
            <Sidebar />
            <MobileHeader bind:open={mobileMenuOpen} />
            <main class="flex-1 p-4 md:p-8 min-w-0">
                 {@render children()}
            </main>
        </div>
    </div>
</div>
