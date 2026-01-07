<script lang="ts" module>
    import { writable } from 'svelte/store';
    export const sidebarOpen = writable(true);
</script>

<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import FileIcon from '@lucide/svelte/icons/file';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import { sidebarOpen as openStore } from './sidebar.svelte';
    import { Button } from '$lib/components/ui/button';

    const currentPage = page;

    interface CategoryNode {
        id: number;
        name: string;
        children: CategoryNode[];
    }

    let categories = $derived(($page.data.categories as CategoryNode[]) ?? []);
</script>

{#snippet renderTreeView(items: CategoryNode[])}
    {#each items as item}
        {#if item.children && item.children.length > 0}
            <TreeView.Folder name={item.name} open={true} class="w-full">
                {@render renderTreeView(item.children)}
            </TreeView.Folder>
        {:else}
            {#snippet iconSnippet({ name }: { name: string })}
                <FileIcon class="size-4" />
            {/snippet}
            <TreeView.File
                name={item.name}
                icon={iconSnippet}
                onclick={() => goto(`/?category=${item.id}`)}
                class={$currentPage.url.searchParams.get('category') === String(item.id)
                    ? 'bg-accent text-accent-foreground'
                    : ''}
            />
        {/if}
    {/each}
{/snippet}

<div class="relative flex h-full flex-col bg-background">
    <!-- Overlay Toggle Button on Border -->
    <div class="absolute top-6 -right-3 z-40 hidden md:block">
        <Button
            variant="outline"
            size="icon"
            class="h-6 w-6 rounded-full border-border/50 bg-background shadow-md transition-all hover:bg-accent"
            onclick={() => openStore.update((v) => !v)}
        >
            {#if $openStore}
                <ChevronLeft class="size-3.5" />
            {:else}
                <ChevronRight class="size-3.5" />
            {/if}
        </Button>
    </div>

    {#if $openStore}
        <aside
            class="sticky top-14 flex hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm md:flex"
        >
            <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                <TreeView.Root class="w-full">
                    {#if categories.length > 0}
                        {@render renderTreeView(categories)}
                    {/if}
                </TreeView.Root>
            </div>

            <div class="flex items-center justify-center border-t p-4">
                <span class="text-xs text-muted-foreground">© 2024 Blog</span>
            </div>
        </aside>
    {:else}
        <!-- Minimized State Border -->
        <div class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-px bg-border/50 md:block"></div>
    {/if}
</div>
