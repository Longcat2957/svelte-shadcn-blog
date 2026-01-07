<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Lock } from '@lucide/svelte';

	interface Comment {
		id: number;
		author_name: string;
		content: string;
		created_at: Date;
		parent_id?: number | null;
		is_secret?: boolean;
	}

	let { comments = [], postId }: { comments: Comment[]; postId: number } = $props();
	let items = $state<Comment[]>(comments);

	// Organize comments into parent-child relationship
	let rootComments = $derived(items.filter((c) => !c.parent_id));
	let getReplies = (parentId: number) => items.filter((c) => c.parent_id === parentId);

	$effect(() => {
		items = comments;
	});

	let replyingTo = $state<number | null>(null);
	let submitting = $state(false);

	async function submitComment(form: HTMLFormElement) {
		if (submitting) return;
		submitting = true;
		try {
			const data = new FormData(form);
			const authorName = String(data.get('author_name') ?? '').trim();
			const content = String(data.get('content') ?? '').trim();
			const password = String(data.get('password') ?? '').trim();
			const isSecret = data.get('isSecret') === 'on';
			const parentIdRaw = data.get('parentId');
			const parentId = parentIdRaw ? Number(parentIdRaw) : null;

			if (!authorName || !content) return;
			if (isSecret && !password) {
				alert('비밀 댓글은 비밀번호가 필요합니다.');
				return;
			}

			const res = await fetch('/api/posts/' + postId + '/comments', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ authorName, content, parentId, password, isSecret })
			});
			if (!res.ok) {
				alert('오류가 발생했습니다.');
				return;
			}

			// 성공 시 리로드 (간단히)
			const reload = await fetch('/api/posts/' + postId + '/comments');
			if (!reload.ok) return;
			const payload = (await reload.json()) as { items: Comment[] };
			items = payload.items.map((c) => ({ ...c, created_at: new Date(c.created_at) }));

			form.reset();
			replyingTo = null;
		} finally {
			submitting = false;
		}
	}
</script>

