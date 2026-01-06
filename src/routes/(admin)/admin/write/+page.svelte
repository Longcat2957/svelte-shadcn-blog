<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    import { sitemap, type SitemapItem } from '$lib/mock/sitemap';
    import Folder from '@lucide/svelte/icons/folder';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Plus from '@lucide/svelte/icons/plus';
    import Eye from '@lucide/svelte/icons/eye';
    import Edit3 from '@lucide/svelte/icons/edit-3';
    import X from "@lucide/svelte/icons/x";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Badge } from '$lib/components/ui/badge';

    let title = $state('');
    let content = $state('');
    let selectedDirectory = $state('Blog/Development');
    let viewMode = $state<'edit' | 'preview'>('edit');
    let tags = $state<string[]>([]);
    let tagInput = $state('');

    function addTag() {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            tags = [...tags, trimmed];
        }
        tagInput = '';
    }

    function removeTag(tag: string) {
        tags = tags.filter(t => t !== tag);
    }

    // Flatten sitemap for selector
    function getDirectories(items: SitemapItem[], path = ''): string[] {
        let dirs: string[] = [];
        for (const item of items) {
            const currentPath = path ? `${path}/${item.name}` : item.name;
            if (item.type === 'folder') {
                dirs.push(currentPath);
                if (item.children) {
                    dirs = [...dirs, ...getDirectories(item.children, currentPath)];
                }
            }
        }
        return dirs;
    }

    const availableDirectories = getDirectories(sitemap);
</script>

<div class="space-y-8 max-w-5xl mx-auto pb-12">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">Write Post</h1>
            <p class="text-sm text-muted-foreground">Create or edit your blog post with markdown support.</p>
        </div>
        
        <div class="flex bg-muted p-1 rounded-lg border shadow-sm">
            <Button 
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'} 
                size="sm" 
                class="gap-2 h-8" 
                onclick={() => viewMode = 'edit'}
            >
                <Edit3 class="size-4" /> Edit
            </Button>
            <Button 
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'} 
                size="sm" 
                class="gap-2 h-8" 
                onclick={() => viewMode = 'preview'}
            >
                <Eye class="size-4" /> Preview
            </Button>
        </div>
    </div>

    <div class="space-y-6">
        {#if viewMode === 'edit'}
            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label for="title" class="text-sm font-semibold text-foreground/80 ml-1">Title</label>
                    <Input id="title" placeholder="Enter a catchy title..." bind:value={title} class="bg-card/50 backdrop-blur-sm" />
                </div>
                
                <div class="space-y-2">
                    <label for="directory" class="text-sm font-semibold text-foreground/80 ml-1">Directory / Category</label>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                             {#snippet child({ props })}
                                <Button {...props} variant="outline" class="w-full justify-between bg-card/50 backdrop-blur-sm font-normal">
                                    <div class="flex items-center gap-2">
                                        <Folder class="size-4 text-muted-foreground" />
                                        <span>{selectedDirectory || 'Select directory...'}</span>
                                    </div>
                                    <ChevronDown class="size-4 opacity-50" />
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content class="w-[--bits-dropdown-menu-anchor-width] max-h-64 overflow-y-auto">
                            {#each availableDirectories as dir}
                                <DropdownMenu.Item onclick={() => selectedDirectory = dir}>
                                    {dir}
                                </DropdownMenu.Item>
                            {/each}
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item class="text-primary font-medium">
                                <Plus class="size-4 mr-2" />
                                Create New Directory
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            </div>

            <div class="space-y-2">
                <label for="tags" class="text-sm font-semibold text-foreground/80 ml-1">Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                    {#each tags as tag}
                        <Badge variant="secondary" class="gap-1 pr-1">
                            {tag}
                            <button 
                                onclick={() => removeTag(tag)}
                                class="hover:text-destructive transition-colors outline-none"
                            >
                                <X class="size-3" />
                            </button>
                        </Badge>
                    {/each}
                </div>
                <div class="flex gap-2">
                    <Input 
                        id="tags" 
                        placeholder="Add a tag..." 
                        bind:value={tagInput} 
                        class="bg-card/50 backdrop-blur-sm"
                        onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button variant="outline" onclick={addTag}>Add</Button>
                </div>
            </div>
            
            <div class="space-y-2">
                <label for="content" class="text-sm font-semibold text-foreground/80 ml-1">Content (Markdown)</label>
                <div class="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
                    <Textarea id="content" placeholder="Write your post content here..." class="min-h-[600px] border-0 focus-visible:ring-0 resize-none p-4" bind:value={content} />
                </div>
            </div>
        {:else}
            <!-- Preview Mode -->
            <div class="rounded-xl border bg-card/30 backdrop-blur-sm p-8 md:p-12 min-h-[700px]">
                <div class="max-w-3xl mx-auto space-y-8">
                    <div class="space-y-4">
                        <div class="flex items-center gap-2 text-sm text-primary font-medium">
                            <Folder class="size-4" /> {selectedDirectory}
                        </div>
                        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8">
                            {title || 'Untitiled Post'}
                        </h1>
                        <div class="flex flex-wrap gap-2 py-2">
                            {#each tags as tag}
                                <Badge variant="outline">{tag}</Badge>
                            {/each}
                        </div>
                        <div class="text-sm text-muted-foreground">Written on January 6, 2026</div>
                    </div>
                    
                    <div class="prose dark:prose-invert max-w-none">
                        {#if content}
                            <div class="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                {content}
                            </div>
                        {:else}
                            <p class="text-muted-foreground italic text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                                No content to preview. Start writing in the Edit tab!
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <div class="flex items-center justify-between border-t pt-6">
            <Button variant="ghost" href="/admin" class="text-muted-foreground hover:text-foreground">
                Discard Changes
            </Button>
            <div class="flex gap-3">
                <Button variant="secondary" class="bg-card/50">Save Draft</Button>
                <Button class="px-8">Publish</Button>
            </div>
        </div>
    </div>
</div>
