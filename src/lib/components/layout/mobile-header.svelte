<script lang="ts">
    import Menu from '@lucide/svelte/icons/menu';
    import { Button } from '$lib/components/ui/button';
    import { ThemeSelector } from '$lib/components/ui/theme-selector';
    import * as TreeView from '$lib/components/ui/tree-view';
    import { sitemap } from '$lib/mock/sitemap';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let open = $state(false);

    function navigate(href: string) {
        open = false;
        goto(href);
    }
</script>

<header class="md:hidden flex h-14 items-center gap-4 border-b bg-background px-4 sticky top-0 z-50">
    <Button variant="ghost" size="icon" onclick={() => open = !open}>
        <Menu class="h-5 w-5" />
        <span class="sr-only">Toggle navigation menu</span>
    </Button>
    <div class="flex-1 font-bold">My Blog</div>
    <ThemeSelector />
</header>

{#if open}
    <div class="fixed inset-0 top-14 z-50 bg-background border-t p-4 overflow-y-auto">
        <TreeView.Root class="w-full">
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
