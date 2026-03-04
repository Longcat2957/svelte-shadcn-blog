<script lang="ts">
    import * as Tabs from '$lib/components/ui/tabs';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Spinner } from '$lib/components/ui/spinner';
    import Upload from '@lucide/svelte/icons/upload';
    import X from '@lucide/svelte/icons/x';
    import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import Check from '@lucide/svelte/icons/check';
    import Clock from '@lucide/svelte/icons/clock';
    import FileText from '@lucide/svelte/icons/file-text';
    import type { Size, Align, InsertEvent } from './image-upload-types';

    type Mode = 't2i' | 'i2i';
    type Stage = 'config' | 'generating' | 'uploading' | 'done';

    // 프롬프트 히스토리 타입
    interface PromptHistory {
        id: string;
        timestamp: Date;
        prompt: string;
        mode: Mode;
    }

    // Props - 부모에서 상태 관리
    interface Props {
        prompt?: string;
        mode?: Mode;
        selectedText?: string;
        isGeneratingPrompt?: boolean;
        onInsert?: (event: InsertEvent) => void;
        onClose?: () => void;
        onStageChange?: (stage: Stage) => void;
        onPromptChange?: (prompt: string) => void;
        onModeChange?: (mode: Mode) => void;
        onGeneratePrompt?: () => Promise<string | null>;
    }

    let { 
        prompt: propPrompt = '',
        mode: propMode = 't2i',
        selectedText = '',
        isGeneratingPrompt = false,
        onInsert, 
        onClose, 
        onStageChange,
        onPromptChange,
        onModeChange,
        onGeneratePrompt
    }: Props = $props();

    // 내부 상태
    let stage = $state<Stage>('config');
    let errorMessage = $state<string | null>(null);
    let statusMessage = $state('');

    // 부모 상태와 동기화할 로컬 상태 (props 직접 사용)
    let prompt = $derived(propPrompt);
    let mode = $derived(propMode);

    // 로컬 상태 변경 시 부모에게 알림
    function updatePrompt(value: string) {
        onPromptChange?.(value);
    }

    function updateMode(value: Mode) {
        onModeChange?.(value);
    }

    // 선택된 텍스트 유무 확인
    let hasSelectedText = $derived(selectedText.length > 0);

    // 프롬프트 자동 생성 핸들러
    async function handleGeneratePrompt() {
        if (!onGeneratePrompt || isGeneratingPrompt) return;
        
        const generatedPrompt = await onGeneratePrompt();
        if (generatedPrompt) {
            updatePrompt(generatedPrompt);
        }
    }

    // i2i 전용: 업로드된 fal.ai URL 목록
    let i2iImages = $state<{ file: File; url: string }[]>([]);
    let i2iUploading = $state(false);

    // done 단계
    let generatedCfUrl = $state<string | null>(null);
    let size = $state<Size>('100');
    let align = $state<Align>('center');

    // 프롬프트 히스토리 (최대 5개)
    let promptHistory = $state<PromptHistory[]>([]);
    const MAX_HISTORY = 5;

    // 폴링 취소용
    let isPollingCancelled = $state(false);

    // Stage 변경 시 부모에게 알림
    $effect(() => {
        onStageChange?.(stage);
    });

    // 히스토리 시간 포맷팅
    function formatTime(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`;
        
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }

    // 히스토리에 추가
    function addToHistory(promptText: string, promptMode: Mode) {
        const entry: PromptHistory = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            prompt: promptText,
            mode: promptMode
        };
        
        promptHistory = [entry, ...promptHistory].slice(0, MAX_HISTORY);
    }

    // 히스토리에서 불러오기
    function loadFromHistory(entry: PromptHistory) {
        updatePrompt(entry.prompt);
        updateMode(entry.mode);
    }

    // i2i: 이미지 파일 선택 → /api/ai/upload 로 업로드
    async function handleI2IFileSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        input.value = '';
        if (files.length === 0) return;

        i2iUploading = true;
        errorMessage = null;

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/ai/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({})) as { message?: string };
                    throw new Error(data.message ?? 'Image upload failed');
                }

                const data = await res.json() as { url: string };
                i2iImages = [...i2iImages, { file, url: data.url }];
            }
        } catch (err: unknown) {
            errorMessage = err instanceof Error ? err.message : 'Image upload failed';
        } finally {
            i2iUploading = false;
        }
    }

    function removeI2IImage(index: number) {
        i2iImages = i2iImages.filter((_, i) => i !== index);
    }

    // 생성 요청 → 폴링 → CF 업로드
    async function generate() {
        errorMessage = null;

        if (!prompt.trim()) {
            errorMessage = '프롬프트를 입력하세요.';
            return;
        }

        if (mode === 'i2i' && i2iImages.length === 0) {
            errorMessage = '이미지를 최소 1장 업로드하세요.';
            return;
        }

        isPollingCancelled = false;
        
        // 히스토리에 추가
        addToHistory(prompt.trim(), mode);

        stage = 'generating';
        statusMessage = '이미지 생성 요청 중...';

        try {
            // 1. 생성 요청 제출
            const endpoint = mode === 't2i' ? '/api/ai/t2i' : '/api/ai/i2i';
            const body =
                mode === 't2i'
                    ? { prompt: prompt.trim() }
                    : { prompt: prompt.trim(), image_urls: i2iImages.map((img) => img.url) };

            const submitRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!submitRes.ok) {
                const data = await submitRes.json().catch(() => ({})) as { message?: string };
                throw new Error(data.message ?? '생성 요청 실패');
            }

            const submitData = await submitRes.json() as { requestId: string };
            const { requestId } = submitData;

            // 2. 폴링
            statusMessage = '이미지 생성 중...';
            const falImageUrl = await pollUntilDone(endpoint, requestId);
            
            // 취소된 경우
            if (isPollingCancelled) {
                stage = 'config';
                return;
            }

            // 3. fal.ai 이미지 URL → 서버에서 CF Images 업로드 (CORS 우회)
            stage = 'uploading';
            statusMessage = '이미지 저장 중...';

            const cfFormData = new FormData();
            cfFormData.append('url', falImageUrl);

            const cfRes = await fetch('/api/admin/images/upload', {
                method: 'POST',
                body: cfFormData
            });

            if (!cfRes.ok) {
                const data = await cfRes.json().catch(() => ({})) as { message?: string };
                throw new Error(data.message ?? 'CF 업로드 실패');
            }

            const cfData = await cfRes.json() as { url: string };
            generatedCfUrl = cfData.url;
            stage = 'done';
        } catch (err: unknown) {
            errorMessage = err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.';
            stage = 'config';
        }
    }

    async function pollUntilDone(endpoint: string, requestId: string): Promise<string> {
        while (true) {
            if (isPollingCancelled) {
                throw new Error('CANCELLED');
            }
            
            await new Promise((r) => setTimeout(r, 1500));

            const res = await fetch(`${endpoint}?requestId=${encodeURIComponent(requestId)}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({})) as { message?: string };
                throw new Error(data.message ?? '상태 확인 실패');
            }

            const data = await res.json() as {
                status: string;
                images?: { url: string }[];
            };

            if (data.status === 'COMPLETED') {
                if (!data.images || data.images.length === 0) {
                    throw new Error('생성된 이미지가 없습니다.');
                }
                return data.images[0]!.url;
            }

            if (data.status === 'FAILED') {
                throw new Error('이미지 생성에 실패했습니다.');
            }
        }
    }

    // 생성 취소
    function handleCancelGeneration() {
        isPollingCancelled = true;
    }

    function handleInsert() {
        if (!generatedCfUrl) return;
        onInsert?.({
            url: generatedCfUrl,
            alt: 'AI Generated Image',
            size,
            align
        });
        handleClose();
    }

    // 새로 생성 (done에서 config로, 프롬프트 유지)
    function handleNewGeneration() {
        generatedCfUrl = null;
        size = '100';
        align = 'center';
        stage = 'config';
    }

    // 다시 시도 (에러 상태에서)
    function handleRetry() {
        errorMessage = null;
        generate();
    }

    function handleCancel() {
        handleClose();
    }

    function handleClose() {
        // 프롬프트는 유지하고 내부 상태만 초기화
        stage = 'config';
        errorMessage = null;
        statusMessage = '';
        i2iImages = [];
        i2iUploading = false;
        generatedCfUrl = null;
        size = '100';
        align = 'center';
        isPollingCancelled = false;
        onClose?.();
    }
