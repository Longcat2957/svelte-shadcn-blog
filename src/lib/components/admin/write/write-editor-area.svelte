<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import Image from '@lucide/svelte/icons/image';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import Undo from '@lucide/svelte/icons/undo';
    import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
    import * as Popover from '$lib/components/ui/popover';
    import AITextAssistant from '$lib/components/admin/ai-text-assistant.svelte';
    import AIImageGenerator from '$lib/components/admin/ai-image-generator.svelte';
    import ImageUploadDialog from '$lib/components/admin/image-upload-dialog.svelte';
    import type { WriteState } from './write-state.svelte';

    let { state, minHeightClass = 'min-h-[600px]' }: { state: WriteState; minHeightClass?: string } =
        $props();
</script>

<div class="flex h-full flex-col space-y-2">
    <div class="flex items-center justify-between gap-3">
        <label for="content" class="ml-1 text-sm font-semibold text-foreground/80"
            >Content (Markdown)</label
        >

        <div class="flex items-center gap-2">
            {#if state.canUndo}
                <Button variant="outline" size="sm" onclick={() => state.undoHistory()}>
                    <Undo class="mr-2 size-4" />
                    실행 취소
                </Button>
            {/if}

            <!-- 텍스트 어시스턴트 -->
            <Popover.Root bind:open={state.isTextPopoverOpen}>
                <Popover.Trigger>
                    {#snippet child({ props })}
                        <Button
                            {...props}
                            variant="outline"
                            size="sm"
                            onclick={() => state.openAITextAssistant()}
                        >
                            <Sparkles class="mr-1 size-4" />
                            텍스트 어시스턴트
                        </Button>
                    {/snippet}
                </Popover.Trigger>
                <Popover.Content
                    class="w-auto p-0"
                    align="end"
                    onInteractOutside={(e) => {
                        if (state.textAssistantStage === 'generating') {
                            e.preventDefault();
                        }
                    }}
                >
                    <AITextAssistant
                        selectedText={state.aiSelectedText}
                        selectionStart={state.aiSelectionStart}
                        selectionEnd={state.aiSelectionEnd}
                        stage={state.textAssistantStage}
                        model={state.textAssistantModel}
                        systemPrompt={state.textAssistantSystemPrompt}
                        userPrompt={state.textAssistantUserPrompt}
                        insertMode={state.textAssistantInsertMode}
                        result={state.textAssistantResult}
                        history={state.textAssistantHistory}
                        onInsert={(text, mode, selStart, selEnd) =>
                            state.handleAITextInsert(text, mode, selStart, selEnd)}
                        onClose={() => (state.isTextPopoverOpen = false)}
                        onStageChange={(stage) => (state.textAssistantStage = stage)}
                        onModelChange={(model) => (state.textAssistantModel = model)}
                        onSystemPromptChange={(prompt) =>
                            (state.textAssistantSystemPrompt = prompt)}
                        onUserPromptChange={(prompt) => (state.textAssistantUserPrompt = prompt)}
                        onInsertModeChange={(mode) => (state.textAssistantInsertMode = mode)}
                        onResultChange={(result) => (state.textAssistantResult = result)}
                        onHistoryChange={(history) => (state.textAssistantHistory = history)}
                    />
                </Popover.Content>
            </Popover.Root>

            <!-- 이미지 어시스턴트 -->
            <Popover.Root bind:open={state.isImagePopoverOpen}>
                <Popover.Trigger>
                    {#snippet child({ props })}
                        <Button {...props} variant="outline" size="sm">
                            <WandSparkles class="mr-1 size-4" />
                            이미지 어시스턴트
                        </Button>
                    {/snippet}
                </Popover.Trigger>
                <Popover.Content
                    class="w-auto p-0"
                    align="end"
                    onInteractOutside={(e) => {
                        if (
                            state.imageAssistantStage === 'generating' ||
                            state.imageAssistantStage === 'uploading'
                        ) {
                            e.preventDefault();
                        }
                    }}
                    onkeydown={(e) => {
                        if (
                            e.key === 'Escape' &&
                            (state.imageAssistantStage === 'generating' ||
                                state.imageAssistantStage === 'uploading')
                        ) {
                            e.preventDefault();
                        }
                    }}
                >
                    <AIImageGenerator
                        prompt={state.imageAssistantPrompt}
                        mode={state.imageAssistantMode}
                        onInsert={(event) => state.handleAIImageInsert(event)}
                        onClose={() => (state.isImagePopoverOpen = false)}
                        onStageChange={(stage) => (state.imageAssistantStage = stage)}
                        onPromptChange={(prompt) => (state.imageAssistantPrompt = prompt)}
                        onModeChange={(mode) => (state.imageAssistantMode = mode)}
                    />
                </Popover.Content>
            </Popover.Root>

            <!-- 이미지 업로드 -->
            <Button variant="outline" size="sm" onclick={() => state.openImageUploadDialog()}>
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
            bind:value={state.content}
            bind:ref={state.textareaRef}
            onpaste={(e) => state.handlePaste(e)}
        />
    </div>
</div>

<ImageUploadDialog bind:this={state.imageUploadDialogRef} />
