<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Spinner } from '$lib/components/ui/spinner';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import Check from '@lucide/svelte/icons/check';
    import Clock from '@lucide/svelte/icons/clock';
    import { onMount } from 'svelte';

    // 모델 타입
    interface ModelInfo {
        id: string;
        name: string;
        description?: string;
        context_length: number | null;
    }

    // Stage 타입 (export for parent)
    export type Stage = 'config' | 'generating' | 'done';

    // 메이저 모델 제공사 프리픽스 (OpenRouter 형식)
    const MAJOR_PROVIDERS = [
        'openai/', // OpenAI (GPT 시리즈)
        'anthropic/', // Anthropic (Claude 시리즈)
        'google/' // Google (Gemini 시리즈)
    ] as const;

    // 메이저 제공사 모델만 필터링
    function filterMajorModels(models: ModelInfo[]): ModelInfo[] {
        return models.filter((model) =>
            MAJOR_PROVIDERS.some((prefix) => model.id.startsWith(prefix))
        );
    }

    // 생성 히스토리 타입 (export for parent)
    export interface GenerationHistory {
        id: string;
        timestamp: Date;
        model: string;
        systemPrompt: string;
        userPrompt: string;
        selectedText: string;
        result: string;
    }

    // Props - 부모에서 상태 관리
    interface Props {
        selectedText?: string;
        selectionStart?: number;
        selectionEnd?: number;
        stage?: Stage;
        model?: string;
        systemPrompt?: string;
        userPrompt?: string;
        insertMode?: 'replace' | 'append';
        result?: string | null;
        history?: GenerationHistory[];
        onInsert?: (
            text: string,
            mode: 'replace' | 'append',
            selectionStart: number,
            selectionEnd: number
        ) => void;
        onClose?: () => void;
        onStageChange?: (stage: Stage) => void;
        onModelChange?: (model: string) => void;
        onSystemPromptChange?: (prompt: string) => void;
        onUserPromptChange?: (prompt: string) => void;
        onInsertModeChange?: (mode: 'replace' | 'append') => void;
        onResultChange?: (result: string | null) => void;
        onHistoryChange?: (history: GenerationHistory[]) => void;
    }

    let {
        selectedText = '',
        selectionStart = 0,
        selectionEnd = 0,
        stage: propStage = 'config',
        model: propModel = 'default',
        systemPrompt: propSystemPrompt = '',
        userPrompt: propUserPrompt = '',
        insertMode: propInsertMode = 'append',
        result: propResult = null,
        history: propHistory = [],
        onInsert,
        onClose,
        onStageChange,
        onModelChange,
        onSystemPromptChange,
        onUserPromptChange,
        onInsertModeChange,
        onResultChange,
        onHistoryChange
    }: Props = $props();

    // 내부 상태
    let models = $state<ModelInfo[]>([]);
    let isLoadingModels = $state(true);
    let error = $state<string | null>(null);
    let isGenerating = $state(false);
    let abortController = $state<AbortController | null>(null);
    const MAX_HISTORY = 5;

    // 부모 상태를 직접 참조 (읽기 전용)
    let stage = $derived(propStage);
    let selectedModel = $derived(propModel);
    let systemPrompt = $derived(propSystemPrompt);
    let userPrompt = $derived(propUserPrompt);
    let insertMode = $derived(propInsertMode);
    let generatedResult = $derived(propResult);
    let history = $derived(propHistory);

    // 상태 변경 시 부모에게 알림
    function updateModel(value: string) {
        onModelChange?.(value);
    }

    function updateSystemPrompt(value: string) {
        onSystemPromptChange?.(value);
    }

    function updateUserPrompt(value: string) {
        onUserPromptChange?.(value);
    }

    function updateInsertMode(value: 'replace' | 'append') {
        onInsertModeChange?.(value);
    }

    function updateResult(value: string | null) {
        onResultChange?.(value);
    }

    function updateStage(value: Stage) {
        onStageChange?.(value);
    }

    // 드래그된 텍스트 유무 확인
    let hasSelectedText = $derived(selectedText.length > 0);

    // 모델 목록 로드
    onMount(async () => {
        try {
            const res = await fetch('/api/ai/llm');
            if (!res.ok) throw new Error('모델 목록을 불러오지 못했습니다.');
            const data = await res.json();
            const allModels = data.models ?? [];
            models = filterMajorModels(allModels);
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e.message;
            } else {
                error = '알 수 없는 오류가 발생했습니다.';
            }
        } finally {
            isLoadingModels = false;
        }
    });

    // 히스토리에 추가
    function addToHistory(result: string) {
        const entry: GenerationHistory = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            model: selectedModel,
            systemPrompt,
            userPrompt,
            selectedText,
            result
        };

        history = [entry, ...history].slice(0, MAX_HISTORY);
        onHistoryChange?.(history);
    }

    // 히스토리에서 불러오기
    function loadFromHistory(entry: GenerationHistory) {
        updateModel(entry.model);
        updateSystemPrompt(entry.systemPrompt);
        updateUserPrompt(entry.userPrompt);
        updateResult(entry.result);
        updateStage('done');
    }

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

    async function handleGenerate() {
        if (isGenerating) return;

        // 드래그된 텍스트 + 유저 프롬프트 조합
        let finalUserPrompt = '';
        if (selectedText && userPrompt.trim()) {
            finalUserPrompt = `[선택된 텍스트]\n${selectedText}\n\n[요청]\n${userPrompt.trim()}`;
        } else if (selectedText) {
            finalUserPrompt = selectedText;
        } else if (userPrompt.trim()) {
            finalUserPrompt = userPrompt.trim();
        }

        if (!finalUserPrompt) return;

        isGenerating = true;
        error = null;
        updateStage('generating');
        abortController = new AbortController();

        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt: finalUserPrompt,
                    systemPrompt: systemPrompt.trim() || undefined,
                    model: selectedModel === 'default' ? undefined : selectedModel
                }),
                signal: abortController.signal
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '생성 실패');
            }

            const data = await res.json();
            const result = data.content ?? '';

            // 결과 업데이트
            updateResult(result);

            // 히스토리에 추가
            addToHistory(result);

            updateStage('done');
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                updateStage('config');
            } else if (e instanceof Error) {
                error = e.message;
                updateStage('config');
            } else {
                error = '알 수 없는 오류가 발생했습니다.';
                updateStage('config');
            }
        } finally {
            isGenerating = false;
            abortController = null;
        }
    }

    // 생성 취소
    function handleCancelGeneration() {
        abortController?.abort();
    }

    // 결과 삽입
    function handleInsert() {
        if (!generatedResult) return;
        onInsert?.(generatedResult, insertMode, selectionStart, selectionEnd);
        onClose?.();
    }

    // 새로 생성 (done에서 config로)
    function handleNewGeneration() {
        updateResult(null);
        updateStage('config');
    }

    // 다시 시도 (에러 상태에서)
    function handleRetry() {
        error = null;
        handleGenerate();
    }
