<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import Plus from '@lucide/svelte/icons/plus';
    import Folder from '@lucide/svelte/icons/folder';
    import FolderPlus from '@lucide/svelte/icons/folder-plus';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Pencil from '@lucide/svelte/icons/pencil';
    import FolderTree from '@lucide/svelte/icons/folder-tree';
    import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
    import ChevronUp from '@lucide/svelte/icons/chevron-up';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import Check from '@lucide/svelte/icons/check';
    import X from '@lucide/svelte/icons/x';
    // Drag & Drop은 추후 추가 (현재는 버튼 기반 reorder만 유지)
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage, readErrorPayload } from '$lib/utils/http';

    interface Category {
        id: number;
        name: string;
        children: Category[];
        isOpen: boolean;
        isEditing: boolean;
        originalName: string;
    }

    let categories = $state<Category[]>([]);
    let errorMessage = $state<string | null>(null);
    let errorVariant = $state<'default' | 'destructive'>('destructive');

    async function loadCategories() {
        const res = await fetch('/api/admin/categories');
        if (!res.ok) {
            errorVariant = 'destructive';
            errorMessage = await readErrorMessage(res);
            return;
        }
        type ApiCategory = {
            id: number;
            name: string;
            parentId: number | null;
            children: ApiCategory[];
        };
        const data = (await res.json()) as {
            items: ApiCategory[];
        };
        const decorate = (items: ApiCategory[]): Category[] =>
            items.map((c) => ({
                id: c.id,
                name: c.name,
                children: decorate(c.children ?? []),
                isOpen: true,
                isEditing: false,
                originalName: c.name
            }));
        categories = decorate(data.items);
    }

    $effect(() => {
        loadCategories();
    });

    function toggleFolder(category: Category) {
        category.isOpen = !category.isOpen;
    }

    function startEditing(category: Category) {
        category.originalName = category.name;
        category.isEditing = true;
    }

    function cancelEditing(category: Category) {
        category.name = category.originalName;
        category.isEditing = false;
    }

    async function addChildCategory(parent: Category) {
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'New Category', parentId: parent.id })
        });
        if (!res.ok) {
            errorVariant = 'destructive';
            errorMessage = await readErrorMessage(res);
            return;
        }
        await loadCategories();
    }

    async function addRootCategory() {
        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'New Root Category', parentId: null })
        });
        if (!res.ok) {
            errorVariant = 'destructive';
            errorMessage = await readErrorMessage(res);
            return;
        }
        await loadCategories();
    }

    async function deleteCategory(id: number) {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const payload = await readErrorPayload<{ code?: string; message?: string }>(res);
            if (payload?.code === 'CATEGORY_IN_USE') {
                errorVariant = 'destructive';
                errorMessage = payload.message ?? '포스트가 연결된 카테고리는 삭제할 수 없습니다.';
                return;
            }
            errorVariant = 'destructive';
            errorMessage =
                payload?.message ??
                (payload ? `${res.status} ${res.statusText}`.trim() : await readErrorMessage(res));
            return;
        }
        await loadCategories();
    }

    async function saveCategory(category: Category) {
        const name = category.name.trim();
        if (!name) return;
        if (name === category.originalName.trim()) {
            category.isEditing = false;
            return;
        }
        const res = await fetch(`/api/admin/categories/${category.id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) {
            errorVariant = 'destructive';
            errorMessage = await readErrorMessage(res);
            return;
        }
        await loadCategories();
    }

    async function persistOrder(parentId: number | null, orderedIds: number[]) {
        const res = await fetch('/api/admin/categories/reorder', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ parentId, orderedIds })
        });
        if (!res.ok) {
            errorVariant = 'destructive';
            errorMessage = await readErrorMessage(res);
        }
    }

    function moveWithin(list: Category[], fromIdx: number, toIdx: number) {
        const next = [...list];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved!);
        return next;
    }

    async function moveUp(parentId: number | null, siblings: Category[], idx: number) {
        if (idx <= 0) return;
        const next = moveWithin(siblings, idx, idx - 1);
        await persistOrder(
            parentId,
            next.map((c) => c.id)
        );
        await loadCategories();
    }

    async function moveDown(parentId: number | null, siblings: Category[], idx: number) {
        if (idx >= siblings.length - 1) return;
        const next = moveWithin(siblings, idx, idx + 1);
        await persistOrder(
            parentId,
            next.map((c) => c.id)
        );
        await loadCategories();
    }

    function handleKeydown(e: KeyboardEvent, category: Category) {
        if (e.key === 'Enter') {
            e.preventDefault();
            void saveCategory(category);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing(category);
        }
    }
</script>

<div class="mx-auto max-w-4xl space-y-8">
    <div class="flex items-end justify-between border-b pb-6">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">카테고리 아키텍처</h1>
            <p class="text-muted-foreground">블로그의 계층 구조를 정의하고 관리합니다.</p>
        </div>
        <Button onclick={addRootCategory} variant="default" class="gap-2 shadow-sm">
            <FolderPlus class="size-4" />
            최상위 추가
        </Button>
    </div>

    {#if errorMessage}
        <Alert.Root variant={errorVariant} class="flex items-start justify-between gap-4">
            <div>
                <Alert.Title>요청이 처리되지 않았습니다</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </div>
            <Button variant="ghost" size="sm" class="shrink-0" onclick={() => (errorMessage = null)}
                >닫기</Button
            >
        </Alert.Root>
    {/if}

    <div class="overflow-hidden rounded-xl border bg-card shadow-sm">
        <!-- Toolbar -->
        <div class="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
            <div
                class="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
                <FolderTree class="size-3.5" />
                Structure
            </div>
            <div class="text-[11px] text-muted-foreground">
                더블 클릭하거나 연필 아이콘으로 이름을 수정할 수 있습니다.
            </div>
        </div>

        <div class="min-h-100 p-2">
            {#snippet categoryRow(
                category: Category,
                depth: number,
                parentId: number | null,
                siblings: Category[],
                index: number
            )}
                <div class="group relative">
                    <div
                        class="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-accent/50 {category.isEditing
                            ? 'bg-accent/30 ring-1 ring-primary/20'
                            : ''}"
                        style="margin-left: {depth * 1.5}rem"
                    >
                        <!-- Toggle Arrow -->
                        <div class="flex size-5 items-center justify-center">
                            {#if category.children.length > 0}
                                <button
                                    class="flex size-5 items-center justify-center rounded-md transition-colors hover:bg-muted"
                                    onclick={() => toggleFolder(category)}
                                >
                                    {#if category.isOpen}
                                        <ChevronDown class="size-3.5 text-muted-foreground" />
                                    {:else}
                                        <ChevronRight class="size-3.5 text-muted-foreground" />
                                    {/if}
                                </button>
                            {/if}
                        </div>

                        <!-- Icon -->
                        <Folder class="size-4 shrink-0 text-primary/70" />

                        <!-- Reorder buttons (same parent) -->
                        <div class="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7"
                                title="위로"
                                onclick={() => moveUp(parentId, siblings, index)}
                                disabled={index === 0}
                            >
                                <ChevronUp class="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7"
                                title="아래로"
                                onclick={() => moveDown(parentId, siblings, index)}
                                disabled={index === siblings.length - 1}
                            >
                                <ChevronDownIcon class="size-3.5" />
                            </Button>
                        </div>

                        <!-- Content -->
                        <div class="min-w-0 flex-1">
                            {#if category.isEditing}
                                <input
                                    class="w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0"
                                    bind:value={category.name}
                                    onkeydown={(e) => handleKeydown(e, category)}
                                    onblur={() => void saveCategory(category)}
                                    aria-label="카테고리 이름"
                                />
                            {:else}
                                <button
                                    type="button"
                                    aria-label="카테고리 이름 수정"
                                    class="cursor-text truncate text-sm font-medium"
                                    ondblclick={() => startEditing(category)}
                                >
                                    {category.name}
                                </button>
                            {/if}
                        </div>

                        <!-- Actions -->
                        <div
                            class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            {#if category.isEditing}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="size-7"
                                    title="저장"
                                    onclick={() => void saveCategory(category)}
                                >
                                    <Check class="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="size-7"
                                    title="취소"
                                    onclick={() => cancelEditing(category)}
                                >
                                    <X class="size-3.5" />
                                </Button>
                            {/if}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7 transition-colors hover:text-primary"
                                onclick={() => addChildCategory(category)}
                                title="하위 추가"
                            >
                                <Plus class="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7 transition-colors hover:text-primary"
                                onclick={() => startEditing(category)}
                            >
                                <Pencil class="size-3.5" />
                            </Button>

                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    <Button variant="ghost" size="icon" class="size-7">
                                        <MoreHorizontal class="size-3.5" />
                                    </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end">
                                    <DropdownMenu.Item
                                        class="text-destructive focus:text-destructive"
                                        onclick={() => deleteCategory(category.id)}
                                    >
                                        <Trash2 class="mr-2 size-3.5" />
                                        삭제
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </div>

                    {#if category.isOpen && category.children.length > 0}
                        <div
                            class="ml-2.5 animate-in border-l border-border/50 fade-in slide-in-from-top-1"
                        >
                            {#each category.children as child, idx (child.id)}
                                {@render categoryRow(
                                    child,
                                    depth + 1,
                                    category.id,
                                    category.children,
                                    idx
                                )}
                            {/each}
                        </div>
                    {/if}
                </div>
            {/snippet}

            {#if categories.length === 0}
                <div class="flex flex-col items-center justify-center space-y-4 py-20 text-center">
                    <div class="flex size-16 items-center justify-center rounded-full bg-muted">
                        <FolderTree class="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">카테고리가 없습니다</h3>
                        <p class="text-sm text-muted-foreground">
                            우측 상단의 버튼을 눌러 첫 카테고리를 만들어보세요.
                        </p>
                    </div>
                </div>
            {:else}
                <div class="py-2">
                    {#each categories as category, idx (category.id)}
                        {@render categoryRow(category, 0, null, categories, idx)}
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
