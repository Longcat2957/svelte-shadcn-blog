<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
    import PenBox from '@lucide/svelte/icons/pen-box';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';
    import { page } from '$app/stores';
    import TopNav from '$lib/components/layout/top-nav.svelte';
    import MobileHeader from '$lib/components/layout/mobile-header.svelte';
    import Settings from '@lucide/svelte/icons/settings';

    let { children } = $props();
    let mobileMenuOpen = $state(false);

    import { adminSitemap } from '$lib/config/sitemap';

    const adminNavItems = adminSitemap;
</script>

{#if $page.url.pathname.startsWith('/admin/login')}
    {@render children()}
{:else}
    <div class="flex min-h-screen flex-col">
        <!-- Top Navigation Area (Synced with App) -->
        <header
            class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
                <!-- Admin Sidebar (Styled like App Sidebar) -->
                <aside
                    class="sticky top-14 flex hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm md:flex"
                >
                    <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                        <div
                            class="mb-2 px-3 text-[10px] font-bold tracking-[0.1em] text-muted-foreground/70 uppercase"
                        >
                            Admin Menu
                        </div>
                        <nav class="space-y-1">
                            {#each adminNavItems as item}
                                <a
                                    href={item.href}
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

                    <div class="border-t bg-muted/20 p-4">
                        <div class="flex items-center gap-3 px-2">
                            <div
                                class="flex size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
                            >
                                <Settings class="size-4 text-primary" />
                            </div>
                            <div class="flex min-w-0 flex-col">
                                <p
                                    class="truncate text-[12px] leading-none font-bold text-foreground"
                                >
                                    Admin User
                                </p>
                                <p
                                    class="mt-1 truncate text-[10px] leading-tight text-muted-foreground opacity-80"
                                >
                                    admin@example.com
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- User side uses MobileHeader, but we might want admin-specific mobile layout? 
                         Let's keep it consistent for now. -->
                <MobileHeader bind:open={mobileMenuOpen} />

                <main class="min-w-0 flex-1 bg-background p-4 md:p-8">
                    {@render children()}
                </main>
            </div>
        </div>
    </div>
{/if}
