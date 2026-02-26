<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Badge } from '$lib/components/ui/badge';
    import { Input } from '$lib/components/ui/input';
    import * as Chart from '$lib/components/ui/chart';
    import DateRangePicker from '$lib/components/ui/date-range-picker.svelte';
    import { Area, AreaChart, ChartClipPath } from 'layerchart';
    import { scaleBand } from 'd3-scale';
    import { curveMonotoneX } from 'd3-shape';
    import { cubicInOut } from 'svelte/easing';
    import Plus from '@lucide/svelte/icons/plus';
    import Search from '@lucide/svelte/icons/search';
    import X from '@lucide/svelte/icons/x';
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
    import FileText from '@lucide/svelte/icons/file-text';
    import CheckCircle from '@lucide/svelte/icons/check-circle';
    import Edit from '@lucide/svelte/icons/edit';
    import { untrack } from 'svelte';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import SegmentedToggle from '$lib/components/admin/segmented-toggle.svelte';
    import { CalendarDate, type DateValue } from '@internationalized/date';

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
    let viewsChart = $state<{ date: string; views: number }[]>([]);
    let posts = $state<PostItem[]>([]);
    let filter = $state<'all' | 'published' | 'draft'>('all');
    let searchQuery = $state('');
    let tagFilter = $state('');
    let nextCursor = $state<number | null>(null);
    let loading = $state(false);
    let errorMessage = $state<string | null>(null);

    // Date range picker state - 초기값 상수로 저장
    const today = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 14);

    const initialDateRange = {
        start: new CalendarDate(
            fifteenDaysAgo.getFullYear(),
            fifteenDaysAgo.getMonth() + 1,
            fifteenDaysAgo.getDate()
        ),
        end: new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
    };

    let dateRange = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({
        ...initialDateRange
    });

    function resetDateRange() {
        dateRange = { ...initialDateRange };
    }

    const statCards = $derived(
        stats
            ? [
                  { label: 'Total Posts', value: stats.postsTotal, icon: FileText },
                  { label: 'Published', value: stats.publishedTotal, icon: CheckCircle },
                  { label: 'Drafts', value: stats.draftTotal, icon: Edit }
              ]
            : []
    );

    const chartConfig = {
        views: { label: '조회수', color: 'var(--chart-1)' }
    } satisfies Chart.ChartConfig;

    // 차트 요약 정보 계산
    const totalViews = $derived(viewsChart.reduce((sum, d) => sum + d.views, 0));
    const avgViews = $derived(viewsChart.length > 0 ? Math.round(totalViews / viewsChart.length) : 0);

    // 피크 데이터 계산
    const peakData = $derived(
        viewsChart.length > 0
            ? viewsChart.reduce((max, d) => (d.views > max.views ? d : max), viewsChart[0])
            : null
    );

    // X축 tick 계산: 시작일, 마지막일 필수 포함 + 중간 날짜 적절히 분배
    function calculateTickValues(dates: string[], maxTicks: number): string[] {
        if (dates.length <= maxTicks) return dates;

        const result: string[] = [dates[0]];
        const lastIndex = dates.length - 1;

        // 중간 날짜들을 적절한 간격으로 선택
        const interval = Math.ceil(lastIndex / (maxTicks - 2));
        for (let i = interval; i < lastIndex; i += interval) {
            result.push(dates[i]);
        }

        result.push(dates[lastIndex]);
        return result;
    }

    function formatDateValue(date: DateValue): string {
        return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }

    async function loadDashboard() {
        const url = new URL('/api/admin/dashboard', window.location.origin);
        if (dateRange.start && dateRange.end) {
            url.searchParams.set('startDate', formatDateValue(dateRange.start));
            url.searchParams.set('endDate', formatDateValue(dateRange.end));
        }

        const res = await fetch(url);
        if (!res.ok) {
            errorMessage = await readErrorMessage(res);
            return;
        }
        const data = (await res.json()) as {
            stats: DashboardStats;
            viewsChart: { date: string; views: number }[];
        };
        stats = data.stats;
        viewsChart = data.viewsChart;
    }

    $effect(() => {
        if (dateRange.start && dateRange.end) {
            loadDashboard();
        }
    });

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

<div class="space-y-8 pb-12">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
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
            <Button variant="ghost" size="sm" class="shrink-0" onclick={() => (errorMessage = null)}
                >닫기</Button
            >
        </Alert.Root>
    {/if}

    <!-- Stats -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {#each statCards as stat, i}
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

    <!-- Views Chart -->
    <div class="space-y-2">
        <div class="flex items-center justify-between">
            <div class="space-y-1">
                <h2 class="text-lg font-bold">Views</h2>
                <p class="text-sm text-muted-foreground">
                    총 {totalViews.toLocaleString()}회 조회 · 일평균 {avgViews.toLocaleString()}회{#if peakData} · 최고 {peakData.views.toLocaleString()}회 ({peakData.date}){/if}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <DateRangePicker bind:value={dateRange} />
                <Button variant="outline" size="icon" class="h-8 w-8" onclick={resetDateRange} title="초기 상태로 되돌리기">
                    <RotateCcw class="h-4 w-4" />
                </Button>
            </div>
        </div>
        <Chart.Container config={chartConfig} class="aspect-auto h-50 w-full">
            <AreaChart
                data={viewsChart}
                x="date"
                xScale={scaleBand().padding(0.2)}
                series={[
                    {
                        key: 'views',
                        label: '조회수',
                        color: chartConfig.views.color
                    }
                ]}
                props={{
                    area: {
                        curve: curveMonotoneX,
                        'fill-opacity': 0.4,
                        line: { class: 'stroke-2' }
                    },
                    xAxis: {
                        format: (v: string) => v,
                        ticks: calculateTickValues(
                            viewsChart.map((d) => d.date),
                            8
                        )
                    },
                    yAxis: {
                        format: (v: number) => v.toString()
                    }
                }}
            >
                {#snippet marks({ series, getAreaProps })}
                    <defs>
                        <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stop-color="var(--color-views)" stop-opacity="0.8" />
                            <stop offset="95%" stop-color="var(--color-views)" stop-opacity="0.1" />
                        </linearGradient>
                    </defs>
                    <ChartClipPath
                        initialWidth={0}
                        motion={{
                            width: { type: 'tween', duration: 1000, easing: cubicInOut }
                        }}
                    >
                        {#each series as s, i (s.key)}
                            <Area {...getAreaProps(s, i)} fill="url(#fillViews)" />
                        {/each}
                    </ChartClipPath>
                {/snippet}
                {#snippet tooltip()}
                    <Chart.Tooltip indicator="line" />
                {/snippet}
            </AreaChart>
        </Chart.Container>
    </div>

    <hr class="border-border" />

    <!-- Post Filter -->
    <div class="space-y-6 pt-4">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold tracking-tight">Posts</h2>
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
                <div class="py-12 text-center text-muted-foreground text-sm">No posts found.</div>
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