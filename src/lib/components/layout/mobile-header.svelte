<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import FileIcon from '@lucide/svelte/icons/file';

    let { open = $bindable(false) } = $props<{ open: boolean }>();

    function navigate(href: string) {
        open = false;
        goto(href);
    }

    interface CategoryNode {
        id: number;
        name: string;
        children: CategoryNode[];
    }

    let categories = $derived($page.data.categories as CategoryNode[] ?? []);
</script>

{#snippet renderTreeView(items: CategoryNode[])}
    {#each items as item}
        {#if item.children && item.children.length > 0}
            <TreeView.Folder name={item.name} open={true} class="w-full text-left">
                {@render renderTreeView(item.children)}
            </TreeView.Folder>
        {:else}
            {#snippet iconSnippet({ name }: { name: string })}
                <FileIcon class="size-4" />
            {/snippet}
            <TreeView.File 
                name={item.name} 
                icon={iconSnippet} 
                onclick={() => navigate(`/?category=${item.id}`)} 
                class={$page.url.searchParams.get('category') === String(item.id) ? 'bg-accent text-accent-foreground' : ''}
            />
        {/if}
    {/each}
{/snippet}

{#if open}
    <div class="fixed inset-0 top-14 z-50 bg-background/95 backdrop-blur border-t p-4 overflow-y-auto md:hidden">
        <TreeView.Root class="w-full text-left">
            {#if categories.length > 0}
                {@render renderTreeView(categories)}
            {/if}
        </TreeView.Root>
    </div>
{/if}
