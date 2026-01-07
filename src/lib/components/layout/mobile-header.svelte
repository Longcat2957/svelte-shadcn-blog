<script lang="ts">
    import * as TreeView from '$lib/components/ui/tree-view';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import FileIcon from '@lucide/svelte/icons/file';

    let { open = $bindable(false) } = $props<{ open: boolean }>();

    function navigate(href: string) {
        open = false;
        goto(href);
    }

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
            class="w-full text-left"
            onclick={() => navigate(`/?category=${item.id}`)}
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
                        onclick={() => navigate(`/blog/${p.id}`)}
                        class={$page.url.pathname === `/blog/${p.id}`
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
                        onclick={() => navigate(`/blog/${p.id}`)}
                        class={$page.url.pathname === `/blog/${p.id}`
                            ? 'bg-accent text-accent-foreground'
                            : ''}
                    />
                {/each}
            </div>
        </TreeView.Folder>
    {/each}
{/snippet}

{#if open}
    <div
        class="fixed inset-0 top-14 z-50 overflow-y-auto border-t bg-background/95 p-4 backdrop-blur md:hidden"
    >
        <TreeView.Root class="w-full text-left">
            {#if categories.length > 0}
                {@render renderTreeView(categories)}
            {/if}
        </TreeView.Root>
    </div>
{/if}
