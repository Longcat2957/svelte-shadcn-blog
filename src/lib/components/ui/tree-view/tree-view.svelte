<script lang="ts">
    import { cn } from '$lib/utils.js';
    import type { TreeViewRootProps } from './types';

    let { children, class: className }: TreeViewRootProps = $props();
</script>

<div class={cn('flex w-full min-w-0 flex-col', className)}>
    {@render children?.()}
</div>
