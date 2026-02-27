<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import Folder from '@lucide/svelte/icons/folder';
    import Image from '@lucide/svelte/icons/image';
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
    import { adminLayoutState } from '$lib/state/admin.svelte';
    import ImageUploadDialog from '$lib/components/admin/image-upload-dialog.svelte';
    import AIImageGenerator from '$lib/components/admin/ai-image-generator.svelte';
    import type { InsertEvent } from '$lib/components/admin/image-upload-types';
    import ChevronUp from '@lucide/svelte/icons/chevron-up';
    import * as Popover from '$lib/components/ui/popover';
    import AITextAssistant from '$lib/components/admin/ai-text-assistant.svelte';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import Undo from '@lucide/svelte/icons/undo';
    import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
    import { Spinner } from '$lib/components/ui/spinner';

    let title = $state('');
    let description = $state('');
    let content = $state('');
    // 실제로는 category_id 사용
    let categoryId = $state<number | null>(null);
    let viewMode = $state<'edit' | 'preview' | 'split'>('edit');
    let tags = $state<string[]>([]);
    let tagInput = $state('');
    let published = $state(false);

    // 태그 즐겨찾기 관련 상태
    type TagItem = { name: string; count: number };
    let allTags = $state<TagItem[]>([]);
    let tagExpanded = $state(false);
    const TAG_FAVORITE_COUNT = 5;

    let favoriteTags = $derived(allTags.slice(0, TAG_FAVORITE_COUNT));
    let remainingTags = $derived(allTags.slice(TAG_FAVORITE_COUNT));
    let saving = $state(false);
    let errorMessage = $state<string | null>(null);
    let textareaRef = $state<HTMLTextAreaElement | null>(null);
    let imageUploadDialogRef = $state<{ openDialog: () => Promise<InsertEvent | null> } | null>(
        null
    );

    // AI 텍스트 어시스턴트 관련 상태
    let aiSelectedText = $state('');
    let aiSelectionStart = $state(0);
    let aiSelectionEnd = $state(0);
    let isTextPopoverOpen = $state(false);

    // AI 이미지 어시스턴트 관련 상태
    let isImagePopoverOpen = $state(false);

    // Description 자동 요약 관련 상태
    let isGeneratingDescription = $state(false);

    // 롤백 기능을 위한 히스토리
    interface HistoryEntry {
        content: string;
        selectionStart: number;
        selectionEnd: number;
    }
    let contentHistory = $state<HistoryEntry[]>([]);
    let historyIndex = $state(-1);
    const MAX_HISTORY = 50;

    function saveToHistory() {
        if (!textareaRef) return;
        
        // 현재 인덱스 이후의 히스토리는 삭제
        contentHistory = contentHistory.slice(0, historyIndex + 1);
        
        // 새 항목 추가
        contentHistory.push({
            content,
            selectionStart: textareaRef.selectionStart,
            selectionEnd: textareaRef.selectionEnd
        });
        
        // 최대 개수 제한
        if (contentHistory.length > MAX_HISTORY) {
            contentHistory = contentHistory.slice(-MAX_HISTORY);
        }
        
        historyIndex = contentHistory.length - 1;
    }

    function undoHistory() {
        if (historyIndex <= 0) return;
        
        historyIndex--;
        const entry = contentHistory[historyIndex];
        if (entry) {
            content = entry.content;
            queueMicrotask(() => {
                textareaRef?.focus();
                textareaRef?.setSelectionRange(entry.selectionStart, entry.selectionEnd);
            });
        }
    }

    let canUndo = $derived(historyIndex > 0);
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

    function toggleTag(tagName: string) {
        if (tags.includes(tagName)) {
            tags = tags.filter((t) => t !== tagName);
        } else {
            tags = [...tags, tagName];
        }
    }

    async function loadTags() {
        const res = await fetch('/api/admin/tags');
        if (!res.ok) return;
        const data = (await res.json()) as { items: TagItem[] };
        allTags = data.items;
    }

    $effect(() => {
        loadCategories();
        loadTags();
        if (postId) loadPost(postId);
    });

    // Effect to toggle full width layout when in split mode
    $effect(() => {
        adminLayoutState.fullWidth = viewMode === 'split';
        return () => {
            adminLayoutState.fullWidth = false;
        };
    });

    async function handlePaste(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                await uploadImageSimple(file);
                break;
            }
        }
    }

    async function openImageUploadDialog() {
        if (!imageUploadDialogRef) return;

        const result = await imageUploadDialogRef.openDialog();
        if (!result) return;

        insertImageMarkdown(result);
    }

    function handleAIImageInsert(event: InsertEvent) {
        insertImageMarkdown(event);
        isImagePopoverOpen = false;
    }

    function closeImagePopover() {
        isImagePopoverOpen = false;
    }

    function insertImageMarkdown(event: InsertEvent) {
        const { url, alt, size, align } = event;

        // 인라인 스타일 사용 (마크다운 렌더러에서 안정적으로 작동)
        const widthPercent = size;
        const justifyContent =
            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

        const html = `<div style="display: flex; justify-content: ${justifyContent};"><img src="${url}" alt="${alt}" style="width: ${widthPercent}%;" /></div>`;
        insertAtSelection(html);
    }

    function insertAtSelection(text: string) {
        if (!textareaRef) return;
        const startPos = textareaRef.selectionStart;
        const endPos = textareaRef.selectionEnd;

        const before = content.substring(0, startPos);
        const after = content.substring(endPos);
        content = before + text + after;

        const nextPos = startPos + text.length;
        queueMicrotask(() => {
            textareaRef?.focus();
            textareaRef?.setSelectionRange(nextPos, nextPos);
        });
    }

    // AI 텍스트 어시스턴트 관련 함수
    function openAITextAssistant() {
        if (!textareaRef) return;
        
        const start = textareaRef.selectionStart;
        const end = textareaRef.selectionEnd;
        const selected = content.substring(start, end);
        
        aiSelectionStart = start;
        aiSelectionEnd = end;
        aiSelectedText = selected;
        isTextPopoverOpen = true;
    }

    function handleAITextInsert(text: string, mode: 'replace' | 'append', selStart: number, selEnd: number) {
        // 롤백을 위해 현재 상태 저장
        saveToHistory();
        
        if (mode === 'replace' && selStart !== selEnd) {
            // 대체 모드: 드래그된 영역을 교체
            const before = content.substring(0, selStart);
            const after = content.substring(selEnd);
            content = before + text + after;
            
            const nextPos = selStart + text.length;
            queueMicrotask(() => {
                textareaRef?.focus();
                textareaRef?.setSelectionRange(nextPos, nextPos);
            });
        } else {
            // 추가 모드: 커서 위치에 추가
            const cursorPos = textareaRef?.selectionEnd ?? selStart;
            const before = content.substring(0, cursorPos);
            const after = content.substring(cursorPos);
            content = before + text + after;
            
            const nextPos = cursorPos + text.length;
            queueMicrotask(() => {
                textareaRef?.focus();
                textareaRef?.setSelectionRange(nextPos, nextPos);
            });
        }
        
        isTextPopoverOpen = false;
    }

    function closeTextPopover() {
        isTextPopoverOpen = false;
    }

    // Description 자동 요약 함수
    async function generateDescription() {
        if (!content.trim() || isGeneratingDescription) return;

        isGeneratingDescription = true;

        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: '주어진 마크다운 콘텐츠를 한글로 요약하세요. SEO에 적합한 간결한 설명으로 1-2문장으로 작성하세요. 불필요한 마크다운 문법은 제거하고 자연스러운 문장으로 작성하세요.',
                    userPrompt: content
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '요약 생성 실패');
            }

            const data = await res.json();
            description = data.content ?? '';
        } catch (e: unknown) {
            if (e instanceof Error) {
                errorMessage = e.message;
            } else {
                errorMessage = '요약 생성 중 오류가 발생했습니다.';
            }
        } finally {
            isGeneratingDescription = false;
        }
    }

    // 붙여넣기용 간단 업로드 (기본값: 100%, 중앙 정렬)
    async function uploadImageSimple(file: File) {
        if (!textareaRef) return;

        const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(7);
        const placeholder = `![Uploading ${file.name}...](${id})`;
        insertAtSelection(placeholder);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/images/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await readErrorMessage(res);
                throw new Error(err || 'Upload failed');
            }

            const data = await res.json();

            // 붙여넣기는 기본값으로 삽입
            insertImageMarkdown({
                url: data.url,
                alt: file.name,
                size: '100',
                align: 'center'
            });

            content = content.replace(placeholder, '');
        } catch (err: any) {
            console.error(err);
            errorMessage = err.message || 'Image upload failed';
            content = content.replace(placeholder, `[Upload Failed: ${file.name}]`);
        }
    }
