<script lang="ts">
    import { page } from '$app/stores';
    import { untrack } from 'svelte';
    import { Badge } from '$lib/components/ui/badge';

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
                variant={selectedTag === null ? "default" : "secondary"}
                class="cursor-pointer"
                onclick={() => selectedTag = null}
            >
                All
            </Badge>
            {#each tags as tag}
                <Badge 
                    variant={selectedTag === tag ? "default" : "secondary"}
                    class="cursor-pointer"
                    onclick={() => selectedTag = tag}
                >
                    {tag}
                </Badge>
            {/each}
        </div>
    </div>

    <div class="grid gap-8">
        {#each filteredPosts as post}
            <div class="group flex flex-col gap-2">
                <a href="/blog/{post.id}" class="text-xl font-semibold hover:underline decoration-primary decoration-2 underline-offset-4">
                    {post.title}
                </a>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <time datetime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>
                    <span>•</span>
                    <div class="flex gap-1">
                         {#each post.tags as tag}
                             <Badge variant="secondary" class="rounded-sm px-1 py-0 text-xs font-normal">{tag}</Badge>
                         {/each}
                    </div>
                </div>
                <p class="text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.description ?? ''}
                </p>
            </div>
        {/each}
    </div>

    <div class="flex flex-col items-center gap-3 pt-8 border-t">
        {#if nextCursor !== null}
            <button
                class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
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
