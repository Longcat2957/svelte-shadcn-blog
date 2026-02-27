<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import Folder from '@lucide/svelte/icons/folder';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Spinner } from '$lib/components/ui/spinner';
    import type { WriteState } from './write-state.svelte';

    let { state, isSplit = false }: { state: WriteState; isSplit?: boolean } = $props();
</script>

<div class="grid gap-6 {isSplit ? 'md:grid-cols-1' : 'md:grid-cols-2'}">
    <div class="space-y-2">
        <label for="title" class="ml-1 text-sm font-semibold text-foreground/80">Title</label>
        <Input
            id="title"
            placeholder="Enter a catchy title..."
            bind:value={state.title}
            class="bg-card/50 backdrop-blur-sm"
        />
    </div>

    <div class="space-y-2">
        <div class="ml-1 flex items-center gap-2">
            <label for="description" class="text-sm font-semibold text-foreground/80"
                >Description</label
            >
            <Button
                variant="ghost"
                size="sm"
                class="h-5 px-2 text-xs"
                onclick={() => state.generateDescription()}
                disabled={!state.content.trim() || state.isGeneratingDescription}
            >
                {#if state.isGeneratingDescription}
                    <Spinner class="mr-1 size-3" />
                {:else}
                    <Sparkles class="mr-1 size-3" />
                {/if}
                자동 요약
            </Button>
        </div>
        <Input
            id="description"
            placeholder="Short summary of the post..."
            bind:value={state.description}
            class="bg-card/50 backdrop-blur-sm"
        />
    </div>

    <div class="space-y-2">
        <label for="directory" class="ml-1 text-sm font-semibold text-foreground/80"
            >Category</label
        >
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Button
                        {...props}
                        variant="outline"
                        class="w-full justify-between bg-card/50 font-normal backdrop-blur-sm"
                    >
                        <div class="flex items-center gap-2">
                            <Folder class="size-4 text-muted-foreground" />
                            <span>
                                {state.categoryOptions.find((c) => c.id === state.categoryId)
                                    ?.label ?? 'Select category...'}
                            </span>
                        </div>
                        <ChevronDown class="size-4 opacity-50" />
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                class="max-h-64 w-[--bits-dropdown-menu-anchor-width] overflow-y-auto"
            >
                {#each state.categoryOptions as c}
                    <DropdownMenu.Item onclick={() => (state.categoryId = c.id)}>
                        {c.label}
                    </DropdownMenu.Item>
                {/each}
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="text-muted-foreground" disabled>
                    카테고리 생성/관리는 Categories 메뉴에서 진행하세요.
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>
</div>
