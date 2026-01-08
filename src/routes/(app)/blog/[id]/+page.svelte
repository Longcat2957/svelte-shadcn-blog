<script lang="ts">
    import type { PageData } from './$types';
    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import CommentSection from '$lib/components/blog/comment-section.svelte';
    import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
    import * as Avatar from '$lib/components/ui/avatar';

    let { data }: { data: PageData } = $props();

    type Comment = {
        id: number;
        author_name: string;
        content: string;
        created_at: string;
        parent_id: number | null;
    };

    let comments = $state<Comment[]>([]);

    async function loadComments() {
        const res = await fetch(`/api/posts/${data.post.id}/comments`);
        if (!res.ok) return;
        const payload = (await res.json()) as { items: Comment[] };
        comments = payload.items;
    }

    $effect(() => {
        loadComments();
    });

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }
</script>

<article class="animate-in duration-500 fade-in slide-in-from-bottom-4">
    <div class="space-y-6">
        <h1
            class="max-w-full text-4xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] break-words lg:text-5xl"
        >
            {data.post.title}
        </h1>
        <div class="space-y-3 sm:space-y-3">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <Avatar.Root class="h-10 w-10 border">
                        {#if data.author?.avatarUrl}
                            <Avatar.Image
                                src={data.author.avatarUrl}
                                alt={data.author.username}
                                referrerpolicy="no-referrer"
                            />
                        {/if}
                        <Avatar.Fallback class="bg-muted text-xs text-muted-foreground">
                            {data.author?.username?.slice(0, 1) ?? 'A'}
                        </Avatar.Fallback>
                    </Avatar.Root>
                    <div class="flex flex-col text-sm">
                        <span class="font-medium text-foreground"
                            >{data.author?.username ?? 'Admin'}</span
                        >
                        <span class="text-xs text-muted-foreground">
                            {formatDate(data.post.date)}
                        </span>
                    </div>
                </div>

                {#if data.user}
                    <Button
                        href="/admin/write?id={data.post.id}"
                        variant="ghost"
                        size="sm"
                        class="h-6 px-2 text-xs"
                    >
                        수정
                    </Button>
                {/if}
            </div>

            <div
                class="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {#each data.post.tags as tag}
                    <Badge variant="secondary" class="rounded-md px-2 py-0.5 text-xs font-normal"
                        >{tag}</Badge
                    >
                {/each}
            </div>
        </div>
    </div>
    <hr class="mt-2" />
    <MarkdownRenderer
        class="prose min-h-[400px] max-w-none pt-4 prose-zinc dark:prose-invert"
        md={data.post.content}
    />

    <CommentSection
        postId={data.post.id}
        comments={comments.map((c) => ({
            ...c,
            created_at: new Date(c.created_at)
        }))}
    />
</article>
