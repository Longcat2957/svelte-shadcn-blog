import { page } from '$app/state';
import { readErrorMessage } from '$lib/utils/http';
import type { InsertEvent } from '$lib/components/admin/image-upload-types';

export type TagItem = { name: string; count: number };

export type CategoryNode = {
    id: number;
    name: string;
    parentId: number | null;
    children: CategoryNode[];
};

export interface TextAssistantHistory {
    id: string;
    timestamp: Date;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    selectedText: string;
    result: string;
}

interface HistoryEntry {
    content: string;
    selectionStart: number;
    selectionEnd: number;
}

const TAG_FAVORITE_COUNT = 5;
const MAX_HISTORY = 50;

export class WriteState {
    title = $state('');
    description = $state('');
    content = $state('');
    categoryId = $state<number | null>(null);
    viewMode = $state<'edit' | 'preview' | 'split'>('edit');
    tags = $state<string[]>([]);
    tagInput = $state('');
    published = $state(false);

    allTags = $state<TagItem[]>([]);
    tagExpanded = $state(false);

    favoriteTags = $derived(this.allTags.slice(0, TAG_FAVORITE_COUNT));
    remainingTags = $derived(this.allTags.slice(TAG_FAVORITE_COUNT));

    saving = $state(false);
    errorMessage = $state<string | null>(null);
    textareaRef = $state<HTMLTextAreaElement | null>(null);
    imageUploadDialogRef = $state<{ openDialog: () => Promise<InsertEvent | null> } | null>(null);

    // AI 텍스트 어시스턴트 관련 상태
    aiSelectedText = $state('');
    aiSelectionStart = $state(0);
    aiSelectionEnd = $state(0);
    isTextPopoverOpen = $state(false);
    textAssistantStage = $state<'config' | 'generating' | 'done'>('config');
    textAssistantModel = $state<string>('default');
    textAssistantSystemPrompt = $state('');
    textAssistantUserPrompt = $state('');
    textAssistantInsertMode = $state<'replace' | 'append'>('append');
    textAssistantResult = $state<string | null>(null);
    textAssistantHistory = $state<TextAssistantHistory[]>([]);

    // AI 이미지 어시스턴트 관련 상태
    isImagePopoverOpen = $state(false);
    imageAssistantStage = $state<'config' | 'generating' | 'uploading' | 'done'>('config');
    imageAssistantPrompt = $state('');
    imageAssistantMode = $state<'t2i' | 'i2i'>('t2i');

    // 이미지 프롬프트 자동 생성 관련 상태
    imageAssistantSelectedText = $state('');
    imageAssistantSelectionStart = $state(0);
    imageAssistantSelectionEnd = $state(0);
    isGeneratingImagePrompt = $state(false);

    // Description 자동 요약 관련 상태
    isGeneratingDescription = $state(false);

    // 롤백 기능을 위한 히스토리
    contentHistory = $state<HistoryEntry[]>([]);
    historyIndex = $state(-1);

    canUndo = $derived(this.historyIndex > 0);

    categories = $state<CategoryNode[]>([]);
    categoryOptions = $derived(flattenCategories(this.categories));

    get postId(): number | null {
        const raw = page.url.searchParams.get('id');
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    saveToHistory() {
        if (!this.textareaRef) return;
        this.contentHistory = this.contentHistory.slice(0, this.historyIndex + 1);
        this.contentHistory.push({
            content: this.content,
            selectionStart: this.textareaRef.selectionStart,
            selectionEnd: this.textareaRef.selectionEnd
        });
        if (this.contentHistory.length > MAX_HISTORY) {
            this.contentHistory = this.contentHistory.slice(-MAX_HISTORY);
        }
        this.historyIndex = this.contentHistory.length - 1;
    }

    undoHistory() {
        if (this.historyIndex <= 0) return;
        this.historyIndex--;
        const entry = this.contentHistory[this.historyIndex];
        if (entry) {
            this.content = entry.content;
            queueMicrotask(() => {
                this.textareaRef?.focus();
                this.textareaRef?.setSelectionRange(entry.selectionStart, entry.selectionEnd);
            });
        }
    }

    async loadCategories() {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) {
            this.errorMessage = await readErrorMessage(res);
            return;
        }
        const data = (await res.json()) as { items: CategoryNode[] };
        this.categories = data.items;
        if (this.categoryId === null && data.items.length > 0) {
            this.categoryId = data.items[0]!.id;
        }
    }

