<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import Search from "@lucide/svelte/icons/search";
    import { cn } from "$lib/utils";
    import { goto } from "$app/navigation";

    let { class: className, placeholder = "Search...", expandable = false } = $props<{ 
        class?: string;
        placeholder?: string;
        expandable?: boolean;
    }>();

    let searchQuery = $state("");
    let isFocused = $state(false);

    function handleSearch(e: SubmitEvent) {
        e.preventDefault();
        if (searchQuery.trim()) {
            void goto(`/?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    }
</script>

<form 
    onsubmit={handleSearch} 
    class={cn(
        "relative transition-all duration-300 ease-in-out",
        expandable ? (isFocused || searchQuery ? "w-64" : "w-32") : "w-full max-w-sm",
        className
    )}
>
    <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
        type="search"
        placeholder={placeholder}
        class="pl-8"
        bind:value={searchQuery}
        onfocus={() => isFocused = true}
        onblur={() => isFocused = false}
    />
</form>
