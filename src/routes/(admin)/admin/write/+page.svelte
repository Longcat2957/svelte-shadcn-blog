<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import Folder from '@lucide/svelte/icons/folder';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Plus from '@lucide/svelte/icons/plus';
    import Eye from '@lucide/svelte/icons/eye';
    import Edit3 from '@lucide/svelte/icons/edit-3';
    import X from '@lucide/svelte/icons/x';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Badge } from '$lib/components/ui/badge';
    import { page } from '$app/stores';
    import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import SegmentedToggle from '$lib/components/admin/segmented-toggle.svelte';

    let title = $state('');
    let description = $state('');
    let content = $state('');
    // 실제로는 category_id 사용
    let categoryId = $state<number | null>(null);
    let viewMode = $state<'edit' | 'preview'>('edit');
    let tags = $state<string[]>([]);
    let tagInput = $state('');
    let published = $state(false);
    let saving = $state(false);
    let errorMessage = $state<string | null>(null);
    let postId = $derived(
        (() => {
            const raw = $page.url.searchParams.get('id');
            if (!raw) return null;
            const n = Number(raw);
            return Number.isFinite(n) ? n : null;
        })()
    );

    type CategoryNode = {
        id: number;
        name: string;
        parentId: number | null;
        children: CategoryNode[];
    };
    let categories = $state<CategoryNode[]>([]);
    let categoryOptions = $derived(flattenCategories(categories));

    function flattenCategories(
        items: CategoryNode[],
        path: string[] = []
    ): { id: number; label: string }[] {
        let out: { id: number; label: string }[] = [];
        for (const c of items) {
            const label = [...path, c.name].join(' / ');
            out.push({ id: c.id, label });
            out = [...out, ...flattenCategories(c.children ?? [], [...path, c.name])];
        }
        return out;
    }

    async function loadCategories() {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) {
            errorMessage = await readErrorMessage(res);
            return;
        }
        const data = (await res.json()) as { items: CategoryNode[] };
        categories = data.items;
        if (categoryId === null && data.items.length > 0) {
            categoryId = data.items[0]!.id;
        }
    }

    async function loadPost(id: number) {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) {
            errorMessage = await readErrorMessage(res);
            return;
        }
        const data = (await res.json()) as {
            item: {
                title: string;
                description: string | null;
                content: string;
                tags: string[];
                categoryId: number;
                published: boolean;
            };
        };
        title = data.item.title;
        description = data.item.description ?? '';
        content = data.item.content;
        tags = data.item.tags;
        categoryId = data.item.categoryId;
        published = data.item.published;
    }

    async function save() {
        if (saving) return;
        if (categoryId === null) return;
        saving = true;
        try {
            errorMessage = null;
            const payload = {
                title,
                description: description || null,
                content,
                categoryId,
                tags,
                published
            };

            if (postId) {
                const res = await fetch(`/api/admin/posts/${postId}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    errorMessage = await readErrorMessage(res);
                    return;
                }
            } else {
                const res = await fetch('/api/admin/posts', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    errorMessage = await readErrorMessage(res);
                    return;
                }
                const data = (await res.json()) as { item: { id: number } };
                window.location.href = `/admin/write?id=${data.item.id}`;
            }
        } finally {
            saving = false;
        }
    }

    function addTag() {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            tags = [...tags, trimmed];
        }
        tagInput = '';
    }

    function removeTag(tag: string) {
        tags = tags.filter((t) => t !== tag);
    }

    $effect(() => {
        loadCategories();
        if (postId) loadPost(postId);
    });
</script>

<div class="mx-auto max-w-5xl space-y-8 pb-12">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">Write Post</h1>
            <p class="text-sm text-muted-foreground">
                Create or edit your blog post with markdown support.
            </p>
        </div>

        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <Switch id="published" bind:checked={published} />
                <label
                    for="published"
                    class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Published
                </label>
            </div>

            <SegmentedToggle
                bind:value={viewMode}
                items={[
                    { value: 'edit', label: 'Edit' },
                    { value: 'preview', label: 'Preview' }
                ]}
            />
        </div>
    </div>

    <div class="space-y-6">
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
                    onclick={() => (errorMessage = null)}>닫기</Button
                >
            </Alert.Root>
        {/if}

        {#if viewMode === 'edit'}
            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label for="title" class="ml-1 text-sm font-semibold text-foreground/80"
                        >Title</label
                    >
                    <Input
                        id="title"
                        placeholder="Enter a catchy title..."
                        bind:value={title}
                        class="bg-card/50 backdrop-blur-sm"
                    />
                </div>

                <div class="space-y-2">
                    <label for="description" class="ml-1 text-sm font-semibold text-foreground/80"
                        >Description</label
                    >
                    <Input
                        id="description"
                        placeholder="Short summary of the post..."
                        bind:value={description}
                        class="bg-card/50 backdrop-blur-sm"
                    />
                </div>

                <div class="space-y-2">
                    <label for="directory" class="ml-1 text-sm font-semibold text-foreground/80"
                        >Category</label
                    >
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Button
                                    {...props}
                                    variant="outline"
                                    class="w-full justify-between bg-card/50 font-normal backdrop-blur-sm"
                                >
                                    <div class="flex items-center gap-2">
                                        <Folder class="size-4 text-muted-foreground" />
                                        <span>
                                            {categoryOptions.find((c) => c.id === categoryId)
                                                ?.label ?? 'Select category...'}
                                        </span>
                                    </div>
                                    <ChevronDown class="size-4 opacity-50" />
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content
                            class="max-h-64 w-[--bits-dropdown-menu-anchor-width] overflow-y-auto"
                        >
                            {#each categoryOptions as c}
                                <DropdownMenu.Item onclick={() => (categoryId = c.id)}>
                                    {c.label}
                                </DropdownMenu.Item>
                            {/each}
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item class="text-muted-foreground" disabled>
                                카테고리 생성/관리는 Categories 메뉴에서 진행하세요.
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            </div>

            <div class="space-y-2">
                <label for="tags" class="ml-1 text-sm font-semibold text-foreground/80">Tags</label>
                <div class="mb-2 flex flex-wrap gap-2">
                    {#each tags as tag}
                        <Badge variant="secondary" class="gap-1 pr-1">
                            {tag}
                            <button
                                onclick={() => removeTag(tag)}
                                class="transition-colors outline-none hover:text-destructive"
                            >
                                <X class="size-3" />
                            </button>
                        </Badge>
                    {/each}
                </div>
                <div class="flex gap-2">
                    <Input
                        id="tags"
                        placeholder="Add a tag..."
                        bind:value={tagInput}
                        class="bg-card/50 backdrop-blur-sm"
                        onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button variant="outline" onclick={addTag}>Add</Button>
                </div>
            </div>

            <div class="space-y-2">
                <label for="content" class="ml-1 text-sm font-semibold text-foreground/80"
                    >Content (Markdown)</label
                >
                <div
                    class="overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm transition-all focus-within:ring-1 focus-within:ring-ring"
                >
                    <Textarea
                        id="content"
                        placeholder="Write your post content here..."
                        class="min-h-[600px] resize-none border-0 p-4 focus-visible:ring-0"
                        bind:value={content}
                    />
                </div>
            </div>
        {:else}
            <!-- Preview Mode -->
            <div class="min-h-[700px] rounded-xl border bg-card/30 p-8 backdrop-blur-sm md:p-12">
                <div class="mx-auto max-w-3xl space-y-8">
                    <div class="space-y-4">
                        <div class="flex items-center gap-2 text-sm font-medium text-primary">
                            <Folder class="size-4" />
                            {categoryOptions.find((c) => c.id === categoryId)?.label ?? ''}
                        </div>
                        <h1
                            class="text-4xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8 md:text-5xl"
                        >
                            {title || 'Untitiled Post'}
                        </h1>
                        {#if description}
                            <p class="text-xl leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        {/if}
                        <div class="flex flex-wrap gap-2 py-2">
                            {#each tags as tag}
                                <Badge variant="outline">{tag}</Badge>
                            {/each}
                        </div>
                        <div class="text-sm text-muted-foreground">Written on January 6, 2026</div>
                    </div>

                    {#if content}
                        <MarkdownRenderer class="prose max-w-none dark:prose-invert" md={content} />
                    {:else}
                        <p
                            class="rounded-lg border-2 border-dashed bg-muted/20 py-20 text-center text-muted-foreground italic"
                        >
                            No content to preview. Start writing in the Edit tab!
                        </p>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="flex items-center justify-between border-t pt-6">
            <Button
                variant="ghost"
                href="/admin"
                class="text-muted-foreground hover:text-foreground"
            >
                Discard Changes
            </Button>
            <div class="flex gap-3">
                <Button class="px-8" disabled={saving} onclick={() => save()}>Save</Button>
            </div>
        </div>
    </div>
</div>
