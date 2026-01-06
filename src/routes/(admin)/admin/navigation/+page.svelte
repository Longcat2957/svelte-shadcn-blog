<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import GripVertical from '@lucide/svelte/icons/grip-vertical';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import Plus from '@lucide/svelte/icons/plus';

    let navItems = $state([
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/' }
    ]);

    function addItem() {
        navItems = [...navItems, { label: 'New Link', href: '#' }];
    }

    function removeItem(index: number) {
        navItems = navItems.filter((_, i) => i !== index);
    }
</script>

<div class="space-y-8 max-w-2xl mx-auto pb-12">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">Navigation Settings</h1>
            <p class="text-sm text-muted-foreground">Manage the links in your top navigation bar.</p>
        </div>
        <Button onclick={addItem}>
            <Plus class="size-4 mr-2" />
            Add Item
        </Button>
    </div>

    <div class="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div class="p-6 space-y-4">
            {#each navItems as item, i}
                <div class="flex items-center gap-4 p-3 rounded-lg border bg-background/50 transition-all hover:border-primary/50">
                    <GripVertical class="size-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <div class="grid flex-1 grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Label</label>
                            <Input bind:value={item.label} class="h-9" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL Path</label>
                            <Input bind:value={item.href} class="h-9" />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" class="text-destructive hover:bg-destructive/10" onclick={() => removeItem(i)}>
                        <Trash2 class="size-4" />
                    </Button>
                </div>
            {/each}
        </div>
        
        <div class="p-6 bg-muted/30 border-t flex justify-between items-center">
            <p class="text-xs text-muted-foreground">Drag items to reorder (Visual representation only in mock)</p>
            <Button size="sm">Save Configuration</Button>
        </div>
    </div>
</div>
