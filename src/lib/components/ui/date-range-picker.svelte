<script lang="ts">
    import { RangeCalendar, Popover as PopoverPrimitive } from 'bits-ui';
    import { type DateValue } from '@internationalized/date';
    import { cn } from '$lib/utils.js';
    import { buttonVariants } from './button/index.js';
    import Button from './button/button.svelte';
    import Calendar from '@lucide/svelte/icons/calendar';
    import ChevronLeft from '@lucide/svelte/icons/chevron-left';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';

    let {
        value = $bindable(),
        locale = 'ko-KR',
        class: className
    }: {
        value?: { start: DateValue | undefined; end: DateValue | undefined };
        locale?: string;
        class?: string;
    } = $props();

    let open = $state(false);

    function formatMonth(date: DateValue, locale: string): string {
        const d = new Date(date.year, date.month - 1);
        return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }

    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
</script>

<PopoverPrimitive.Root bind:open>
    <PopoverPrimitive.Trigger>
        <Button variant="outline" size="icon" class={cn('h-8 w-8', className)}>
            <Calendar class="h-4 w-4" />
        </Button>
    </PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            class="z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
            sideOffset={4}
        >
            <RangeCalendar.Root bind:value {locale} class="p-3">
                {#snippet children({ months })}
                    <div class="flex gap-4">
                        {#each months as month}
                            <div class="space-y-4">
                                <div class="flex items-center justify-between pt-1">
                                    <RangeCalendar.PrevButton
                                        class={cn(
                                            buttonVariants({ variant: 'ghost' }),
                                            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
                                        )}
                                    >
                                        <ChevronLeft class="h-4 w-4" />
                                    </RangeCalendar.PrevButton>
                                    <div class="text-sm font-medium">
                                        {formatMonth(month.value, locale)}
                                    </div>
                                    <RangeCalendar.NextButton
                                        class={cn(
                                            buttonVariants({ variant: 'ghost' }),
                                            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
                                        )}
                                    >
                                        <ChevronRight class="h-4 w-4" />
                                    </RangeCalendar.NextButton>
                                </div>
                                <RangeCalendar.Grid class="w-full border-collapse">
                                    <RangeCalendar.GridHead>
                                        <RangeCalendar.GridRow class="flex">
                                            {#each WEEKDAYS as day}
                                                <RangeCalendar.HeadCell class="w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground">
                                                    {day}
                                                </RangeCalendar.HeadCell>
                                            {/each}
                                        </RangeCalendar.GridRow>
                                    </RangeCalendar.GridHead>
                                    <RangeCalendar.GridBody>
                                        {#each month.weeks as week}
                                            <RangeCalendar.GridRow class="mt-2 flex w-full">
                                                {#each week as date}
                                                    <RangeCalendar.Cell
                                                        {date}
                                                        month={month.value}
                                                        class="relative p-0 text-center text-sm focus-within:relative focus-within:z-20
                                                            [&[data-range-start]]:bg-primary [&[data-range-start]]:rounded-l-md
                                                            [&[data-range-end]]:bg-primary [&[data-range-end]]:rounded-r-md
                                                            [&[data-range-middle]]:bg-accent"
                                                    >
                                                        <RangeCalendar.Day
                                                            class={cn(
                                                                buttonVariants({ variant: 'ghost' }),
                                                                'h-9 w-9 p-0 font-normal',
                                                                // Range start/end text color
                                                                'data-[range-start]:text-primary-foreground data-[range-end]:text-primary-foreground',
                                                                // Outside months
                                                                'data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50',
                                                                // Disabled
                                                                'data-[disabled]:text-muted-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                                                            )}
                                                        />
                                                    </RangeCalendar.Cell>
                                                {/each}
                                            </RangeCalendar.GridRow>
                                        {/each}
                                    </RangeCalendar.GridBody>
                                </RangeCalendar.Grid>
                            </div>
                        {/each}
                    </div>
                {/snippet}
            </RangeCalendar.Root>
        </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
</PopoverPrimitive.Root>