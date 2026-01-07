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

<div class="mx-auto max-w-5xl space-y-8 pb-12">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" href="/admin/navigation">
                <ArrowLeft class="size-5" />
            </Button>
            <div class="space-y-1">
                <h1 class="text-3xl font-bold tracking-tight">Edit {pageName}</h1>
                <p class="text-sm text-muted-foreground">
                    Modify the content of your {pageName} page.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <div class="mr-2 flex rounded-lg border bg-muted p-1 shadow-sm">
                <Button
                    variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                    size="sm"
                    class="h-8 gap-2"
                    onclick={() => (viewMode = 'edit')}
                >
                    <Edit3 class="size-4" /> Edit
                </Button>
                <Button
                    variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                    size="sm"
                    class="h-8 gap-2"
                    onclick={() => (viewMode = 'preview')}
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
                    <label for="title" class="ml-1 text-sm font-semibold text-foreground/80"
                        >Page Title</label
                    >
                    <Input
                        id="title"
                        bind:value={title}
                        placeholder="Enter page title..."
                        class="h-12 bg-card/50 text-lg font-medium backdrop-blur-sm"
                    />
                </div>

                <div class="space-y-2">
                    <label for="content" class="ml-1 text-sm font-semibold text-foreground/80"
                        >Content (Markdown)</label
                    >
                    <div
                        class="overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm transition-all focus-within:ring-1 focus-within:ring-ring"
                    >
                        <Textarea
                            id="content"
                            bind:value={content}
                            placeholder="Write your page content in Markdown..."
                            class="min-h-[600px] resize-none border-0 p-4 leading-relaxed focus-visible:ring-0"
                        />
                    </div>
                </div>
            </div>
        {:else}
            <!-- Preview Mode -->
            <div class="min-h-[700px] rounded-xl border bg-card/30 p-8 backdrop-blur-sm md:p-12">
                <div class="mx-auto max-w-3xl space-y-8">
                    <div class="space-y-4">
                        <h1
                            class="text-4xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8 md:text-5xl"
                        >
                            {title || 'Untitled Page'}
                        </h1>
                    </div>

                    <div class="prose max-w-none dark:prose-invert">
                        {#if content}
                            <div class="leading-relaxed whitespace-pre-wrap text-foreground/90">
                                {content}
                            </div>
                        {:else}
                            <p
                                class="rounded-lg border-2 border-dashed bg-muted/20 py-20 text-center text-muted-foreground italic"
                            >
                                No content to preview. Start writing in the Edit tab!
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
