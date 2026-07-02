<script lang="ts" module>
    import { writable } from 'svelte/store';
    export const sidebarOpen = writable(true);
</script>

<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import FileIcon from '@lucide/svelte/icons/file';
    import FolderIcon from '@lucide/svelte/icons/folder';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import Github from '@lucide/svelte/icons/github';
    import Twitter from '@lucide/svelte/icons/twitter';
    import { sidebarOpen as openStore } from './sidebar.svelte';
    import { Button } from '$lib/components/ui/button';
    import { env } from '$env/dynamic/public';

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
        {@const isEmptyCategory =
            (item.children?.length ?? 0) === 0 && (item.postsTotal ?? 0) === 0}

        {#if isEmptyCategory}
            {#snippet categoryIcon()}
                <FolderIcon class="size-4" />
            {/snippet}

            <!-- 글이 0개인 카테고리는 접기/펼치기 UI를 제공하지 않고, 이동만 가능하게 한다 -->
            <TreeView.File
                name={item.name}
                icon={categoryIcon}
                onclick={() => goto(resolve(`/?category=${item.id}` as '/'))}
                class="pl-0"
            />
        {:else}
            <TreeView.Folder
                name={item.name}
                open={true}
                class="w-full"
                onclick={() => goto(resolve(`/?category=${item.id}` as '/'))}
            >
                <div class="pl-5">
                    {#if item.children?.length}
                        {@render renderTreeView(item.children)}
                    {/if}

                    {#each item.postsPreview ?? [] as p (p.id)}
                        {#snippet postIcon()}
                            <FileIcon class="size-4" />
                        {/snippet}
                        <TreeView.File
                            name={p.title}
                            icon={postIcon}
                            onclick={() => goto(resolve('/(app)/blog/[id]', { id: String(p.id) }))}
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
                        {#snippet postIcon2()}
                            <FileIcon class="size-4" />
                        {/snippet}
                        <TreeView.File
                            name={p.title}
                            icon={postIcon2}
                            onclick={() => goto(resolve('/(app)/blog/[id]', { id: String(p.id) }))}
                            class={$currentPage.url.pathname === `/blog/${p.id}`
                                ? 'bg-accent text-accent-foreground'
                                : ''}
                        />
                    {/each}
                </div>
            </TreeView.Folder>
        {/if}
    {/each}
{/snippet}

<div class="sticky top-14 z-40 hidden h-[calc(100vh-3.5rem)] flex-col md:flex">
    <!-- Toggle Button - always visible on the separator line -->
    {#if $openStore}
        <div class="absolute top-6 -right-3 z-50">
            <Button
                variant="outline"
                size="icon"
                class="h-6 w-6 rounded-full border-border/50 bg-background shadow-md transition-all hover:bg-accent"
                onclick={() => openStore.update((v) => !v)}
            >
                <ChevronLeft class="size-3.5" />
            </Button>
        </div>
    {:else}
        <div class="absolute top-6 left-0 z-50 -translate-x-1/2">
            <Button
                variant="outline"
                size="icon"
                class="h-6 w-6 rounded-full border-border/50 bg-background shadow-md transition-all hover:bg-accent"
                onclick={() => openStore.update((v) => !v)}
            >
                <ChevronRight class="size-3.5" />
            </Button>
        </div>
    {/if}

    {#if $openStore}
        <aside
            class="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border/50 bg-background/50 backdrop-blur-sm"
        >
            <div class="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-6">
                <TreeView.Root class="w-full min-w-0">
                    {#if categories.length > 0}
                        {@render renderTreeView(categories)}
                    {/if}
                </TreeView.Root>
            </div>

            <div class="border-t p-4">
                <div class="mb-2 flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" href={env.PUBLIC_GITHUB_URL}>
                        <Github class="size-4" />
                        <span class="sr-only">GitHub</span>
                    </Button>
                    <Button variant="ghost" size="icon" href={env.PUBLIC_TWITTER_URL}>
                        <Twitter class="size-4" />
                        <span class="sr-only">Twitter</span>
                    </Button>
                </div>
                <div class="flex items-center justify-center">
                    <span class="text-xs text-muted-foreground">© 2026 Blog</span>
                </div>
            </div>
        </aside>
    {:else}
        <!-- Minimized State Border -->
        <div class="h-full w-px bg-border/50"></div>
    {/if}
</div>
