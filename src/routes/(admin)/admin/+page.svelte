<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Chart from '$lib/components/ui/chart';
    import DateRangePicker from '$lib/components/ui/date-range-picker.svelte';
    import { Area, AreaChart, ChartClipPath } from 'layerchart';
    import { scaleBand } from 'd3-scale';
    import { curveMonotoneX } from 'd3-shape';
    import { cubicInOut } from 'svelte/easing';
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
    import FileText from '@lucide/svelte/icons/file-text';
    import CheckCircle from '@lucide/svelte/icons/check-circle';
    import Edit from '@lucide/svelte/icons/edit';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import { CalendarDate, type DateValue } from '@internationalized/date';

    type DashboardStats = {
        postsTotal: number;
        publishedTotal: number;
        draftTotal: number;
        viewsTotal: number;
    };

    const ALL_SOURCES = [
        'Direct',
        'Google',
        'Naver',
        'Daum',
        'Bing',
        'GitHub',
        'Twitter',
        'Internal',
        'Other'
    ] as const;

    const SOURCE_COLORS: Record<string, string> = {
        Direct: 'var(--color-chart-1)',
        Google: 'var(--color-chart-2)',
        Naver: 'var(--color-chart-3)',
        Daum: 'var(--color-chart-4)',
        Bing: 'var(--color-chart-5)',
        GitHub: 'var(--color-chart-1)',
        Twitter: 'var(--color-chart-2)',
        Internal: 'var(--color-chart-3)',
        Other: 'var(--color-chart-4)'
    };

    let stats = $state<DashboardStats | null>(null);
    let viewsChart = $state<{ date: string; views: number }[]>([]);
    let referrerChart = $state<{ source: string; views: number }[]>([]);
    let errorMessage = $state<string | null>(null);

    const referrerFull = $derived(
        ALL_SOURCES.map((source) => ({
            source,
            views: referrerChart.find((r) => r.source === source)?.views ?? 0
        }))
    );

    const referrerTotal = $derived(referrerFull.reduce((sum, r) => sum + r.views, 0));

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

    const totalViews = $derived(viewsChart.reduce((sum, d) => sum + d.views, 0));
    const avgViews = $derived(
        viewsChart.length > 0 ? Math.round(totalViews / viewsChart.length) : 0
    );

    const peakData = $derived(
        viewsChart.length > 0
            ? viewsChart.reduce((max, d) => (d.views > max.views ? d : max), viewsChart[0])
            : null
    );

    function calculateTickValues(dates: string[], maxTicks: number): string[] {
        if (dates.length <= maxTicks) return dates;
        const result: string[] = [dates[0]];
        const lastIndex = dates.length - 1;
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
            referrerChart: { source: string; views: number }[];
        };
        stats = data.stats;
        viewsChart = data.viewsChart;
        referrerChart = data.referrerChart ?? [];
    }

    $effect(() => {
        if (dateRange.start && dateRange.end) {
            loadDashboard();
        }
    });
</script>

<div class="space-y-8 pb-12">
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>

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
                    총 {totalViews.toLocaleString()}회 조회 · 일평균 {avgViews.toLocaleString()}회{#if peakData}
                        · 최고 {peakData.views.toLocaleString()}회 ({peakData.date}){/if}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <DateRangePicker bind:value={dateRange} />
                <Button
                    variant="outline"
                    size="icon"
                    class="h-8 w-8"
                    onclick={resetDateRange}
                    title="초기 상태로 되돌리기"
                >
                    <RotateCcw class="h-4 w-4" />
                </Button>
            </div>
        </div>
        <Chart.Container config={chartConfig} class="aspect-auto h-50 w-full">
            <AreaChart
                data={viewsChart}
                x="date"
                xScale={scaleBand().padding(0.2)}
                series={[{ key: 'views', label: '조회수', color: chartConfig.views.color }]}
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
                    yAxis: { format: (v: number) => v.toString() }
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
                        motion={{ width: { type: 'tween', duration: 1000, easing: cubicInOut } }}
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

    <!-- Referrer Chart -->
    <div class="space-y-3">
        <div class="space-y-1">
            <h2 class="text-lg font-bold">유입경로</h2>
            <p class="text-sm text-muted-foreground">선택한 기간의 방문자 유입 채널 분포</p>
        </div>
        <div class="space-y-2">
            {#each referrerFull as row}
                {@const pct = referrerTotal > 0 ? Math.round((row.views / referrerTotal) * 100) : 0}
                {@const color = SOURCE_COLORS[row.source]}
                <div class="flex items-center gap-3 text-sm">
                    <span class="w-20 shrink-0 font-medium">{row.source}</span>
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            class="h-full rounded-full"
                            style="width: {pct}%; background-color: {color}"
                        ></div>
                    </div>
                    <span class="w-24 shrink-0 text-right text-muted-foreground">
                        {row.views.toLocaleString()}회 ({pct}%)
                    </span>
                </div>
            {/each}
        </div>
    </div>
</div>