    async loadPost(id: number) {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) {
            this.errorMessage = await readErrorMessage(res);
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
        this.title = data.item.title;
        this.description = data.item.description ?? '';
        this.content = data.item.content;
        this.tags = data.item.tags;
        this.categoryId = data.item.categoryId;
        this.published = data.item.published;
    }

    async save(): Promise<boolean> {
        if (this.saving) return false;
        if (this.categoryId === null) return false;
        this.saving = true;
        try {
            this.errorMessage = null;
            const payload = {
                title: this.title,
                description: this.description || null,
                content: this.content,
                categoryId: this.categoryId,
                tags: this.tags,
                published: this.published
            };

            const postId = this.postId;
            if (postId) {
                const res = await fetch(`/api/admin/posts/${postId}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    this.errorMessage = await readErrorMessage(res);
                    return false;
                }
            } else {
                const res = await fetch('/api/admin/posts', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    this.errorMessage = await readErrorMessage(res);
                    return false;
                }
                const data = (await res.json()) as { item: { id: number } };
                window.location.href = `/admin/write?id=${data.item.id}`;
            }
            return true;
        } finally {
            this.saving = false;
        }
    }

    addTag() {
        const trimmed = this.tagInput.trim();
        if (trimmed && !this.tags.includes(trimmed)) {
            this.tags = [...this.tags, trimmed];
        }
        this.tagInput = '';
    }

    removeTag(tag: string) {
        this.tags = this.tags.filter((t) => t !== tag);
    }

    toggleTag(tagName: string) {
        if (this.tags.includes(tagName)) {
            this.tags = this.tags.filter((t) => t !== tagName);
        } else {
            this.tags = [...this.tags, tagName];
        }
    }

    async loadTags() {
        const res = await fetch('/api/admin/tags');
        if (!res.ok) return;
        const data = (await res.json()) as { items: TagItem[] };
        this.allTags = data.items;
    }

    insertAtSelection(text: string) {
        if (!this.textareaRef) return;
        const startPos = this.textareaRef.selectionStart;
        const endPos = this.textareaRef.selectionEnd;

        const before = this.content.substring(0, startPos);
        const after = this.content.substring(endPos);
        this.content = before + text + after;

        const nextPos = startPos + text.length;
        queueMicrotask(() => {
            this.textareaRef?.focus();
            this.textareaRef?.setSelectionRange(nextPos, nextPos);
        });
    }

    insertImageMarkdown(event: InsertEvent) {
        const { url, alt, size, align } = event;
        const justifyContent =
            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        const html = `<div style="display: flex; justify-content: ${justifyContent};"><img src="${url}" alt="${alt}" style="width: ${size}%;" /></div>`;
        this.insertAtSelection(html);
    }

    openAITextAssistant() {
        if (!this.textareaRef) return;
        const start = this.textareaRef.selectionStart;
        const end = this.textareaRef.selectionEnd;
        this.aiSelectionStart = start;
        this.aiSelectionEnd = end;
        this.aiSelectedText = this.content.substring(start, end);
        this.isTextPopoverOpen = true;
    }

    handleAITextInsert(text: string, mode: 'replace' | 'append', selStart: number, selEnd: number) {
        this.saveToHistory();

        if (mode === 'replace' && selStart !== selEnd) {
            const before = this.content.substring(0, selStart);
            const after = this.content.substring(selEnd);
            this.content = before + text + after;
            const nextPos = selStart + text.length;
            queueMicrotask(() => {
                this.textareaRef?.focus();
                this.textareaRef?.setSelectionRange(nextPos, nextPos);
            });
        } else {
            const cursorPos = this.textareaRef?.selectionEnd ?? selStart;
            const before = this.content.substring(0, cursorPos);
            const after = this.content.substring(cursorPos);
            this.content = before + text + after;
            const nextPos = cursorPos + text.length;
            queueMicrotask(() => {
                this.textareaRef?.focus();
                this.textareaRef?.setSelectionRange(nextPos, nextPos);
            });
        }

        this.isTextPopoverOpen = false;
    }

    handleAIImageInsert(event: InsertEvent) {
        this.insertImageMarkdown(event);
        this.isImagePopoverOpen = false;
    }

    openImageAssistant() {
        if (!this.textareaRef) return;
        const start = this.textareaRef.selectionStart;
        const end = this.textareaRef.selectionEnd;
        this.imageAssistantSelectionStart = start;
        this.imageAssistantSelectionEnd = end;
        this.imageAssistantSelectedText = this.content.substring(start, end);
        this.isImagePopoverOpen = true;
    }

    async generateImagePrompt(): Promise<string | null> {
        if (this.isGeneratingImagePrompt) return null;
        
        // 선택된 텍스트 또는 전체 내용 사용
        const sourceText = this.imageAssistantSelectedText || this.content;
        if (!sourceText.trim()) {
            this.errorMessage = '프롬프트 생성을 위한 콘텐츠가 없습니다.';
            return null;
        }

        this.isGeneratingImagePrompt = true;
        this.errorMessage = null;

        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: `당신은 이미지 생성 AI를 위한 프롬프트 작성 전문가입니다.
주어진 텍스트 콘텐츠를 분석하여, 해당 내용을 가장 잘 시각화할 수 있는 이미지 프롬프트를 작성하세요.

지침:
1. 텍스트의 핵심 주제, 분위기, 키워드를 추출하세요.
2. 추상적인 개념은 구체적인 시각 요소로 변환하세요.
3. 스타일, 색상, 조명, 구도 등을 명시하세요.
4. 프롬프트는 영어로 작성하세요 (이미지 생성 AI가 영어를 더 잘 이해함).
5. 간결하면서도 상세하게 작성하세요 (50-100단어 권장).
6. 불필요한 설명 없이 프롬프트만 출력하세요.

예시:
입력: "인공지능과 머신러닝의 발전으로 우리 삶이 변화하고 있다."
출력: "A futuristic AI brain neural network visualization, glowing blue and purple neurons connecting in a dark space, digital particles floating around, minimalist clean design, cinematic lighting, 4k quality, tech aesthetic"`,
                    userPrompt: sourceText
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '프롬프트 생성 실패');
            }

            const data = await res.json();
            return data.content ?? '';
        } catch (e: unknown) {
            this.errorMessage = e instanceof Error ? e.message : '프롬프트 생성 중 오류가 발생했습니다.';
            return null;
        } finally {
            this.isGeneratingImagePrompt = false;
        }
    }

    async generateDescription() {
        if (!this.content.trim() || this.isGeneratingDescription) return;
        this.isGeneratingDescription = true;
        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt:
                        '주어진 마크다운 콘텐츠를 한글로 요약하세요. 반드시 1문장, 100자 이내로 작성하세요. 핵심 내용만 간결하게 표현하고 불필요한 마크다운 문법은 제거하세요.',
                    userPrompt: this.content
                })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '요약 생성 실패');
            }
            const data = await res.json();
            this.description = data.content ?? '';
        } catch (e: unknown) {
            this.errorMessage =
                e instanceof Error ? e.message : '요약 생성 중 오류가 발생했습니다.';
        } finally {
            this.isGeneratingDescription = false;
        }
    }

    async handlePaste(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                await this.uploadImageSimple(file);
                break;
            }
        }
    }

    async uploadImageSimple(file: File) {
        if (!this.textareaRef) return;
        const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(7);
        const placeholder = `![Uploading ${file.name}...](${id})`;
        this.insertAtSelection(placeholder);

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
            this.insertImageMarkdown({ url: data.url, alt: file.name, size: '100', align: 'center' });
            this.content = this.content.replace(placeholder, '');
        } catch (err: unknown) {
            this.errorMessage =
                err instanceof Error ? err.message : 'Image upload failed';
            this.content = this.content.replace(placeholder, `[Upload Failed: ${file.name}]`);
        }
    }

    async openImageUploadDialog() {
        if (!this.imageUploadDialogRef) return;
        const result = await this.imageUploadDialogRef.openDialog();
        if (!result) return;
        this.insertImageMarkdown(result);
    }
}

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
