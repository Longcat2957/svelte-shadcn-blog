<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { sitemap } from '$lib/mock/sitemap';
    import { ThemeSelector } from '$lib/components/ui/theme-selector';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
</script>

<aside class="w-64 border-r h-screen overflow-y-auto flex flex-col bg-background/50 backdrop-blur-sm sticky top-0 shrink-0 hidden md:flex">
    <div class="p-6">
        <h1 class="text-xl font-bold tracking-tight">My Blog</h1>
    </div>
    
    <div class="flex-1 px-4">
        <TreeView.Root class="w-full">
            {#each sitemap as item}
                <TreeView.Folder name={item.name} open={item.open}>
                    {#each item.children as child}
                        {#snippet iconSnippet({ name }: { name: string })}
                            <child.icon class="size-4" />
                        {/snippet}
                        <TreeView.File 
                            name={child.name} 
                            icon={iconSnippet} 
                            onclick={() => goto(child.href)} 
                            class={$page.url.pathname === child.href ? 'bg-accent text-accent-foreground' : ''}
                        />
                    {/each}
                </TreeView.Folder>
            {/each}
        </TreeView.Root>
    </div>

    <div class="p-4 border-t flex justify-between items-center">
        <span class="text-xs text-muted-foreground">© 2024 Blog</span>
        <ThemeSelector />
    </div>
</aside>
