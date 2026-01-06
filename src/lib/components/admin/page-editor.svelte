<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Input } from '$lib/components/ui/input';
    import Eye from '@lucide/svelte/icons/eye';
    import Edit3 from '@lucide/svelte/icons/edit-3';
    import Save from '@lucide/svelte/icons/save';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';

    let { 
        title: initialTitle = '', 
        content: initialContent = '', 
        pageName = 'Page',
        onSave = () => {} 
    } = $props<{
        title?: string;
        content?: string;
        pageName?: string;
        onSave?: (data: { title: string; content: string }) => void;
    }>();

    let title = $state(initialTitle);
    let content = $state(initialContent);
    let viewMode = $state<'edit' | 'preview'>('edit');

    function handleSave() {
        onSave({ title, content });
        alert('Changes saved successfully!');
    }
</script>

<div class="space-y-8 max-w-5xl mx-auto pb-12">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" href="/admin/navigation">
                <ArrowLeft class="size-5" />
            </Button>
            <div class="space-y-1">
                <h1 class="text-3xl font-bold tracking-tight">Edit {pageName}</h1>
                <p class="text-sm text-muted-foreground">Modify the content of your {pageName} page.</p>
            </div>
        </div>
        
        <div class="flex items-center gap-3">
            <div class="flex bg-muted p-1 rounded-lg border shadow-sm mr-2">
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
            <Button onclick={handleSave} class="gap-2">
                <Save class="size-4" /> Save Changes
            </Button>
        </div>
    </div>

    <div class="space-y-6">
        {#if viewMode === 'edit'}
            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="title" class="text-sm font-semibold text-foreground/80 ml-1">Page Title</label>
                    <Input id="title" bind:value={title} placeholder="Enter page title..." class="bg-card/50 backdrop-blur-sm text-lg font-medium h-12" />
                </div>
                
                <div class="space-y-2">
                    <label for="content" class="text-sm font-semibold text-foreground/80 ml-1">Content (Markdown)</label>
                    <div class="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
                        <Textarea id="content" bind:value={content} placeholder="Write your page content in Markdown..." class="min-h-[600px] border-0 focus-visible:ring-0 resize-none p-4 leading-relaxed" />
                    </div>
                </div>
            </div>
        {:else}
            <!-- Preview Mode -->
            <div class="rounded-xl border bg-card/30 backdrop-blur-sm p-8 md:p-12 min-h-[700px]">
                <div class="max-w-3xl mx-auto space-y-8">
                    <div class="space-y-4">
                        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8">
                            {title || 'Untitled Page'}
                        </h1>
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
    </div>
</div>
