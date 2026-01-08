<script lang="ts">
    import '../layout.css';
    import favicon from '$lib/assets/favicon.ico';
    import { ModeWatcher } from 'mode-watcher';
    import Sidebar from '$lib/components/layout/sidebar.svelte';
    import MobileHeader from '$lib/components/layout/mobile-header.svelte';
    import TopNav from '$lib/components/layout/top-nav.svelte';
    import Footer from '$lib/components/layout/footer.svelte';
    import { navigating } from '$app/stores';
    import { Spinner } from '$lib/components/ui/spinner';

    let { children } = $props();
    let mobileMenuOpen = $state(false);
</script>

<div class="flex min-h-screen flex-col">
    <!-- Top Navigation Area -->
    <header
        class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
    >
        <div class="container mx-auto max-w-6xl">
            <TopNav onMenuClick={() => (mobileMenuOpen = !mobileMenuOpen)} />
        </div>
    </header>

    <!-- Main Content Area -->
    <div class="flex w-full flex-1 justify-center border-x border-transparent">
        <div
            class="relative container mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col border-x border-border/50 md:flex-row"
        >
            <Sidebar />
            <MobileHeader bind:open={mobileMenuOpen} />
            <main class="min-w-0 flex-1 p-4 md:p-8">
                {#if $navigating}
                    <div class="flex h-[50vh] w-full items-center justify-center">
                        <Spinner class="size-10" />
                    </div>
                {:else}
                    {@render children()}
                {/if}
                <div class="md:hidden">
                    <Footer />
                </div>
            </main>
        </div>
    </div>
</div>
