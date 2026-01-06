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
    <div class="flex flex-col min-h-screen">
            <!-- Top Navigation Area (Synced with App) -->
            <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div class="container mx-auto max-w-6xl">
                    <TopNav onMenuClick={() => (mobileMenuOpen = !mobileMenuOpen)} />
                </div>
            </header>

            <!-- Main Content Area -->
            <div class="flex flex-1 justify-center w-full border-x border-transparent">
                <div class="container mx-auto max-w-6xl flex flex-col md:flex-row relative border-x border-border/50 min-h-[calc(100vh-3.5rem)]">
                    
                    <!-- Admin Sidebar (Styled like App Sidebar) -->
                    <aside class="w-64 border-r border-border/50 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col bg-background/50 backdrop-blur-sm sticky top-14 shrink-0 hidden md:flex">
                        <div class="flex-1 py-6 overflow-y-auto px-4 space-y-4">
                            <div class="px-3 mb-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">
                                Admin Menu
                            </div>
                            <nav class="space-y-1">
                                {#each adminNavItems as item}
                                    <a 
                                        href={item.href} 
                                        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all {$page.url.pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
                                    >
                                        <item.icon class="size-4" />
                                        {item.name}
                                    </a>
                                {/each}
                            </nav>
                            
                            <div class="pt-4 border-t">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    class="w-full justify-start gap-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground px-3" 
                                    onclick={() => (window.location.href = '/')}
                                >
                                    <ArrowLeft class="size-4" />
                                    Return to Blog
                                </Button>
                            </div>
                        </div>

                        <div class="p-4 border-t bg-muted/20">
                            <div class="flex items-center gap-3 px-2">
                                <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Settings class="size-4 text-primary" />
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <p class="text-[12px] font-bold leading-none truncate text-foreground">Admin User</p>
                                    <p class="text-[10px] text-muted-foreground truncate leading-tight mt-1 opacity-80">admin@example.com</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <!-- User side uses MobileHeader, but we might want admin-specific mobile layout? 
                         Let's keep it consistent for now. -->
                    <MobileHeader bind:open={mobileMenuOpen} />

                    <main class="flex-1 p-4 md:p-8 min-w-0 bg-background">
                         {@render children()}
                    </main>
                </div>
            </div>
        </div>
{/if}
