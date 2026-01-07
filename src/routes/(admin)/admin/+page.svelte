<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import Plus from '@lucide/svelte/icons/plus';
    import { untrack } from 'svelte';

    type DashboardStats = {
        postsTotal: number;
        publishedTotal: number;
        draftTotal: number;
        viewsTotal: number;
    };

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

    let stats = $state<DashboardStats | null>(null);
    let posts = $state<PostItem[]>([]);
    let filter = $state<'all' | 'published' | 'draft'>('all');
    let nextCursor = $state<number | null>(null);
    let loading = $state(false);

    const statCards = $derived(
        stats
            ? [
                    { label: 'Total Posts', value: stats.postsTotal },
                    { label: 'Published', value: stats.publishedTotal },
                    { label: 'Drafts', value: stats.draftTotal }
                ]
            : []
    );

    async function loadDashboard() {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) return;
        const data = (await res.json()) as { stats: DashboardStats };
        stats = data.stats;
    }

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

            const res = await fetch(url);
            if (!res.ok) return;
            const data = (await res.json()) as { items: PostItem[]; nextCursor: number | null };
            
            posts = reset ? data.items : [...posts, ...data.items];
            nextCursor = data.nextCursor;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadDashboard();
    });

    $effect(() => {
        const _f = filter;
        untrack(() => {
            loadPosts(true);
        });
    });
</script>

<div class="space-y-8 pb-12">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button href="/admin/write">
            <Plus class="mr-2 h-4 w-4" /> New Post
        </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-3">
        {#each statCards as stat}
            <div class="rounded-xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm p-6 transition-all hover:bg-card">
                <div class="flex flex-col space-y-1.5">
                    <h3 class="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                </div>
                <div class="p-0 pt-2">
                    <div class="text-2xl font-bold tracking-tight">{stat.value}</div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Post Filter -->
    <div class="space-y-6 pt-4">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold tracking-tight">Posts</h2>
            <div class="flex p-1 bg-muted rounded-lg border">
                <button 
                    class="px-3 py-1 text-sm font-medium rounded-md transition-colors {filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
                    onclick={() => filter = 'all'}
                >
                    All
                </button>
                <button 
                    class="px-3 py-1 text-sm font-medium rounded-md transition-colors {filter === 'published' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
                    onclick={() => filter = 'published'}
                >
                    Published
                </button>
                <button 
                    class="px-3 py-1 text-sm font-medium rounded-md transition-colors {filter === 'draft' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
                    onclick={() => filter = 'draft'}
                >
                    Drafts
                </button>
            </div>
        </div>

        <!-- Post List -->
        <div class="flex flex-col divide-y divide-border/40 bg-card/30 backdrop-blur-sm rounded-xl border">
            {#each posts as post}
                <div class="group flex items-center justify-between py-5 px-6 hover:bg-muted/30 transition-colors first:rounded-t-xl last:rounded-b-xl">
                    <div class="flex flex-col gap-1 min-w-0 pr-4">
                        <div class="flex items-center gap-3">
                            <span class="font-bold tracking-tight text-lg truncate group-hover:text-primary transition-colors">
                                {post.title}
                            </span>
                            {#if !post.published}
                                <Badge variant="secondary" class="text-[10px] h-5 px-1.5 shrink-0">Draft</Badge>
                            {/if}
                        </div>
                        
                        <div class="flex items-center gap-3 text-xs text-muted-foreground">
                            <time class="font-mono">
                                {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </time>
                            {#if post.tags.length > 0}
                                <span class="w-[1px] h-3 bg-border"></span>
                                <div class="flex gap-2">
                                    {#each post.tags as tag}
                                        <span>#{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <Button variant="outline" size="sm" class="h-8 shrink-0" href={`/admin/write?id=${post.id}`}>
                        Edit
                    </Button>
                </div>
            {:else}
                <div class="py-12 text-center text-muted-foreground text-sm">
                    No posts found.
                </div>
            {/each}
        </div>

        <!-- Pagination -->
        {#if nextCursor !== null}
            <div class="flex justify-center pt-2">
                <Button variant="outline" onclick={() => loadPosts(false)} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </Button>
            </div>
        {/if}
    </div>
</div>