<Collapsible.Root class="group mt-12 border-t pt-2">
	<Collapsible.Trigger class="flex w-full items-center justify-between py-4 hover:bg-muted/30">
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground">💬</span>
			<h2 class="text-base font-bold tracking-tight">댓글 ({items.length})</h2>
		</div>
		<span class="text-xs text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180">
			▼
		</span>
	</Collapsible.Trigger>

	<Collapsible.Content class="space-y-4">
		<div class="pt-2">
			<!-- 댓글 목록 -->
			<div class="space-y-0 text-foreground">
				{#if rootComments.length === 0}
					<p class="border-b border-dashed py-8 text-center text-sm text-muted-foreground">
						첫 번째 댓글을 남겨보세요.
					</p>
				{:else}
					<div class="divide-y border-b">
						{#each rootComments as comment (comment.id)}
							{@const replies = getReplies(comment.id)}
							<div class="space-y-3 py-4">
								<!-- 원댓글 -->
								<div class="flex gap-3">
									<Avatar.Root class="mt-0.5 h-8 w-8 shrink-0 border">
										<Avatar.Fallback class="bg-muted text-[10px] text-muted-foreground">
											{comment.author_name[0]}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex-1 space-y-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-semibold">{comment.author_name}</span>
											<time
												class="text-[10px] text-muted-foreground"
												datetime={comment.created_at.toISOString()}
											>
												{comment.created_at.toLocaleDateString()}
											</time>
										</div>
										<div class="space-y-1">
											{#if comment.is_secret}
												<div class="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium">
													<Lock class="h-3 w-3" />
													<span>비밀 댓글</span>
												</div>
											{/if}
											<p class="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 {comment.is_secret && comment.content === '비밀 댓글입니다.' ? 'text-muted-foreground italic' : ''}">
												{comment.content}
											</p>
										</div>
										<div class="flex items-center gap-4">
											<button
												onclick={() => (replyingTo = replyingTo === comment.id ? null : comment.id)}
												class="text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
											>
												답글 달기
											</button>
										</div>
									</div>
								</div>

								<!-- 대댓글 목록 -->
								{#if replies.length > 0}
									<div class="space-y-4 pl-11">
										{#each replies as reply (reply.id)}
											<div class="flex gap-3">
												<Avatar.Root class="h-7 w-7 shrink-0 border">
													<Avatar.Fallback class="bg-muted text-[10px] text-muted-foreground">
														{reply.author_name[0]}
													</Avatar.Fallback>
												</Avatar.Root>
												<div class="flex-1 space-y-1">
													<div class="flex items-center justify-between">
														<span class="text-xs font-semibold">{reply.author_name}</span>
														<time
															class="text-[10px] text-muted-foreground"
															datetime={reply.created_at.toISOString()}
														>
															{reply.created_at.toLocaleDateString()}
														</time>
													</div>
													<div class="space-y-1">
														{#if reply.is_secret}
															<div class="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium">
																<Lock class="h-2.5 w-2.5" />
																<span>비밀 댓글</span>
															</div>
														{/if}
														<p class="whitespace-pre-wrap text-xs leading-relaxed text-foreground/85 {reply.is_secret && reply.content === '비밀 댓글입니다.' ? 'text-muted-foreground italic' : ''}">
															{reply.content}
														</p>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{/if}

						<!-- 대댓글 작성 폼 -->
						{#if replyingTo === comment.id}
							<div class="animate-in fade-in slide-in-from-top-2 pt-2 pl-11 duration-200">
							<form
								class="grid gap-3"
								onsubmit={(e) => {
									e.preventDefault();
									void submitComment(e.currentTarget);
								}}
							>
									<input type="hidden" name="parentId" value={comment.id} />
									<div class="flex items-center justify-between">
										<h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
											답글 작성
										</h3>
										<button
											type="button"
											onclick={() => (replyingTo = null)}
											class="text-[10px] text-muted-foreground hover:text-foreground"
										>
											취소
										</button>
									</div>
									<Input
										name="author_name"
										placeholder="이름"
										required
										class="h-8 max-w-[150px] bg-transparent text-xs"
									/>
									<Textarea
										name="content"
										placeholder="답글을 입력하세요..."
										class="min-h-[70px] resize-none bg-transparent text-xs"
										required
									/>
									<div class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-3">
											<Input 
												type="password" 
												name="password" 
												placeholder="비밀번호" 
												class="h-7 w-24 text-[11px] bg-transparent" 
											/>
											<label class="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
												<input type="checkbox" name="isSecret" class="rounded border-muted-foreground/30 bg-transparent text-primary focus:ring-1 focus:ring-primary/20 w-3 h-3" />
												비밀글
											</label>
										</div>
										<Button type="submit" size="sm" class="px-6 h-7 text-[11px]" disabled={submitting}>
											답글 등록
										</Button>
									</div>
								</form>
							</div>
						{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- 일반 댓글 작성 폼 (하단) -->
			<div class="mt-8 space-y-4">
				<div class="space-y-1">
					<h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
						새 댓글 작성
					</h3>
				</div>

				<form
					class="grid gap-3"
					onsubmit={(e) => {
						e.preventDefault();
						void submitComment(e.currentTarget);
					}}
				>
					<Input
						name="author_name"
						placeholder="이름"
						required
						class="h-8 max-w-[180px] bg-transparent text-sm"
					/>
					<Textarea
						name="content"
						placeholder="댓글을 입력하세요..."
						class="min-h-[80px] resize-none bg-transparent text-sm"
						required
					/>
					<div class="flex items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<Input 
								type="password" 
								name="password" 
								placeholder="비밀번호" 
								class="h-9 w-32 text-sm bg-transparent" 
							/>
							<label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none font-medium">
								<input type="checkbox" name="isSecret" class="rounded border-muted-foreground/30 bg-transparent text-primary focus:ring-1 focus:ring-primary/20" />
								비밀글
							</label>
						</div>
						<Button type="submit" size="sm" class="px-8" disabled={submitting}>
							댓글 등록
						</Button>
					</div>
				</form>
			</div>
		</div>
	</Collapsible.Content>
</Collapsible.Root>
