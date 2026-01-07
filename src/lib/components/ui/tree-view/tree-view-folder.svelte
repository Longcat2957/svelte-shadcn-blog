<script lang="ts">
    import * as Collapsible from '$lib/components/ui/collapsible/index.js';
    import FolderIcon from '@lucide/svelte/icons/folder';
    import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
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
    <Collapsible.Trigger class={cn('flex place-items-center gap-1 py-1', className)} {onclick}>
        {#if icon}
            {@render icon({ name, open })}
        {:else if open}
            <FolderOpenIcon class="size-4" />
        {:else}
            <FolderIcon class="size-4" />
        {/if}
        <span>{name}</span>
    </Collapsible.Trigger>
    <Collapsible.Content class="ml-1 border-l">
        <div class="relative flex place-items-start">
            <div class="mx-1 h-full w-px bg-border"></div>
            <div class="flex flex-col gap-1">
                {@render children?.()}
            </div>
        </div>
    </Collapsible.Content>
</Collapsible.Root>
