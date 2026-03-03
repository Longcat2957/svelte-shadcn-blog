<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import SegmentedToggle from '$lib/components/admin/segmented-toggle.svelte';
    import MessageSquareMore from '@lucide/svelte/icons/message-square-more';
    import TodayIcon from '@lucide/svelte/icons/calendar';
    import WeekIcon from '@lucide/svelte/icons/calendar-days';
    import Lock from '@lucide/svelte/icons/lock';
    import ExternalLink from '@lucide/svelte/icons/external-link';
    import { untrack } from 'svelte';

    type CommentItem = {
        id: number;
        postId: number;
        parentId: number | null;
        authorName: string;
        content: string;
        isSecret: boolean;
        createdAt: Date;
        postTitle: string | null;
    };

    type CommentStats = {
        total: number;
        today: number;
        week: number;
    };

    let comments = $state<CommentItem[]>([]);
    let stats = $state<CommentStats | null>(null);
    let filter = $state<'all' | 'today' | 'week'>('all');
    let nextCursor = $state<number | null>(null);
    let loading = $state(false);
    let errorMessage = $state<string | null>(null);

    async function loadStats() {
        try {
            const res = await fetch('/api/admin/comments/stats');
            if (!res.ok) return;
            stats = await res.json();
        } catch {
            // ignore
        }
    }

    async function loadComments(reset: boolean) {
        if (loading) return;
        loading = true;
        try {
            const url = new URL('/api/admin/comments', window.location.origin);
            url.searchParams.set('limit', '20');

            if (!reset && nextCursor) {
                url.searchParams.set('cursor', String(nextCursor));
            }

            if (filter !== 'all') {
                url.searchParams.set('filter', filter);
            }

            const res = await fetch(url);
            if (!res.ok) {
                errorMessage = await readErrorMessage(res);
                return;
            }
            const data = (await res.json()) as { items: CommentItem[]; nextCursor: number | null };

            const normalizedItems = data.items.map((item) => ({
                ...item,
                createdAt: new Date(item.createdAt)
            }));

            comments = reset ? normalizedItems : [...comments, ...normalizedItems];
            nextCursor = data.nextCursor;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadStats();
    });

    $effect(() => {
        const _f = filter;
        untrack(() => {
            loadComments(true);
        });
    });

    function formatDate(date: Date): string {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function truncate(text: string, max: number): string {
        if (text.length <= max) return text;
        return text.slice(0, max) + '...';
    }

    const statItems = $derived(
        stats
            ? [
                  { label: 'Total', value: stats.total, icon: MessageSquareMore },
                  { label: 'Today', value: stats.today, icon: TodayIcon },
                  { label: 'This Week', value: stats.week, icon: WeekIcon }
              ]
            : []
    );
</script>

<div class="space-y-6 pb-12">
    <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Comments</h1>

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

    <!-- Stats -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {#each statItems as stat, i}
            {@const Icon = stat.icon}
            {#if i > 0}<span class="text-border">•</span>{/if}
            <div class="flex items-center gap-1.5">
                <Icon class="h-4 w-4 text-muted-foreground" />
                <span class="text-muted-foreground">{stat.label}</span>
                <span class="font-bold">{stat.value}</span>
            </div>
        {/each}
    </div>

    <hr class="border-border" />

    <!-- Filter -->
    <div class="flex items-center justify-between">
        <SegmentedToggle
            bind:value={filter}
            items={[
                { value: 'all', label: 'All' },
                { value: 'week', label: 'This Week' },
                { value: 'today', label: 'Today' }
            ]}
        />
    </div>

    <!-- Comment List -->
    <div
        class="flex flex-col divide-y divide-border/40 rounded-xl border bg-card/30 backdrop-blur-sm"
    >
        {#each comments as comment}
            <div
                class="group flex flex-col gap-3 px-4 py-4 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
            >
                <div class="flex min-w-0 flex-col gap-2">
                    <div class="flex items-start gap-3">
                        <Avatar.Root class="h-8 w-8 shrink-0 border">
                            <Avatar.Fallback class="bg-muted text-[10px] text-muted-foreground">
                                {comment.authorName[0]}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div class="flex min-w-0 flex-col gap-0.5">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="text-sm font-semibold">{comment.authorName}</span>
                                {#if comment.isSecret}
                                    <Badge variant="secondary" class="h-5 px-1.5 text-[10px]">
                                        <Lock class="mr-1 h-3 w-3" />비밀
                                    </Badge>
                                {/if}
                                {#if comment.parentId}
                                    <Badge variant="outline" class="h-5 px-1.5 text-[10px]">
                                        답글
                                    </Badge>
                                {/if}
                            </div>
                            <p class="text-sm text-muted-foreground">
                                {truncate(comment.content, 60)}
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3">
                        <time class="font-mono">
                            {formatDate(comment.createdAt)}
                        </time>
                        {#if comment.postTitle}
                            <span class="hidden h-3 w-px bg-border sm:block"></span>
                            <span class="truncate">{comment.postTitle}</span>
                        {/if}
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    class="h-8 w-full shrink-0 sm:w-auto"
                    href="/blog/{comment.postId}#comment-{comment.id}"
                    target="_blank"
                >
                    <ExternalLink class="h-4 w-4" />
                </Button>
            </div>
        {:else}
            <div class="py-12 text-center text-sm text-muted-foreground">No comments found.</div>
        {/each}
    </div>

    {#if nextCursor !== null}
        <div class="flex justify-center pt-2">
            <Button variant="outline" onclick={() => loadComments(false)} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
            </Button>
        </div>
    {/if}
</div>