<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Spinner } from '$lib/components/ui/spinner';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Sparkles from '@lucide/svelte/icons/sparkles';
    import { onMount } from 'svelte';

    // 모델 타입
    interface ModelInfo {
        id: string;
        name: string;
        description?: string;
        context_length: number | null;
    }

    // 메이저 모델 제공사 프리픽스 (OpenRouter 형식)
    const MAJOR_PROVIDERS = [
        'openai/',      // OpenAI (GPT 시리즈)
        'anthropic/',   // Anthropic (Claude 시리즈)
        'google/',      // Google (Gemini 시리즈)
    ] as const;

    // 메이저 제공사 모델만 필터링
    function filterMajorModels(models: ModelInfo[]): ModelInfo[] {
        return models.filter(model => 
            MAJOR_PROVIDERS.some(prefix => model.id.startsWith(prefix))
        );
    }

    // 상태
    let models = $state<ModelInfo[]>([]);
    let selectedModel = $state<string>('');
    let insertMode = $state<'replace' | 'append'>('append');
    let systemPrompt = $state('');
    let userPrompt = $state('');
    let isGenerating = $state(false);
    let isLoadingModels = $state(true);
    let error = $state<string | null>(null);

    // Props
    interface Props {
        selectedText?: string;
        selectionStart?: number;
        selectionEnd?: number;
        onInsert?: (text: string, mode: 'replace' | 'append', selectionStart: number, selectionEnd: number) => void;
        onClose?: () => void;
    }

    let { selectedText = '', selectionStart = 0, selectionEnd = 0, onInsert, onClose }: Props = $props();

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
            if (models.length > 0) {
                selectedModel = models[0]!.id;
            }
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

    async function handleGenerate() {
        if (isGenerating) return;

        // 드래그된 텍스트 + 유저 프롬프트 조합
        let finalUserPrompt = '';
        if (selectedText && userPrompt.trim()) {
            // 둘 다 있으면 조합
            finalUserPrompt = `[선택된 텍스트]\n${selectedText}\n\n[요청]\n${userPrompt.trim()}`;
        } else if (selectedText) {
            // 드래그된 텍스트만
            finalUserPrompt = selectedText;
        } else if (userPrompt.trim()) {
            // 유저 프롬프트만
            finalUserPrompt = userPrompt.trim();
        }
        
        if (!finalUserPrompt) return;

        isGenerating = true;
        error = null;

        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt: finalUserPrompt,
                    systemPrompt: systemPrompt.trim() || undefined,
                    model: selectedModel || undefined
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '생성 실패');
            }

            const data = await res.json();
            const generatedText = data.content ?? '';

            onInsert?.(generatedText, insertMode, selectionStart, selectionEnd);
            onClose?.();
        } catch (e: unknown) {
            if (e instanceof Error) {
                error = e.message;
            } else {
                error = '알 수 없는 오류가 발생했습니다.';
            }
        } finally {
            isGenerating = false;
        }
    }
</script>

<div class="w-80 space-y-4 p-4">
    <!-- 헤더 -->
    <div class="flex items-center gap-2 border-b pb-3">
        <Sparkles class="size-5 text-primary" />
        <h3 class="font-semibold">AI 텍스트 어시스턴트</h3>
    </div>

    <!-- 에러 메시지 -->
    {#if error}
        <div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
        </div>
    {/if}

    <!-- 모델 선택 -->
    <div class="space-y-2">
        <label for="model-select" class="text-sm font-medium text-foreground/80">모델 선택</label>
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
                            <span>{models.find(m => m.id === selectedModel)?.name ?? '모델 선택'}</span>
                            <ChevronDown class="size-4 opacity-50" />
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content class="w-[--bits-dropdown-menu-anchor-width]">
                    {#each models as model}
                        <DropdownMenu.Item
                            onclick={() => (selectedModel = model.id)}
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
            onValueChange={(v) => (insertMode = v as 'replace' | 'append')}
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
            bind:value={systemPrompt}
            rows={3}
            class="resize-none"
        />
    </div>

    <!-- 유저 프롬프트 -->
    <div class="space-y-2">
        <label for="user-prompt" class="text-sm font-medium text-foreground/80">
            {#if hasSelectedText}
                추가 지시사항
                <span class="text-xs text-muted-foreground">(선택된 텍스트에 대한 추가 요청)</span>
            {:else}
                유저 프롬프트
            {/if}
        </label>
        <Textarea
            id="user-prompt"
            placeholder={hasSelectedText ? "선택된 텍스트를 어떻게 수정할지 입력하세요..." : "요청 내용을 입력하세요..."}
            bind:value={userPrompt}
            rows={4}
            class="resize-none"
        />
    </div>

    <!-- 생성 버튼 -->
    <Button
        class="w-full"
        onclick={handleGenerate}
        disabled={isGenerating || isLoadingModels || models.length === 0 || (!hasSelectedText && !userPrompt.trim())}
    >
        {#if isGenerating}
            <Spinner class="mr-2 size-4" />
            생성 중...
        {:else}
            <Sparkles class="mr-2 size-4" />
            생성
        {/if}
    </Button>
</div>