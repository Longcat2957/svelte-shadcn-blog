<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Input } from '$lib/components/ui/input';
    import Plus from '@lucide/svelte/icons/plus';
    import Search from '@lucide/svelte/icons/search';
    import X from '@lucide/svelte/icons/x';
    import { untrack } from 'svelte';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import SegmentedToggle from '$lib/components/admin/segmented-toggle.svelte';

    type PostItem = {
        id: number;
        title: string;
        description: string | null;
        published: boolean;
        createdAt: string;
        updatedAt: string;
        categoryId: number;
        tags: string[];
    };

    let posts = $state<PostItem[]>([]);
    let filter = $state<'all' | 'published' | 'draft'>('all');
    let searchQuery = $state('');
    let tagFilter = $state('');
    let nextCursor = $state<number | null>(null);
    let loading = $state(false);
    let errorMessage = $state<string | null>(null);

    async function loadPosts(reset: boolean) {
        if (loading) return;
        loading = true;
        try {
            const url = new URL('/api/admin/posts', window.location.origin);
            url.searchParams.set('limit', '20');

            if (!reset && nextCursor) {
                url.searchParams.set('cursor', String(nextCursor));
            }

            if (filter === 'published') url.searchParams.set('published', 'true');
            if (filter === 'draft') url.searchParams.set('published', 'false');

            const q = searchQuery.trim();
            if (q) url.searchParams.set('q', q);

            const t = tagFilter.trim();
            if (t) url.searchParams.set('tag', t);

            const res = await fetch(url);
            if (!res.ok) {
                errorMessage = await readErrorMessage(res);
                return;
            }
            const data = (await res.json()) as { items: PostItem[]; nextCursor: number | null };

            posts = reset ? data.items : [...posts, ...data.items];
            nextCursor = data.nextCursor;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const _f = filter;
        untrack(() => {
            loadPosts(true);
        });
    });
</script>

<div class="space-y-6 pb-12">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Posts</h1>
        <Button href="/admin/write">
            <Plus class="mr-2 h-4 w-4" /> New Post
        </Button>
    </div>

    {#if errorMessage}
        <Alert.Root variant="destructive" class="flex items-start justify-between gap-4">
            <div>
                <Alert.Title>요청이 처리되지 않았습니다</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </div>
            <Button
                variant="ghost"
                size="sm"
                class="shrink-0"
                onclick={() => (errorMessage = null)}
            >
                닫기
            </Button>
        </Alert.Root>
    {/if}

    <div class="flex items-center justify-between">
        <SegmentedToggle
            bind:value={filter}
            items={[
                { value: 'all', label: 'All' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Drafts' }
            ]}
        />
    </div>

    <div class="grid gap-4 md:grid-cols-[1fr_200px_auto]">
        <div class="relative">
            <Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search posts..."
                class="pl-9"
                bind:value={searchQuery}
                onkeydown={(e) => {
                    if (e.key === 'Enter') loadPosts(true);
                }}
            />
        </div>
        <div class="relative">
            <Input
                placeholder="Filter by tag..."
                bind:value={tagFilter}
                onkeydown={(e) => {
                    if (e.key === 'Enter') loadPosts(true);
                }}
            />
            {#if tagFilter}
                <button
                    onclick={() => {
                        tagFilter = '';
                        loadPosts(true);
                    }}
                    class="absolute top-2.5 right-2 text-muted-foreground hover:text-foreground"
                >
                    <X class="h-4 w-4" />
                </button>
            {/if}
        </div>
        <Button variant="secondary" onclick={() => loadPosts(true)} disabled={loading}>
            Search
        </Button>
    </div>

    <!-- Post List -->
    <div
        class="flex flex-col divide-y divide-border/40 rounded-xl border bg-card/30 backdrop-blur-sm"
    >
        {#each posts as post}
            <div
                class="group flex items-center justify-between px-6 py-5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/30"
            >
                <div class="flex min-w-0 flex-col gap-1 pr-4">
                    <div class="flex items-center gap-3">
                        <span
                            class="truncate text-lg font-bold tracking-tight transition-colors group-hover:text-primary"
                        >
                            {post.title}
                        </span>
                        {#if !post.published}
                            <Badge variant="secondary" class="h-5 shrink-0 px-1.5 text-[10px]"
                                >Draft</Badge
                            >
                        {/if}
                    </div>

                    <div class="flex items-center gap-3 text-xs text-muted-foreground">
                        <time class="font-mono">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </time>
                        {#if post.tags.length > 0}
                            <span class="h-3 w-px bg-border"></span>
                            <div class="flex gap-2">
                                {#each post.tags as tag}
                                    <button
                                        class="hover:text-primary hover:underline"
                                        onclick={() => {
                                            tagFilter = tag;
                                            loadPosts(true);
                                        }}
                                    >
                                        #{tag}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    class="h-8 shrink-0"
                    href={`/admin/write?id=${post.id}`}
                >
                    Edit
                </Button>
            </div>
        {:else}
            <div class="py-12 text-center text-sm text-muted-foreground">No posts found.</div>
        {/each}
    </div>

    {#if nextCursor !== null}
        <div class="flex justify-center pt-2">
            <Button variant="outline" onclick={() => loadPosts(false)} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
            </Button>
        </div>
    {/if}
</div>
