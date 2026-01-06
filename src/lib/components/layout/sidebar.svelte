<script lang="ts" module>
    import { writable } from 'svelte/store';
    export const sidebarOpen = writable(true);
</script>

<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { sitemap, type SitemapItem } from '$lib/mock/sitemap';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import FileIcon from '@lucide/svelte/icons/file';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import { sidebarOpen as openStore } from './sidebar.svelte';
    import { Button } from '$lib/components/ui/button';

    const currentPage = page;
</script>

{#snippet renderTreeView(items: SitemapItem[])}
    {#each items as item}
        {#if item.type === 'folder'}
            <TreeView.Folder name={item.name} open={item.open} class="w-full">
                {#if item.children}
                    {@render renderTreeView(item.children)}
                {/if}
            </TreeView.Folder>
        {:else}
            {#snippet iconSnippet({ name }: { name: string })}
                {#if item.icon}
                    <item.icon class="size-4" />
                {:else}
                    <FileIcon class="size-4" />
                {/if}
            {/snippet}
            <TreeView.File 
                name={item.name} 
                icon={iconSnippet} 
                onclick={() => item.href && goto(item.href)} 
                class={$currentPage.url.pathname === item.href ? 'bg-accent text-accent-foreground' : ''}
            />
        {/if}
    {/each}
{/snippet}

<div class="relative flex flex-col h-full bg-background">
    <!-- Overlay Toggle Button on Border -->
    <div class="absolute -right-3 top-6 z-40 hidden md:block">
        <Button
            variant="outline"
            size="icon"
            class="h-6 w-6 rounded-full bg-background shadow-md border-border/50 hover:bg-accent transition-all"
            onclick={() => openStore.update(v => !v)}
        >
            {#if $openStore}
                <ChevronLeft class="size-3.5" />
            {:else}
                <ChevronRight class="size-3.5" />
            {/if}
        </Button>
    </div>

    {#if $openStore}
        <aside class="w-64 border-r border-border/50 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col bg-background/50 backdrop-blur-sm sticky top-14 shrink-0 hidden md:flex">
            <div class="flex-1 py-6 overflow-y-auto px-4 space-y-4">
                <TreeView.Root class="w-full">
                    {@render renderTreeView(sitemap)}
                </TreeView.Root>
            </div>

            <div class="p-4 border-t flex justify-center items-center">
                <span class="text-xs text-muted-foreground">© 2024 Blog</span>
            </div>
        </aside>
    {:else}
        <!-- Minimized State Border -->
        <div class="w-px bg-border/50 h-[calc(100vh-3.5rem)] sticky top-14 hidden md:block"></div>
    {/if}
</div>
