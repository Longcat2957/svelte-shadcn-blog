<script lang="ts" module>
    import { writable } from 'svelte/store';
    export const sidebarOpen = writable(true);
</script>

<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import FileIcon from '@lucide/svelte/icons/file';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import { sidebarOpen as openStore } from './sidebar.svelte';
    import { Button } from '$lib/components/ui/button';

    const currentPage = page;

    type PostPreview = { id: number; title: string };

    interface CategoryNode {
        type: 'category';
        id: number;
        name: string;
        children: CategoryNode[];
        postsPreview?: PostPreview[];
        postsTotal?: number;
    }

    let categories = $derived(($page.data.categories as CategoryNode[]) ?? []);

    type LoadedPostsState = {
        items: PostPreview[];
        nextCursor: number | null;
        loading: boolean;
        error: string | null;
    };

    let loadedPostsByCategoryId = $state<Record<number, LoadedPostsState>>({});

    async function loadMorePosts(categoryId: number) {
        const current = loadedPostsByCategoryId[categoryId] ?? {
            items: [],
            nextCursor: null,
            loading: false,
            error: null
        };
        if (current.loading) return;

        loadedPostsByCategoryId = {
            ...loadedPostsByCategoryId,
            [categoryId]: { ...current, loading: true, error: null }
        };

        const cursorParam = current.nextCursor ? `&cursor=${current.nextCursor}` : '';
        const res = await fetch(`/api/categories/${categoryId}/posts?limit=20${cursorParam}`);
        if (!res.ok) {
            loadedPostsByCategoryId = {
                ...loadedPostsByCategoryId,
                [categoryId]: {
                    ...current,
                    loading: false,
                    error: `${res.status} ${res.statusText}`.trim()
                }
            };
            return;
        }

        const data = (await res.json()) as { items: PostPreview[]; nextCursor: number | null };

        loadedPostsByCategoryId = {
            ...loadedPostsByCategoryId,
            [categoryId]: {
                items: [...current.items, ...data.items],
                nextCursor: data.nextCursor,
                loading: false,
                error: null
            }
        };
    }
</script>

{#snippet renderTreeView(items: CategoryNode[])}
    {#each items as item (item.id)}
        <TreeView.Folder
            name={item.name}
            open={true}
            class="w-full"
            onclick={() => goto(`/?category=${item.id}`)}
        >
            <div class="pl-5">
                {#if item.children?.length}
                    {@render renderTreeView(item.children)}
                {/if}

                {#each item.postsPreview ?? [] as p (p.id)}
                    {#snippet postIcon({ name: _name }: { name: string })}
                        <FileIcon class="size-4" />
                    {/snippet}
                    <TreeView.File
                        name={p.title}
                        icon={postIcon}
                        onclick={() => goto(`/blog/${p.id}`)}
                        class={$currentPage.url.pathname === `/blog/${p.id}`
                            ? 'bg-accent text-accent-foreground'
                            : ''}
                    />
                {/each}

                {#if (item.postsTotal ?? 0) > (item.postsPreview?.length ?? 0) + (loadedPostsByCategoryId[item.id]?.items.length ?? 0)}
                    <TreeView.File
                        name={loadedPostsByCategoryId[item.id]?.loading
                            ? '불러오는 중...'
                            : `더보기 (${(item.postsTotal ?? 0) - ((item.postsPreview?.length ?? 0) + (loadedPostsByCategoryId[item.id]?.items.length ?? 0))})`}
                        onclick={() => loadMorePosts(item.id)}
                        class="text-muted-foreground"
                    />
                {/if}

                {#each loadedPostsByCategoryId[item.id]?.items ?? [] as p (p.id)}
                    {#snippet postIcon2({ name: _name }: { name: string })}
                        <FileIcon class="size-4" />
                    {/snippet}
                    <TreeView.File
                        name={p.title}
                        icon={postIcon2}
                        onclick={() => goto(`/blog/${p.id}`)}
                        class={$currentPage.url.pathname === `/blog/${p.id}`
                            ? 'bg-accent text-accent-foreground'
                            : ''}
                    />
                {/each}
            </div>
        </TreeView.Folder>
    {/each}
{/snippet}

<div class="relative flex h-full flex-col bg-background">
    <!-- Overlay Toggle Button on Border -->
    <div class="absolute top-6 -right-3 z-40 hidden md:block">
        <Button
            variant="outline"
            size="icon"
            class="h-6 w-6 rounded-full border-border/50 bg-background shadow-md transition-all hover:bg-accent"
            onclick={() => openStore.update((v) => !v)}
        >
            {#if $openStore}
                <ChevronLeft class="size-3.5" />
            {:else}
                <ChevronRight class="size-3.5" />
            {/if}
        </Button>
    </div>

    {#if $openStore}
        <aside
            class="sticky top-14 flex hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm md:flex"
        >
            <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                <TreeView.Root class="w-full">
                    {#if categories.length > 0}
                        {@render renderTreeView(categories)}
                    {/if}
                </TreeView.Root>
            </div>

            <div class="flex items-center justify-center border-t p-4">
                <span class="text-xs text-muted-foreground">© 2024 Blog</span>
            </div>
        </aside>
    {:else}
        <!-- Minimized State Border -->
        <div class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-px bg-border/50 md:block"></div>
    {/if}
</div>
