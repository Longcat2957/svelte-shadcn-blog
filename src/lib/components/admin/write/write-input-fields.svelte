<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import Folder from '@lucide/svelte/icons/folder';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import Image from '@lucide/svelte/icons/image';
    import X from '@lucide/svelte/icons/x';
    import Upload from '@lucide/svelte/icons/upload';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import Check from '@lucide/svelte/icons/check';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Popover from '$lib/components/ui/popover';
    import { Spinner } from '$lib/components/ui/spinner';
    import type { WriteState } from './write-state.svelte';

    let { state: writeState, isSplit = false }: { state: WriteState; isSplit?: boolean } = $props();

    let thumbnailInputRef = $state<HTMLInputElement | null>(null);
    let uploadingThumbnail = $state(false);

    async function handleThumbnailSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const file = files[0]!;
        await uploadThumbnail(file);
        input.value = '';
    }

    async function uploadThumbnail(file: File) {
        uploadingThumbnail = true;
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/images/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `Upload failed: ${res.status}`);
            }

            const data = await res.json();
            writeState.thumbnailUrl = data.url;
        } catch (err: unknown) {
            console.error('Thumbnail upload failed:', err);
        } finally {
            uploadingThumbnail = false;
        }
    }

    function removeThumbnail() {
        writeState.thumbnailUrl = null;
    }
</script>

