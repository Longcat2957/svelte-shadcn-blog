<script lang="ts">
    import FileIcon from '@lucide/svelte/icons/file';
    import { cn } from '$lib/utils.js';
    import type { TreeViewFileProps } from './types';

    let { name, icon, type = 'button', class: className, ...rest }: TreeViewFileProps = $props();
</script>

<button
    {type}
    class={cn('flex w-full min-w-0 place-items-center gap-1 py-1 pl-[2px] text-left', className)}
    {...rest}
>
    {#if icon}
        {@render icon({ name })}
    {:else}
        <FileIcon class="size-4" />
    {/if}
    <span class="min-w-0 flex-1 truncate" title={name}>{name}</span>
</button>
