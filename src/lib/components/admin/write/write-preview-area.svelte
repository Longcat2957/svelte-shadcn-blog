<script lang="ts">
    import Folder from '@lucide/svelte/icons/folder';
    import { Badge } from '$lib/components/ui/badge';
    import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
    import type { WriteState } from './write-state.svelte';

    let { state, fullPage = true }: { state: WriteState; fullPage?: boolean } = $props();
</script>

{#if fullPage}
    <div class="min-h-175 rounded-xl border bg-card/30 p-8 backdrop-blur-sm md:p-12">
        <div class="mx-auto max-w-3xl space-y-8">
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-sm font-medium text-primary">
                    <Folder class="size-4" />
                    {state.categoryOptions.find((c) => c.id === state.categoryId)?.label ?? ''}
                </div>
                <h1
                    class="text-4xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8 md:text-5xl"
                >
                    {state.title || 'Untitiled Post'}
                </h1>
                {#if state.description}
                    <p class="text-xl leading-relaxed text-muted-foreground">
                        {state.description}
                    </p>
                {/if}
                <div class="flex flex-wrap gap-2 py-2">
                    {#each state.tags as tag}
                        <Badge variant="outline">{tag}</Badge>
                    {/each}
                </div>
                <div class="text-sm text-muted-foreground">Written on January 6, 2026</div>
            </div>

            {#if state.content}
                <MarkdownRenderer class="prose max-w-none dark:prose-invert" md={state.content} />
            {:else}
                <p
                    class="rounded-lg border-2 border-dashed bg-muted/20 py-20 text-center text-muted-foreground italic"
                >
                    No content to preview. Start writing in the Edit tab!
                </p>
            {/if}
        </div>
    </div>
{:else}
    <!-- Split View Preview (simplified wrapper) -->
    <div class="space-y-4 pr-4">
        <h1 class="border-b pb-4 text-3xl font-bold">{state.title || 'Untitled'}</h1>
        {#if state.content}
            <MarkdownRenderer class="prose max-w-none dark:prose-invert" md={state.content} />
        {:else}
            <p class="text-muted-foreground italic">No content to preview.</p>
        {/if}
    </div>
{/if}
