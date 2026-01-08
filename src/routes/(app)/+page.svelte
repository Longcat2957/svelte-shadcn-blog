<script lang="ts">
    import { page } from '$app/stores';
    import { untrack } from 'svelte';
    import { Badge } from '$lib/components/ui/badge';
    import * as Pagination from '$lib/components/ui/pagination';

    type PostSummary = {
        id: number;
        title: string;
        description: string | null;
        tags: string[];
        createdAt: string;
        updatedAt: string;
        views: number;
        categoryId: number;
    };

    let posts = $state<PostSummary[]>([]);
    let tags = $state<string[]>([]);
    let selectedTag = $state<string | null>(null);
    let selectedCategory = $derived($page.url.searchParams.get('category'));

    type CategoryNode = {
        id: number;
        name: string;
        children: CategoryNode[];
    };

    const categories = $derived(($page.data.categories as CategoryNode[]) ?? []);

    function findCategoryName(nodes: CategoryNode[], id: number): string | null {
        for (const n of nodes) {
            if (n.id === id) return n.name;
            const child = findCategoryName(n.children ?? [], id);
            if (child) return child;
        }
        return null;
    }

    const selectedCategoryId = $derived.by(() => {
        if (!selectedCategory) return null;
        const n = Number(selectedCategory);
        return Number.isFinite(n) ? n : null;
    });

    const selectedCategoryName = $derived.by(() => {
        if (selectedCategoryId === null) return null;
        return findCategoryName(categories, selectedCategoryId);
    });

    // Pagination State
    let currentPage = $state(1);
    let totalCount = $state(0);
    const perPage = 20;

    let loading = $state(false);

    const query = $derived($page.url.searchParams.get('q') ?? '');

    async function loadTags() {
        const res = await fetch('/api/tags');
        if (!res.ok) return;
        const data = (await res.json()) as { items: string[] };
        tags = data.items;
    }

    async function loadPosts() {
        // Allow loading to re-trigger if params changed, but debounce if needed?
        // For now, simple lock.
        if (loading) return;
        loading = true;

        try {
            const url = new URL('/api/posts', window.location.origin);
            url.searchParams.set('limit', String(perPage));
            url.searchParams.set('page', String(currentPage));

            if (selectedTag) url.searchParams.set('tag', selectedTag);
            if (selectedCategoryId !== null) {
                url.searchParams.set('categoryId', String(selectedCategoryId));
            }
            if (query) url.searchParams.set('q', query);

            const res = await fetch(url);
            if (!res.ok) return;

            const data = (await res.json()) as { items: PostSummary[]; totalCount: number };

            posts = data.items;
            totalCount = data.totalCount;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadTags();
    });

    // Reset pagination when filters change
    $effect(() => {
        const _q = query;
        const _t = selectedTag;
        const _c = selectedCategoryId;

        untrack(() => {
            currentPage = 1;
        });
    });

    // Load posts when Page or Filters change
    $effect(() => {
        const _q = query;
        const _t = selectedTag;
        const _c = selectedCategoryId;
        const _p = currentPage; // triggering dependency

        untrack(() => {
            // Need to clear "loading" if it was stuck? No.
            // Reset loader?
            // To allow re-fetch if currently loading but params changed?
            // Ideally we should abort controller, but for simplicity:
            loading = false;
            void loadPosts();
        });
    });

    const filteredPosts = $derived(posts);
</script>

<div class="space-y-8">
    <div class="space-y-6">
        <div class="space-y-2">
            <div class="flex items-baseline justify-between">
                <h1 class="text-3xl font-bold tracking-tight">
                    {selectedCategoryName ?? 'Latest Posts'}
                </h1>
                <span class="text-sm text-muted-foreground">Total {totalCount} posts</span>
            </div>
            {#if selectedCategoryId === null}
                <p class="text-muted-foreground">Thoughts on development, design, and more.</p>
            {/if}
        </div>

        <div class="flex flex-wrap gap-2">
            <Badge
                variant={selectedTag === null ? 'default' : 'secondary'}
                class="cursor-pointer"
                onclick={() => (selectedTag = null)}
            >
                All
            </Badge>
            {#each tags as tag}
                <Badge
                    variant={selectedTag === tag ? 'default' : 'secondary'}
                    class="cursor-pointer"
                    onclick={() => (selectedTag = tag)}
                >
                    {tag}
                </Badge>
            {/each}
        </div>
    </div>

    <div
        class="flex flex-col divide-y divide-border/40 transition-opacity duration-200"
        class:opacity-50={loading}
    >
        {#each filteredPosts as post}
            <a
                href="/blog/{post.id}"
                class="group -mx-4 rounded-lg px-4 py-6 transition-colors outline-none hover:bg-muted/30"
            >
                <article class="flex flex-col gap-2">
                    <div class="flex items-start justify-between gap-4">
                        <h2
                            class="text-xl font-bold tracking-tight transition-colors group-hover:text-primary"
                        >
                            {post.title}
                        </h2>
                        <time
                            datetime={post.createdAt}
                            class="mt-1.5 shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground"
                        >
                            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </time>
                    </div>

                    {#if post.description}
                        <p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {post.description}
                        </p>
                    {/if}

                    <div class="flex items-center gap-3 pt-1">
                        <div class="flex gap-2 text-xs text-muted-foreground">
                            {#each post.tags as tag}
                                <span class="transition-colors hover:text-foreground">#{tag}</span>
                            {/each}
                        </div>
                    </div>
                </article>
            </a>
        {/each}

        {#if filteredPosts.length === 0 && !loading}
            <div class="py-12 text-center text-muted-foreground">No posts found.</div>
        {/if}
    </div>

    <div class="flex flex-col items-center gap-3 border-t pt-8">
        <Pagination.Root count={totalCount} {perPage} bind:page={currentPage}>
            {#snippet children({ pages, currentPage })}
                <Pagination.Content>
                    <Pagination.Item>
                        <Pagination.PrevButton />
                    </Pagination.Item>
                    {#each pages as page (page.key)}
                        {#if page.type === 'ellipsis'}
                            <Pagination.Item>
                                <Pagination.Ellipsis />
                            </Pagination.Item>
                        {:else}
                            <Pagination.Item>
                                <Pagination.Link {page} isActive={currentPage === page.value}>
                                    {page.value}
                                </Pagination.Link>
                            </Pagination.Item>
                        {/if}
                    {/each}

                    <Pagination.Item>
                        <Pagination.NextButton />
                    </Pagination.Item>
                </Pagination.Content>
            {/snippet}
        </Pagination.Root>
    </div>
</div>
