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
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	interface Category {
		id: number;
		name: string;
		children: Category[];
		isOpen: boolean;
		isEditing: boolean;
	}

	let categories = $state<Category[]>([]);

	async function loadCategories() {
		const res = await fetch('/api/admin/categories');
		if (!res.ok) return;
		const data = (await res.json()) as { items: { id: number; name: string; parentId: number | null; children: any[] }[] };
		const decorate = (items: any[]): Category[] =>
			items.map((c) => ({
				id: c.id,
				name: c.name,
				children: decorate(c.children ?? []),
				isOpen: true,
				isEditing: false
			}));
		categories = decorate(data.items);
	}

	$effect(() => {
		loadCategories();
	});

	function toggleFolder(category: Category) {
		category.isOpen = !category.isOpen;
	}

	async function addChildCategory(parent: Category) {
		const res = await fetch('/api/admin/categories', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: 'New Category', parentId: parent.id })
		});
		if (!res.ok) return;
		await loadCategories();
	}

	async function addRootCategory() {
		const res = await fetch('/api/admin/categories', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: 'New Root Category', parentId: null })
		});
		if (!res.ok) return;
		await loadCategories();
	}

	async function deleteCategory(id: number) {
		const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
		if (!res.ok) return;
		await loadCategories();
	}

	async function saveCategory(category: Category) {
		const name = category.name.trim();
		if (!name) return;
		const res = await fetch(`/api/admin/categories/${category.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (!res.ok) return;
		await loadCategories();
	}

	function handleKeydown(e: KeyboardEvent, category: Category) {
		if (e.key === 'Enter') {
			category.isEditing = false;
			void saveCategory(category);
		}
	}
</script>

<div class="max-w-4xl mx-auto space-y-8">
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

	<div class="bg-card rounded-xl border shadow-sm overflow-hidden">
		<!-- Toolbar -->
		<div class="bg-muted/30 border-b px-4 py-2 flex items-center justify-between">
			<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				<FolderTree class="size-3.5" />
				Structure
			</div>
			<div class="text-[11px] text-muted-foreground">
				더블 클릭하거나 연필 아이콘으로 이름을 수정할 수 있습니다.
			</div>
		</div>

		<div class="p-2 min-h-[400px]">
			{#snippet categoryRow(category: Category, depth: number)}
				<div class="group relative">
					<div
						class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50 {category.isEditing ? 'bg-accent/30 ring-1 ring-primary/20' : ''}"
						style="margin-left: {depth * 1.5}rem"
					>
						<!-- Toggle Arrow -->
						<div class="size-5 flex items-center justify-center">
							{#if category.children.length > 0}
								<button 
									class="size-5 flex items-center justify-center hover:bg-muted rounded-md transition-colors"
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
						<Folder class="size-4 text-primary/70 shrink-0" />

						<!-- Content -->
						<div class="flex-1 min-w-0">
							{#if category.isEditing}
								<input
									class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-medium"
									bind:value={category.name}
									onkeydown={(e) => handleKeydown(e, category)}
									onblur={() => (category.isEditing = false)}
									autofocus
								/>
							{:else}
								<span 
									class="text-sm font-medium truncate cursor-text"
									ondblclick={() => (category.isEditing = true)}
								>
									{category.name}
								</span>
							{/if}
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button 
								variant="ghost" 
								size="icon" 
								class="size-7 hover:text-primary transition-colors"
								onclick={() => addChildCategory(category)}
								title="하위 추가"
							>
								<Plus class="size-3.5" />
							</Button>
							<Button 
								variant="ghost" 
								size="icon" 
								class="size-7 hover:text-primary transition-colors"
								onclick={() => (category.isEditing = true)}
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
										<Trash2 class="size-3.5 mr-2" />
										삭제
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</div>

					{#if category.isOpen && category.children.length > 0}
						<div class="animate-in fade-in slide-in-from-top-1 ml-2.5 border-l border-border/50">
							{#each category.children as child (child.id)}
								{@render categoryRow(child, depth + 1)}
							{/each}
						</div>
					{/if}
				</div>
			{/snippet}

			{#if categories.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-center space-y-4">
					<div class="size-16 rounded-full bg-muted flex items-center justify-center">
						<FolderTree class="size-8 text-muted-foreground/50" />
					</div>
					<div>
						<h3 class="font-semibold text-lg">카테고리가 없습니다</h3>
						<p class="text-sm text-muted-foreground">우측 상단의 버튼을 눌러 첫 카테고리를 만들어보세요.</p>
					</div>
				</div>
			{:else}
				<div class="py-2">
					{#each categories as category (category.id)}
						{@render categoryRow(category, 0)}
					{/each}
				</div>
			{/if}
		</div>
	</div>

</div>