</script>

<div class="max-h-[80vh] w-80 space-y-4 overflow-y-auto p-4">
    <!-- 헤더 -->
    <div class="flex items-center gap-2 border-b pb-3">
        <Sparkles class="size-5 text-primary" />
        <h3 class="font-semibold">AI 텍스트 어시스턴트</h3>
    </div>

    <!-- 에러 메시지 -->
    {#if error}
        <div class="rounded-md bg-destructive/10 p-3">
            <p class="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" class="mt-2" onclick={handleRetry}>
                <RefreshCw class="mr-1 size-3" />
                다시 시도
            </Button>
        </div>
    {/if}

    {#if stage === 'config' || stage === 'done'}
        <!-- 모델 선택 -->
        <div class="space-y-2">
            <label for="model-select" class="text-sm font-medium text-foreground/80"
                >모델 선택</label
            >
            {#if isLoadingModels}
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner class="size-4" />
                    모델 로딩 중...
                </div>
            {:else if models.length === 0}
                <p class="text-sm text-muted-foreground">사용 가능한 모델이 없습니다.</p>
            {:else}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                id="model-select"
                                variant="outline"
                                class="w-full justify-between"
                            >
                                <span
                                    >{selectedModel === 'default'
                                        ? '기본값'
                                        : (models.find((m) => m.id === selectedModel)?.name ??
                                          '모델 선택')}</span
                                >
                                <ChevronDown class="size-4 opacity-50" />
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-[--bits-dropdown-menu-anchor-width]">
                        <DropdownMenu.Item
                            onclick={() => updateModel('default')}
                            class="flex flex-col items-start"
                        >
                            <span class="font-medium">기본값</span>
                            <span class="text-xs text-muted-foreground">서버 기본 모델 사용</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        {#each models as model (model.id)}
                            <DropdownMenu.Item
                                onclick={() => updateModel(model.id)}
                                class="flex flex-col items-start"
                            >
                                <span class="font-medium">{model.name}</span>
                            </DropdownMenu.Item>
                        {/each}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            {/if}
        </div>

        <!-- 삽입 방식 -->
        <div class="space-y-2">
            <span class="text-sm font-medium text-foreground/80">삽입 방식</span>
            <RadioGroup.Root
                value={insertMode}
                onValueChange={(v) => updateInsertMode(v as 'replace' | 'append')}
                class="flex gap-4"
            >
                <div class="flex items-center gap-2">
                    <RadioGroup.Item value="append" id="append" />
                    <label for="append" class="text-sm">추가</label>
                </div>
                <div class="flex items-center gap-2">
                    <RadioGroup.Item value="replace" id="replace" />
                    <label for="replace" class="text-sm">대체</label>
                </div>
            </RadioGroup.Root>
            <p class="text-xs text-muted-foreground">
                {#if hasSelectedText}
                    선택된 텍스트가 컨텍스트로 포함됩니다.
                {:else}
                    커서 위치에 텍스트가 삽입됩니다.
                {/if}
            </p>
        </div>

        <!-- 시스템 프롬프트 -->
        <div class="space-y-2">
            <label for="system-prompt" class="text-sm font-medium text-foreground/80">
                시스템 프롬프트
                <span class="text-xs text-muted-foreground">(선택)</span>
            </label>
            <Textarea
                id="system-prompt"
                placeholder="AI의 동작 방식을 정의하세요..."
                value={systemPrompt}
                onchange={(e) => updateSystemPrompt(e.currentTarget.value)}
                rows={3}
                class="resize-none"
            />
        </div>

        <!-- 유저 프롬프트 -->
        <div class="space-y-2">
            <label for="user-prompt" class="text-sm font-medium text-foreground/80">
                {#if hasSelectedText}
                    추가 지시사항
                    <span class="text-xs text-muted-foreground"
                        >(선택된 텍스트에 대한 추가 요청)</span
                    >
                {:else}
                    유저 프롬프트
                {/if}
            </label>
            <Textarea
                id="user-prompt"
                placeholder={hasSelectedText
                    ? '선택된 텍스트를 어떻게 수정할지 입력하세요...'
                    : '요청 내용을 입력하세요...'}
                value={userPrompt}
                onchange={(e) => updateUserPrompt(e.currentTarget.value)}
                rows={4}
                class="resize-none"
            />
        </div>

        <!-- 히스토리 -->
        {#if history.length > 0}
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <Clock class="size-4" />
                    최근 생성
                </div>
                <div class="max-h-32 space-y-1 overflow-y-auto">
                    {#each history as entry (entry.id)}
                        <button
                            type="button"
                            class="w-full rounded-md border bg-muted/30 p-2 text-left text-xs transition-colors hover:bg-muted/50"
                            onclick={() => loadFromHistory(entry)}
                        >
                            <div class="flex items-center justify-between">
                                <span class="truncate font-medium">
                                    {entry.model === 'default'
                                        ? '기본값'
                                        : (models.find((m) => m.id === entry.model)?.name ??
                                          '알 수 없음')}
                                </span>
                                <span class="text-muted-foreground"
                                    >{formatTime(entry.timestamp)}</span
                                >
                            </div>
                            <p class="mt-1 truncate text-muted-foreground">
                                {(entry.result ?? '').slice(0, 50)}...
                            </p>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 생성 결과 미리보기 (done 상태) -->
        {#if stage === 'done' && generatedResult}
            <div class="space-y-2">
                <span class="text-sm font-medium text-foreground/80">생성 결과</span>
                <div class="max-h-60 overflow-y-auto rounded-md border bg-muted/30 p-3">
                    <p class="text-sm whitespace-pre-wrap">{generatedResult}</p>
                </div>
            </div>
        {/if}

        <!-- 버튼 -->
        <div class="flex justify-between border-t pt-3">
            {#if stage === 'done' && generatedResult}
                <Button variant="outline" size="sm" onclick={handleNewGeneration}>
                    <RefreshCw class="mr-1 size-4" />
                    새로 생성
                </Button>
                <Button size="sm" onclick={handleInsert}>
                    <Check class="mr-1 size-4" />
                    삽입
                </Button>
            {:else}
                <Button variant="outline" size="sm" onclick={onClose}>취소</Button>
                <Button
                    size="sm"
                    onclick={handleGenerate}
                    disabled={isGenerating ||
                        isLoadingModels ||
                        models.length === 0 ||
                        (!hasSelectedText && !userPrompt.trim())}
                >
                    {#if isGenerating}
                        <Spinner class="mr-1 size-4" />
                        생성 중...
                    {:else}
                        <Sparkles class="mr-1 size-4" />
                        생성
                    {/if}
                </Button>
            {/if}
        </div>
    {:else if stage === 'generating'}
        <!-- 생성 중 상태 -->
        <div class="flex flex-col items-center gap-3 py-6">
            <Spinner class="size-6" />
            <div class="text-center">
                <p class="text-sm font-medium">텍스트 생성 중...</p>
                <p class="text-xs text-muted-foreground">잠시만 기다려 주세요</p>
            </div>
        </div>

        <div class="flex justify-end border-t pt-3">
            <Button variant="outline" size="sm" onclick={handleCancelGeneration}>취소</Button>
        </div>
    {/if}
</div>
