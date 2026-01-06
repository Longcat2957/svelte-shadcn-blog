<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { sitemap } from '$lib/mock/sitemap';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let { open = $bindable(false) } = $props<{ open: boolean }>();

    function navigate(href: string) {
        open = false;
        goto(href);
    }
</script>

{#if open}
    <div class="fixed inset-0 top-14 z-50 bg-background/95 backdrop-blur border-t p-4 overflow-y-auto md:hidden">
        <TreeView.Root class="w-full text-left">
            {#each sitemap as item}
                <TreeView.Folder name={item.name} open={true} class="w-full">
                    {#each item.children as child}
                        {#snippet iconSnippet({ name }: { name: string })}
                            <child.icon class="size-4" />
                        {/snippet}
                        <TreeView.File 
                            name={child.name} 
                            icon={iconSnippet} 
                            onclick={() => navigate(child.href)} 
                            class={$page.url.pathname === child.href ? 'bg-accent text-accent-foreground' : ''}
                        />
                    {/each}
                </TreeView.Folder>
            {/each}
        </TreeView.Root>
    </div>
{/if}