</script>

<div class="w-96 space-y-4 p-4">
    <!-- 헤더 -->
    <div class="flex items-center gap-2 border-b pb-3">
        <WandSparkles class="size-5 text-primary" />
        <h3 class="font-semibold">AI 이미지 어시스턴트</h3>
    </div>

    {#if stage === 'config' || stage === 'done'}
        <!-- 에러 메시지 -->
        {#if errorMessage}
            <div class="rounded-md bg-destructive/10 p-3">
                <p class="text-sm text-destructive">{errorMessage}</p>
                <Button variant="outline" size="sm" class="mt-2" onclick={handleRetry}>
                    <RefreshCw class="mr-1 size-3" />
                    다시 시도
                </Button>
            </div>
        {/if}

        <div class="space-y-3">
            <Tabs.Root value={mode} onValueChange={(v) => updateMode(v as Mode)}>
                <Tabs.List class="w-full">
                    <Tabs.Trigger value="t2i" class="flex-1">텍스트 → 이미지</Tabs.Trigger>
                    <Tabs.Trigger value="i2i" class="flex-1">이미지 → 이미지</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="t2i" class="space-y-3 pt-3">
                    <div class="space-y-1">
                        <label for="t2i-prompt" class="text-sm font-medium">프롬프트</label>
                        <Textarea
                            id="t2i-prompt"
                            placeholder="생성할 이미지를 설명하세요..."
                            class="min-h-20 resize-none"
                            value={prompt}
                            onchange={(e) => updatePrompt(e.currentTarget.value)}
                        />
                    </div>
                    
                    <!-- 내용에서 프롬프트 생성 버튼 -->
                    {#if onGeneratePrompt}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            class="w-full"
                            onclick={handleGeneratePrompt}
                            disabled={isGeneratingPrompt}
                        >
                            {#if isGeneratingPrompt}
                                <Spinner class="mr-1 size-3" />
                                프롬프트 생성 중...
                            {:else}
                                <FileText class="mr-1 size-3" />
                                {hasSelectedText ? '선택한 텍스트에서 프롬프트 생성' : '포스트 내용에서 프롬프트 생성'}
                            {/if}
                        </Button>
                    {/if}
                </Tabs.Content>

                <Tabs.Content value="i2i" class="space-y-3 pt-3">
                    <div class="space-y-2">
                        <span class="text-sm font-medium">참조 이미지</span>
                        <label
                            class="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                        >
                            <Upload class="size-4" />
                            {i2iUploading ? '업로드 중...' : '이미지 선택 (여러 장 가능)'}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                class="hidden"
                                disabled={i2iUploading}
                                onchange={handleI2IFileSelect}
                            />
                        </label>
                        {#if i2iImages.length > 0}
                            <div class="flex flex-wrap gap-2">
                                {#each i2iImages as img, i}
                                    <div class="relative">
                                        <img
                                            src={img.url}
                                            alt={img.file.name}
                                            class="size-14 rounded object-cover"
                                        />
                                        <button
                                            onclick={() => removeI2IImage(i)}
                                            class="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                                        >
                                            <X class="size-3" />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="space-y-1">
                        <label for="i2i-prompt" class="text-sm font-medium">프롬프트</label>
                        <Textarea
                            id="i2i-prompt"
                            placeholder="이미지를 어떻게 변환할지 설명하세요..."
                            class="min-h-15 resize-none"
                            value={prompt}
                            onchange={(e) => updatePrompt(e.currentTarget.value)}
                        />
                    </div>
                    
                    <!-- 내용에서 프롬프트 생성 버튼 -->
                    {#if onGeneratePrompt}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            class="w-full"
                            onclick={handleGeneratePrompt}
                            disabled={isGeneratingPrompt}
                        >
                            {#if isGeneratingPrompt}
                                <Spinner class="mr-1 size-3" />
                                프롬프트 생성 중...
                            {:else}
                                <FileText class="mr-1 size-3" />
                                {hasSelectedText ? '선택한 텍스트에서 프롬프트 생성' : '포스트 내용에서 프롬프트 생성'}
                            {/if}
                        </Button>
                    {/if}
                </Tabs.Content>
            </Tabs.Root>
        </div>

        <!-- 프롬프트 히스토리 -->
        {#if promptHistory.length > 0}
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <Clock class="size-4" />
                    최근 프롬프트
                </div>
                <div class="max-h-24 space-y-1 overflow-y-auto">
                    {#each promptHistory as entry}
                        <button
                            type="button"
                            class="w-full rounded-md border bg-muted/30 p-2 text-left text-xs transition-colors hover:bg-muted/50"
                            onclick={() => loadFromHistory(entry)}
                        >
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-muted-foreground">
                                    {entry.mode === 't2i' ? '텍스트→이미지' : '이미지→이미지'}
                                </span>
                                <span class="text-muted-foreground">{formatTime(entry.timestamp)}</span>
                            </div>
                            <p class="mt-1 truncate">
                                {entry.prompt}
                            </p>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 생성 결과 (done 상태) -->
        {#if stage === 'done' && generatedCfUrl}
            <div class="space-y-3">
                <img
                    src={generatedCfUrl}
                    alt="AI Generated"
                    class="w-full rounded-md object-contain"
                    style="max-height: 180px;"
                />

                <div class="space-y-2">
                    <span class="text-sm font-medium">크기</span>
                    <RadioGroup.Root bind:value={size}>
                        <div class="flex gap-3">
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="100" id="gen-size-100" />
                                <label for="gen-size-100" class="text-sm">100%</label>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="75" id="gen-size-75" />
                                <label for="gen-size-75" class="text-sm">75%</label>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="50" id="gen-size-50" />
                                <label for="gen-size-50" class="text-sm">50%</label>
                            </div>
                        </div>
                    </RadioGroup.Root>
                </div>

                <div class="space-y-2">
                    <span class="text-sm font-medium">정렬</span>
                    <RadioGroup.Root bind:value={align}>
                        <div class="flex gap-3">
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="left" id="gen-align-left" />
                                <label for="gen-align-left" class="text-sm">좌측</label>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="center" id="gen-align-center" />
                                <label for="gen-align-center" class="text-sm">중앙</label>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <RadioGroup.Item value="right" id="gen-align-right" />
                                <label for="gen-align-right" class="text-sm">우측</label>
                            </div>
                        </div>
                    </RadioGroup.Root>
                </div>
            </div>
        {/if}

        <!-- 버튼 -->
        <div class="flex justify-between border-t pt-3">
            {#if stage === 'done' && generatedCfUrl}
                <Button variant="outline" size="sm" onclick={handleNewGeneration}>
                    <RefreshCw class="mr-1 size-4" />
                    새로 생성
                </Button>
                <Button size="sm" onclick={handleInsert}>
                    <Check class="mr-1 size-4" />
                    삽입
                </Button>
            {:else}
                <Button variant="outline" size="sm" onclick={handleCancel}>취소</Button>
                <Button size="sm" onclick={generate} disabled={i2iUploading}>
                    <Sparkles class="mr-1 size-4" />
                    생성
                </Button>
            {/if}
        </div>

    {:else if stage === 'generating' || stage === 'uploading'}
        <!-- 생성 중 상태 -->
        <div class="flex flex-col items-center gap-3 py-6">
            <Spinner class="size-6" />
            <div class="text-center">
                <p class="text-sm font-medium">{statusMessage}</p>
                <p class="text-xs text-muted-foreground">잠시만 기다려 주세요</p>
            </div>
        </div>

        <div class="flex justify-end border-t pt-3">
            <Button variant="outline" size="sm" onclick={handleCancelGeneration}>
                취소
            </Button>
        </div>
    {/if}
</div>