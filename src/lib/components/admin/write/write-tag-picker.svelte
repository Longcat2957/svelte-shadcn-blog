<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import X from '@lucide/svelte/icons/x';
    import Plus from '@lucide/svelte/icons/plus';
    import ChevronUp from '@lucide/svelte/icons/chevron-up';
    import type { WriteState } from './write-state.svelte';

    let { state }: { state: WriteState } = $props();
</script>

<div class="space-y-2">
    <label for="tags" class="ml-1 text-sm font-semibold text-foreground/80">Tags</label>

    {#if state.tags.length > 0}
        <div class="flex flex-wrap gap-2">
            {#each state.tags as tag}
                <Badge variant="secondary" class="gap-1 pr-1">
                    {tag}
                    <button
                        onclick={() => state.removeTag(tag)}
                        class="transition-colors outline-none hover:text-destructive"
                    >
                        <X class="size-3" />
                    </button>
                </Badge>
            {/each}
        </div>
    {/if}

    <div class="flex gap-2">
        <Input
            id="tags"
            placeholder="Add a tag..."
            bind:value={state.tagInput}
            class="bg-card/50 backdrop-blur-sm"
            onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), state.addTag())}
        />
        <Button variant="outline" onclick={() => state.addTag()}>Add</Button>
    </div>

    {#if state.allTags.length > 0}
        <div class="flex flex-wrap gap-1">
            {#each state.favoriteTags as tagItem}
                <Button
                    size="sm"
                    variant={state.tags.includes(tagItem.name) ? 'default' : 'outline'}
                    class="h-6 px-2 text-xs"
                    onclick={() => state.toggleTag(tagItem.name)}
                >
                    {tagItem.name}
                </Button>
            {/each}

            {#if state.remainingTags.length > 0}
                <Button
                    size="sm"
                    variant="ghost"
                    class="h-6 px-2 text-xs"
                    onclick={() => (state.tagExpanded = !state.tagExpanded)}
                >
                    {#if state.tagExpanded}
                        <ChevronUp class="size-3" />
                        접기
                    {:else}
                        <Plus class="size-3" />
                        더보기 ({state.remainingTags.length})
                    {/if}
                </Button>
            {/if}
        </div>

        {#if state.tagExpanded && state.remainingTags.length > 0}
            <div class="flex flex-wrap gap-1">
                {#each state.remainingTags as tagItem}
                    <Button
                        size="sm"
                        variant={state.tags.includes(tagItem.name) ? 'default' : 'outline'}
                        class="h-6 px-2 text-xs"
                        onclick={() => state.toggleTag(tagItem.name)}
                    >
                        {tagItem.name}
                    </Button>
                {/each}
            </div>
        {/if}
    {/if}
</div>
