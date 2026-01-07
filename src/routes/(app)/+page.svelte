<script lang="ts">
    import { page } from '$app/stores';
    import { untrack } from 'svelte';
    import { Badge } from '$lib/components/ui/badge';
    import Calendar from '@lucide/svelte/icons/calendar';

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
    let nextCursor = $state<number | null>(null);
    let loading = $state(false);

    const query = $derived($page.url.searchParams.get('q') ?? '');

    async function loadTags() {
        const res = await fetch('/api/tags');
        if (!res.ok) return;
        const data = (await res.json()) as { items: string[] };
        tags = data.items;
    }

    async function loadPosts(reset: boolean) {
        if (loading) return;
        loading = true;

        try {
            const url = new URL('/api/posts', window.location.origin);
            url.searchParams.set('limit', '20');
            const cursor = reset ? null : nextCursor;
            if (cursor) url.searchParams.set('cursor', String(cursor));
            if (selectedTag) url.searchParams.set('tag', selectedTag);
            if (selectedCategory) url.searchParams.set('categoryId', selectedCategory);
            if (query) url.searchParams.set('q', query);

            const res = await fetch(url);
            if (!res.ok) return;
            const data = (await res.json()) as { items: PostSummary[]; nextCursor: number | null };

            posts = reset ? data.items : [...posts, ...data.items];
            nextCursor = data.nextCursor;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadTags();
    });

    $effect(() => {
        // 태그 또는 카테고리 또는 쿼리 변경 시 재조회
        const _q = query;
        const _t = selectedTag;
        const _c = selectedCategory;

        untrack(() => {
            posts = [];
            nextCursor = null;
            void loadPosts(true);
        });
    });

    const filteredPosts = $derived(posts);
</script>

<div class="space-y-8">
    <div class="space-y-6">
        <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">Latest Posts</h1>
            <p class="text-muted-foreground">Thoughts on development, design, and more.</p>
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

    <div class="flex flex-col divide-y divide-border/40">
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
    </div>

    <div class="flex flex-col items-center gap-3 border-t pt-8">
        {#if nextCursor !== null}
            <button
                class="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
                disabled={loading}
                onclick={() => loadPosts(false)}
            >
                {loading ? 'Loading…' : 'Load more'}
            </button>
        {:else}
            <p class="text-xs text-muted-foreground">더 이상 게시글이 없습니다.</p>
        {/if}
    </div>
</div>
