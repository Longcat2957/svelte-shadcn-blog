<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import * as Alert from '$lib/components/ui/alert';
    import { page } from '$app/state';
    import { adminLayoutState } from '$lib/state/admin.svelte';
    import SegmentedToggle from '$lib/components/admin/segmented-toggle.svelte';
    import { WriteState } from '$lib/components/admin/write/write-state.svelte';
    import WriteInputFields from '$lib/components/admin/write/write-input-fields.svelte';
    import WriteTagPicker from '$lib/components/admin/write/write-tag-picker.svelte';
    import WriteEditorArea from '$lib/components/admin/write/write-editor-area.svelte';
    import WritePreviewArea from '$lib/components/admin/write/write-preview-area.svelte';

    const state = new WriteState();

    let postId = $derived(
        (() => {
            const raw = page.url.searchParams.get('id');
            if (!raw) return null;
            const n = Number(raw);
            return Number.isFinite(n) ? n : null;
        })()
    );

    $effect(() => {
        state.loadCategories();
        state.loadTags();
        if (postId) state.loadPost(postId);
    });

    $effect(() => {
        adminLayoutState.fullWidth = state.viewMode === 'split';
        return () => {
            adminLayoutState.fullWidth = false;
        };
    });
</script>

<div
    class="mx-auto space-y-6 pb-12 {state.viewMode === 'split'
        ? 'h-[calc(100vh-8rem)]'
        : 'max-w-5xl'}"
>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Write Post</h1>
            <p class="text-sm text-muted-foreground">
                Create or edit your blog post with markdown support.
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            <div class="flex items-center gap-2">
                <Switch id="published" bind:checked={state.published} />
                <label
                    for="published"
                    class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Published
                </label>
            </div>

            <SegmentedToggle
                bind:value={state.viewMode}
                items={[
                    { value: 'edit', label: 'Edit' },
                    { value: 'split', label: 'Split' },
                    { value: 'preview', label: 'Preview' }
                ]}
            />
        </div>
    </div>

    <div class="space-y-6 {state.viewMode === 'split' ? 'h-[calc(100%-4rem)]' : ''}">
        {#if state.errorMessage}
            <Alert.Root variant="destructive" class="flex items-start justify-between gap-4">
                <div>
                    <Alert.Title>요청이 처리되지 않았습니다</Alert.Title>
                    <Alert.Description>{state.errorMessage}</Alert.Description>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="shrink-0"
                    onclick={() => (state.errorMessage = null)}>닫기</Button
                >
            </Alert.Root>
        {/if}

        {#if state.viewMode === 'split'}
            <div class="grid h-full min-h-0 gap-4 lg:grid-cols-2 lg:gap-8">
                <!-- Left Pane: Editor -->
                <div class="flex h-full flex-col gap-4 overflow-y-auto lg:gap-6 lg:pr-4">
                    <WriteInputFields {state} isSplit={true} />
                    <WriteTagPicker {state} />
                    <div class="min-h-100 flex-1">
                        <WriteEditorArea {state} minHeightClass="min-h-full" />
                    </div>
                </div>

                <!-- Right Pane: Preview -->
                <div
                    class="h-full overflow-y-auto border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
                >
                    <WritePreviewArea {state} fullPage={false} />
                </div>
            </div>
        {:else if state.viewMode === 'edit'}
            <WriteInputFields {state} />
            <WriteTagPicker {state} />
            <WriteEditorArea {state} />
        {:else}
            <WritePreviewArea {state} />
        {/if}

        <div
            class="flex items-center justify-between border-t pt-6 {state.viewMode === 'split'
                ? 'bg-background py-4'
                : ''}"
        >
            <Button
                variant="ghost"
                href="/admin"
                class="text-muted-foreground hover:text-foreground"
            >
                Discard Changes
            </Button>
            <div class="flex gap-3">
                <Button
                    class="px-8"
                    disabled={state.saving}
                    onclick={async () => {
                        const ok = await state.save();
                        if (ok) toast.success('저장되었습니다');
                    }}
                >
                    Save
                </Button>
            </div>
        </div>
    </div>
</div>
