<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    import { Switch } from '$lib/components/ui/switch';
    import Folder from '@lucide/svelte/icons/folder';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Plus from '@lucide/svelte/icons/plus';
    import Eye from '@lucide/svelte/icons/eye';
    import Edit3 from '@lucide/svelte/icons/edit-3';
    import X from "@lucide/svelte/icons/x";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Badge } from '$lib/components/ui/badge';
	import { page } from '$app/stores';
	import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';

    let title = $state('');
    let description = $state('');
    let content = $state('');
	// 실제로는 category_id 사용
	let categoryId = $state<number | null>(null);
    let viewMode = $state<'edit' | 'preview'>('edit');
    let tags = $state<string[]>([]);
    let tagInput = $state('');
    let published = $state(false);
	let saving = $state(false);
	let postId = $derived((() => {
		const raw = $page.url.searchParams.get('id');
		if (!raw) return null;
		const n = Number(raw);
		return Number.isFinite(n) ? n : null;
	})());

	type CategoryNode = { id: number; name: string; parentId: number | null; children: CategoryNode[] };
	let categories = $state<CategoryNode[]>([]);
	let categoryOptions = $derived(flattenCategories(categories));

	function flattenCategories(items: CategoryNode[], path: string[] = []): { id: number; label: string }[] {
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
		if (!res.ok) return;
		const data = (await res.json()) as { items: CategoryNode[] };
		categories = data.items;
		if (categoryId === null && data.items.length > 0) {
			categoryId = data.items[0]!.id;
		}
	}

	async function loadPost(id: number) {
		const res = await fetch(`/api/admin/posts/${id}`);
		if (!res.ok) return;
		const data = (await res.json()) as {
			item: { title: string; description: string | null; content: string; tags: string[]; categoryId: number; published: boolean };
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
				if (!res.ok) return;
			} else {
				const res = await fetch('/api/admin/posts', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (!res.ok) return;
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
        tags = tags.filter(t => t !== tag);
    }

	$effect(() => {
		loadCategories();
		if (postId) loadPost(postId);
	});
</script>

<div class="space-y-8 max-w-5xl mx-auto pb-12">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">Write Post</h1>
            <p class="text-sm text-muted-foreground">Create or edit your blog post with markdown support.</p>
        </div>
        
        <div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<Switch id="published" bind:checked={published} />
				<label for="published" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
					Published
				</label>
			</div>

			<div class="flex bg-muted p-1 rounded-lg border shadow-sm">
				<Button 
					variant={viewMode === 'edit' ? 'secondary' : 'ghost'} 
					size="sm" 
					class="gap-2 h-8" 
					onclick={() => viewMode = 'edit'}
				>
					<Edit3 class="size-4" /> Edit
				</Button>
				<Button 
					variant={viewMode === 'preview' ? 'secondary' : 'ghost'} 
					size="sm" 
					class="gap-2 h-8" 
					onclick={() => viewMode = 'preview'}
				>
					<Eye class="size-4" /> Preview
				</Button>
			</div>
		</div>
    </div>

    <div class="space-y-6">
        {#if viewMode === 'edit'}
            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label for="title" class="text-sm font-semibold text-foreground/80 ml-1">Title</label>
                    <Input id="title" placeholder="Enter a catchy title..." bind:value={title} class="bg-card/50 backdrop-blur-sm" />
                </div>

                <div class="space-y-2">
                    <label for="description" class="text-sm font-semibold text-foreground/80 ml-1">Description</label>
                    <Input id="description" placeholder="Short summary of the post..." bind:value={description} class="bg-card/50 backdrop-blur-sm" />
                </div>
                
				<div class="space-y-2">
					<label for="directory" class="text-sm font-semibold text-foreground/80 ml-1">Category</label>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                             {#snippet child({ props })}
                                <Button {...props} variant="outline" class="w-full justify-between bg-card/50 backdrop-blur-sm font-normal">
                                    <div class="flex items-center gap-2">
                                        <Folder class="size-4 text-muted-foreground" />
										<span>
											{categoryOptions.find((c) => c.id === categoryId)?.label ?? 'Select category...'}
										</span>
                                    </div>
                                    <ChevronDown class="size-4 opacity-50" />
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content class="w-[--bits-dropdown-menu-anchor-width] max-h-64 overflow-y-auto">
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

            <div class="space-y-2">
                <label for="tags" class="text-sm font-semibold text-foreground/80 ml-1">Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                    {#each tags as tag}
                        <Badge variant="secondary" class="gap-1 pr-1">
                            {tag}
                            <button 
                                onclick={() => removeTag(tag)}
                                class="hover:text-destructive transition-colors outline-none"
                            >
                                <X class="size-3" />
                            </button>
                        </Badge>
                    {/each}
                </div>
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
            </div>
            
            <div class="space-y-2">
                <label for="content" class="text-sm font-semibold text-foreground/80 ml-1">Content (Markdown)</label>
                <div class="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
                    <Textarea id="content" placeholder="Write your post content here..." class="min-h-[600px] border-0 focus-visible:ring-0 resize-none p-4" bind:value={content} />
                </div>
            </div>
        {:else}
            <!-- Preview Mode -->
            <div class="rounded-xl border bg-card/30 backdrop-blur-sm p-8 md:p-12 min-h-[700px]">
                <div class="max-w-3xl mx-auto space-y-8">
                    <div class="space-y-4">
						<div class="flex items-center gap-2 text-sm text-primary font-medium">
							<Folder class="size-4" />
							{categoryOptions.find((c) => c.id === categoryId)?.label ?? ''}
						</div>
                        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-8">
                            {title || 'Untitiled Post'}
                        </h1>
                        {#if description}
                            <p class="text-xl text-muted-foreground leading-relaxed">
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
						<MarkdownRenderer class="prose dark:prose-invert max-w-none" md={content} />
					{:else}
						<p class="text-muted-foreground italic text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
							No content to preview. Start writing in the Edit tab!
						</p>
					{/if}
                </div>
            </div>
        {/if}

        <div class="flex items-center justify-between border-t pt-6">
            <Button variant="ghost" href="/admin" class="text-muted-foreground hover:text-foreground">
                Discard Changes
            </Button>
            <div class="flex gap-3">
				<Button class="px-8" disabled={saving} onclick={() => save()}>
					Save
				</Button>
            </div>
        </div>
    </div>
</div>
