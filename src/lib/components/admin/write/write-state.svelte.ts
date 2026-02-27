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

    async generateDescription() {
        if (!this.content.trim() || this.isGeneratingDescription) return;
        this.isGeneratingDescription = true;
        try {
            const res = await fetch('/api/ai/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt:
                        '주어진 마크다운 콘텐츠를 한글로 요약하세요. SEO에 적합한 간결한 설명으로 1-2문장으로 작성하세요. 불필요한 마크다운 문법은 제거하고 자연스러운 문장으로 작성하세요.',
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