<div class="grid gap-6 {isSplit ? 'md:grid-cols-1' : 'md:grid-cols-2'}">
    <div class="space-y-2">
        <label for="title" class="ml-1 text-sm font-semibold text-foreground/80">Title</label>
        <Input
            id="title"
            placeholder="Enter a catchy title..."
            bind:value={writeState.title}
            class="bg-card/50 backdrop-blur-sm"
        />
    </div>

    <div class="space-y-1">
        <div class="ml-1 flex items-center gap-2">
            <label for="description" class="text-sm font-semibold text-foreground/80"
                >Description</label
            >
            <Button
                variant="ghost"
                size="sm"
                class="h-5 px-2 text-xs"
                onclick={() => writeState.generateDescription()}
                disabled={!writeState.content.trim() || writeState.isGeneratingDescription}
            >
                {#if writeState.isGeneratingDescription}
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
            bind:value={writeState.description}
            class="bg-card/50 backdrop-blur-sm"
        />
    </div>

    <div class="space-y-2">
        <label for="directory" class="ml-1 text-sm font-semibold text-foreground/80">Category</label
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
                                {writeState.categoryOptions.find(
                                    (c) => c.id === writeState.categoryId
                                )?.label ?? 'Select category...'}
                            </span>
                        </div>
                        <ChevronDown class="size-4 opacity-50" />
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                class="max-h-64 w-[--bits-dropdown-menu-anchor-width] overflow-y-auto"
            >
                {#each writeState.categoryOptions as c (c.id)}
                    <DropdownMenu.Item onclick={() => (writeState.categoryId = c.id)}>
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

    <div class="space-y-2">
        <label for="thumbnail" class="ml-1 text-sm font-semibold text-foreground/80">썸네일</label>
        <div class="flex items-center gap-2">
            <input
                id="thumbnail"
                type="file"
                accept="image/*"
                class="hidden"
                bind:this={thumbnailInputRef}
                onchange={handleThumbnailSelect}
            />
            {#if writeState.thumbnailUrl}
                <Popover.Root>
                    <Popover.Trigger>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="outline"
                                class="flex-1 justify-start bg-card/50 font-normal backdrop-blur-sm"
                            >
                                <Image class="mr-2 size-4 text-muted-foreground" />
                                <span class="truncate">썸네일 등록됨</span>
                            </Button>
                        {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-64 p-2">
                        <div class="space-y-2">
                            <img
                                src={writeState.thumbnailUrl}
                                alt="Thumbnail preview"
                                class="w-full rounded-lg object-cover"
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                class="w-full"
                                onclick={removeThumbnail}
                            >
                                <X class="mr-1 size-4" />
                                썸네일 제거
                            </Button>
                        </div>
                    </Popover.Content>
                </Popover.Root>
            {:else}
                <Button
                    variant="outline"
                    class="flex-1 justify-start bg-card/50 font-normal backdrop-blur-sm"
                    onclick={() => thumbnailInputRef?.click()}
                    disabled={uploadingThumbnail}
                >
                    {#if uploadingThumbnail}
                        <Spinner class="mr-2 size-4" />
                        업로드 중...
                    {:else}
                        <Upload class="mr-2 size-4 text-muted-foreground" />
                        썸네일 업로드
                    {/if}
                </Button>
            {/if}

            <!-- AI 썸네일 생성 버튼 -->
            <Popover.Root bind:open={writeState.isThumbnailPopoverOpen}>
                <Popover.Trigger>
                    {#snippet child({ props })}
                        <Button
                            {...props}
                            variant="outline"
                            size="icon"
                            class="shrink-0"
                            onclick={() => writeState.openThumbnailAssistant()}
                            disabled={!writeState.content.trim()}
                        >
                            <Sparkles class="size-4" />
                        </Button>
                    {/snippet}
                </Popover.Trigger>
                <Popover.Content class="w-80 p-4">
                    <div class="space-y-4">
                        <!-- 헤더 -->
                        <div class="flex items-center gap-2 border-b pb-3">
                            <Sparkles class="size-5 text-primary" />
                            <h3 class="font-semibold">AI 썸네일 생성</h3>
                        </div>

                        <!-- 생성 중 상태 -->
                        {#if writeState.thumbnailAssistantStage === 'generating'}
                            <div class="flex flex-col items-center gap-3 py-4">
                                <Spinner class="size-6" />
                                <div class="text-center">
                                    <p class="text-sm font-medium">이미지 생성 중...</p>
                                    <p class="text-xs text-muted-foreground">
                                        잠시만 기다려 주세요
                                    </p>
                                </div>
                            </div>
                        {:else if writeState.thumbnailAssistantStage === 'uploading'}
                            <div class="flex flex-col items-center gap-3 py-4">
                                <Spinner class="size-6" />
                                <div class="text-center">
                                    <p class="text-sm font-medium">이미지 저장 중...</p>
                                    <p class="text-xs text-muted-foreground">
                                        잠시만 기다려 주세요
                                    </p>
                                </div>
                            </div>
                        {:else if writeState.thumbnailAssistantStage === 'done' && writeState.thumbnailPreviewUrl}
                            <!-- 완료 상태: 미리보기 -->
                            <div class="space-y-3">
                                <img
                                    src={writeState.thumbnailPreviewUrl}
                                    alt="AI Generated Thumbnail"
                                    class="w-full rounded-md object-cover"
                                    style="max-height: 200px;"
                                />

                                {#if writeState.thumbnailPrompt}
                                    <div class="rounded-md bg-muted/30 p-2">
                                        <p class="text-xs text-muted-foreground">프롬프트:</p>
                                        <p class="text-xs">{writeState.thumbnailPrompt}</p>
                                    </div>
                                {/if}
                            </div>

                            <!-- 버튼 -->
                            <div class="flex justify-between border-t pt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onclick={() => writeState.generateThumbnail()}
                                    disabled={writeState.isGeneratingThumbnail}
                                >
                                    <RefreshCw class="mr-1 size-4" />
                                    다시 생성
                                </Button>
                                <Button size="sm" onclick={() => writeState.confirmThumbnail()}>
                                    <Check class="mr-1 size-4" />
                                    사용
                                </Button>
                            </div>
                        {:else}
                            <!-- 초기 상태 -->
                            <div class="space-y-3">
                                <p class="text-sm text-muted-foreground">
                                    포스트 내용을 분석하여 AI가 썸네일 이미지를 자동 생성합니다.
                                </p>
                                {#if writeState.errorMessage}
                                    <div class="rounded-md bg-destructive/10 p-3">
                                        <p class="text-sm text-destructive">
                                            {writeState.errorMessage}
                                        </p>
                                    </div>
                                {/if}
                            </div>

                            <!-- 버튼 -->
                            <div class="flex justify-end border-t pt-3">
                                <Button
                                    size="sm"
                                    onclick={() => writeState.generateThumbnail()}
                                    disabled={writeState.isGeneratingThumbnail ||
                                        !writeState.content.trim()}
                                >
                                    {#if writeState.isGeneratingThumbnail}
                                        <Spinner class="mr-1 size-4" />
                                        생성 중...
                                    {:else}
                                        <Sparkles class="mr-1 size-4" />
                                        생성
                                    {/if}
                                </Button>
                            </div>
                        {/if}
                    </div>
                </Popover.Content>
            </Popover.Root>
        </div>
    </div>
</div>
