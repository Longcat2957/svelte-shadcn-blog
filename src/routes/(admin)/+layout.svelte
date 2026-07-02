<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';
    import X from '@lucide/svelte/icons/x';
    import { page, navigating } from '$app/stores';
    import { resolve } from '$app/paths';
    import { Spinner } from '$lib/components/ui/spinner';
    import TopNav from '$lib/components/layout/top-nav.svelte';
    let { children } = $props();
    let mobileMenuOpen = $state(false);

    import { adminSitemap } from '$lib/config/sitemap';
    import { adminLayoutState } from '$lib/state/admin.svelte';
    import { Toaster } from '$lib/components/ui/sonner';

    const adminNavItems = adminSitemap;
</script>

<Toaster />

{#if $page.url.pathname.startsWith('/admin/login')}
    {@render children()}
{:else}
    <div class="flex min-h-screen flex-col">
        <!-- Top Navigation Area (Synced with App) -->
        <header
            class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
        >
            <div
                class="container mx-auto transition-all duration-300 {adminLayoutState.fullWidth
                    ? 'max-w-450'
                    : 'max-w-6xl'}"
            >
                <TopNav onMenuClick={() => (mobileMenuOpen = !mobileMenuOpen)} />
            </div>
        </header>

        <!-- Main Content Area -->
        <div class="flex w-full flex-1 justify-center border-x border-transparent">
            <div
                class="relative container mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col border-x border-border/50 transition-all duration-300 md:flex-row {adminLayoutState.fullWidth
                    ? 'max-w-450'
                    : 'max-w-6xl'}"
            >
                <!-- Admin Sidebar (Styled like App Sidebar) -->
                <aside
                    class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm md:flex"
                >
                    <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                        <div
                            class="mb-2 px-3 text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase"
                        >
                            Admin Menu
                        </div>
                        <nav class="space-y-1">
                            {#each adminNavItems as item (item.href)}
                                <a
                                    href={resolve(item.href)}
                                    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all {$page
                                        .url.pathname === item.href
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                                >
                                    <item.icon class="size-4" />
                                    {item.name}
                                </a>
                            {/each}
                        </nav>

                        <div class="border-t pt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                class="w-full justify-start gap-3 px-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground"
                                onclick={() => (window.location.href = '/')}
                            >
                                <ArrowLeft class="size-4" />
                                Return to Blog
                            </Button>
                        </div>
                    </div>
                </aside>

                <!-- Mobile Admin Sidebar (Slide-over drawer) -->
                {#if mobileMenuOpen}
                    <!-- Backdrop -->
                    <button
                        type="button"
                        class="fixed inset-0 z-40 bg-black/50 md:hidden"
                        onclick={() => (mobileMenuOpen = false)}
                        aria-label="Close menu"
                    ></button>

                    <!-- Drawer -->
                    <aside
                        class="fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden"
                    >
                        <div class="flex items-center justify-between border-b px-4 py-3">
                            <span class="text-lg font-bold">Admin Menu</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-8"
                                onclick={() => (mobileMenuOpen = false)}
                                aria-label="Close menu"
                            >
                                <X class="size-5" />
                            </Button>
                        </div>
                        <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                            <nav class="space-y-1">
                                {#each adminNavItems as item (item.href)}
                                    <a
                                        href={resolve(item.href)}
                                        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all {$page
                                            .url.pathname === item.href
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                                        onclick={() => (mobileMenuOpen = false)}
                                    >
                                        <item.icon class="size-4" />
                                        {item.name}
                                    </a>
                                {/each}
                            </nav>

                            <div class="border-t pt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="w-full justify-start gap-3 px-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground"
                                    onclick={() => (window.location.href = '/')}
                                >
                                    <ArrowLeft class="size-4" />
                                    Return to Blog
                                </Button>
                            </div>
                        </div>
                    </aside>
                {/if}

                <main class="min-w-0 flex-1 bg-background p-4 md:p-8">
                    {#if $navigating}
                        <div class="flex h-[50vh] w-full items-center justify-center">
                            <Spinner class="size-10" />
                        </div>
                    {:else}
                        {@render children()}
                    {/if}
                </main>
            </div>
        </div>
    </div>
{/if}
