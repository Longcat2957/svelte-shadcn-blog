<script lang="ts">
    type Item = {
        value: string;
        label: string;
    };

    let {
        items,
        value = $bindable(),
        class: className
    }: {
        items: Item[];
        value: string;
        class?: string;
    } = $props();

    function isActive(itemValue: string) {
        return value === itemValue;
    }
</script>

<div class={`flex rounded-lg border bg-muted p-1 ${className ?? ''}`.trim()}>
    {#each items as item (item.value)}
        <button
            type="button"
            class={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                isActive(item.value)
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
            onclick={() => (value = item.value)}
        >
            {item.label}
        </button>
    {/each}
</div>

