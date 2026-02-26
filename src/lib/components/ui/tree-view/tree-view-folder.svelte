<script lang="ts">
    import * as Collapsible from '$lib/components/ui/collapsible/index.js';
    import FolderIcon from '@lucide/svelte/icons/folder';
    import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import { cn } from '$lib/utils.js';
    import type { TreeViewFolderProps } from './types';

    let {
        name,
        open = $bindable(true),
        class: className,
        onclick,
        icon,
        children
    }: TreeViewFolderProps = $props();
</script>

<Collapsible.Root bind:open>
    <div class={cn('flex w-full min-w-0 place-items-center gap-1 py-1', className)}>
        <Collapsible.Trigger class="flex items-center gap-1 text-left">
            {#if open}
                <ChevronDownIcon class="size-4 shrink-0 text-muted-foreground" />
            {:else}
                <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
            {/if}
            {#if icon}
                {@render icon({ name, open })}
            {:else if open}
                <FolderOpenIcon class="size-4 shrink-0" />
            {:else}
                <FolderIcon class="size-4 shrink-0" />
            {/if}
        </Collapsible.Trigger>
        <span class="min-w-0 flex-1 cursor-pointer truncate hover:underline" title={name} {onclick}
            >{name}</span
        >
    </div>
    <Collapsible.Content class="ml-1 min-w-0 border-l">
        <div class="relative flex place-items-start">
            <div class="mx-1 h-full w-px bg-border"></div>
            <div class="flex w-full min-w-0 flex-col gap-1">
                {@render children?.()}
            </div>
        </div>
    </Collapsible.Content>
</Collapsible.Root>