</script>

<!-- Snippets -->
{#snippet inputFields(isSplit = false)}
    <div class="grid gap-6 {isSplit ? 'md:grid-cols-1' : 'md:grid-cols-2'}">
        <div class="space-y-2">
            <label for="title" class="ml-1 text-sm font-semibold text-foreground/80">Title</label>
            <Input
                id="title"
                placeholder="Enter a catchy title..."
                bind:value={title}
                class="bg-card/50 backdrop-blur-sm"
            />
        </div>

        <div class="space-y-2">
            <div class="ml-1 flex items-center gap-2">
                <label for="description" class="text-sm font-semibold text-foreground/80">Description</label>
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-5 px-2 text-xs"
                    onclick={generateDescription}
                    disabled={!content.trim() || isGeneratingDescription}
                >
                    {#if isGeneratingDescription}
                        <Spinner class="mr-1 size-3" />
                    {:else}
                        <Sparkles class="mr-1 size-3" />
                    {/if}
                    자동 요약
                </Button>
            </div>
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
                                    {categoryOptions.find((c) => c.id === categoryId)?.label ??
                                        'Select category...'}
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
{/snippet}

{#snippet tagPicker()}
    <div class="space-y-2">
        <label for="tags" class="ml-1 text-sm font-semibold text-foreground/80">Tags</label>

        {#if tags.length > 0}
            <div class="flex flex-wrap gap-2">
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
        {/if}

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

        {#if allTags.length > 0}
            <div class="flex flex-wrap gap-1">
                {#each favoriteTags as tagItem}
                    <Button
                        size="sm"
                        variant={tags.includes(tagItem.name) ? 'default' : 'outline'}
                        class="h-6 px-2 text-xs"
                        onclick={() => toggleTag(tagItem.name)}
                    >
                        {tagItem.name}
                    </Button>
                {/each}

                {#if remainingTags.length > 0}
                    <Button
                        size="sm"
                        variant="ghost"
                        class="h-6 px-2 text-xs"
                        onclick={() => (tagExpanded = !tagExpanded)}
                    >
                        {#if tagExpanded}
                            <ChevronUp class="size-3" />
                            접기
                        {:else}
                            <Plus class="size-3" />
                            더보기 ({remainingTags.length})
                        {/if}
                    </Button>
                {/if}
            </div>

            {#if tagExpanded && remainingTags.length > 0}
                <div class="flex flex-wrap gap-1">
                    {#each remainingTags as tagItem}
                        <Button
                            size="sm"
                            variant={tags.includes(tagItem.name) ? 'default' : 'outline'}
                            class="h-6 px-2 text-xs"
                            onclick={() => toggleTag(tagItem.name)}
                        >
                            {tagItem.name}
                        </Button>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
{/snippet}

{#snippet editorArea(minHeightClass = 'min-h-[600px]')}
    <div class="flex h-full flex-col space-y-2">
        <div class="flex items-center justify-between gap-3">
            <label for="content" class="ml-1 text-sm font-semibold text-foreground/80"
                >Content (Markdown)</label
            >

            <div class="flex items-center gap-2">
                {#if canUndo}
                    <Button variant="outline" size="sm" onclick={undoHistory}>
                        <Undo class="mr-2 size-4" />
                        실행 취소
                    </Button>
                {/if}
                <!-- 텍스트 어시스턴트 -->
                <Popover.Root bind:open={isTextPopoverOpen}>
                    <Popover.Trigger>
                        {#snippet child({ props })}
                            <Button {...props} variant="outline" size="sm" onclick={openAITextAssistant}>
                                <Sparkles class="mr-1 size-4" />
                                텍스트 어시스턴트
                            </Button>
                        {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="end">
                        <AITextAssistant
                            selectedText={aiSelectedText}
                            selectionStart={aiSelectionStart}
                            selectionEnd={aiSelectionEnd}
                            onInsert={handleAITextInsert}
                            onClose={closeTextPopover}
                        />
                    </Popover.Content>
                </Popover.Root>
                <!-- 이미지 어시스턴트 -->
                <Popover.Root bind:open={isImagePopoverOpen}>
                    <Popover.Trigger>
                        {#snippet child({ props })}
                            <Button {...props} variant="outline" size="sm">
                                <WandSparkles class="mr-1 size-4" />
                                이미지 어시스턴트
                            </Button>
                        {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-auto p-0" align="end">
                        <AIImageGenerator
                            onInsert={handleAIImageInsert}
                            onClose={closeImagePopover}
                        />
                    </Popover.Content>
                </Popover.Root>
                <!-- 이미지 업로드 -->
                <Button variant="outline" size="sm" onclick={openImageUploadDialog}>
                    <Image class="mr-1 size-4" />
                    이미지 업로드
                </Button>
            </div>
        </div>
        <div
            class="flex-1 overflow-hidden rounded-lg border border-input bg-card/50 backdrop-blur-sm transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        >
            <Textarea
                id="content"
                placeholder="Write your post content here..."
                class="{minHeightClass} h-full w-full resize-none border-0 p-4 focus-visible:ring-0"
                bind:value={content}
                bind:ref={textareaRef}
                onpaste={handlePaste}
            />
        </div>
    </div>
{/snippet}

{#snippet previewArea(fullPage = true)}
    {#if fullPage}
        <div class="min-h-175 rounded-xl border bg-card/30 p-8 backdrop-blur-sm md:p-12">
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
    {:else}
        <!-- Split View Preview (simplified wrapper) -->
        <div class="space-y-4 pr-4">
            <h1 class="border-b pb-4 text-3xl font-bold">{title || 'Untitled'}</h1>
            {#if content}
                <MarkdownRenderer class="prose max-w-none dark:prose-invert" md={content} />
            {:else}
                <p class="text-muted-foreground italic">No content to preview.</p>
            {/if}
        </div>
    {/if}
{/snippet}

<div class="mx-auto space-y-8 pb-12 {viewMode === 'split' ? 'h-[calc(100vh-8rem)]' : 'max-w-5xl'}">
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
                    { value: 'split', label: 'Split' },
                    { value: 'preview', label: 'Preview' }
                ]}
            />
        </div>
    </div>

    <div class="space-y-6 {viewMode === 'split' ? 'h-[calc(100%-4rem)]' : ''}">
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

        {#if viewMode === 'split'}
            <div class="grid h-full min-h-0 grid-cols-2 gap-8">
                <!-- Left Pane: Editor -->
                <div class="flex h-full flex-col gap-6 overflow-y-auto pr-4">
                    {@render inputFields(true)}
                    {@render tagPicker()}
                    <div class="min-h-100 flex-1">
                        {@render editorArea('min-h-full')}
                    </div>
                </div>

                <!-- Right Pane: Preview -->
                <div class="h-full overflow-y-auto border-l pl-8">
                    {@render previewArea(false)}
                </div>
            </div>
        {:else if viewMode === 'edit'}
            {@render inputFields()}
            {@render tagPicker()}
            {@render editorArea()}
        {:else}
            {@render previewArea(true)}
        {/if}

        <div
            class="flex items-center justify-between border-t pt-6 {viewMode === 'split'
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
                <Button class="px-8" disabled={saving} onclick={() => save()}>Save</Button>
            </div>
        </div>
    </div>
</div>

<ImageUploadDialog bind:this={imageUploadDialogRef} />
