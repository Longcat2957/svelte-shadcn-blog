<script lang="ts">
    import type { PageData } from './$types';
    import { page } from '$app/stores';
    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import CommentSection from '$lib/components/blog/comment-section.svelte';
    import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Collapsible from '$lib/components/ui/collapsible';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import ImageIcon from '@lucide/svelte/icons/image';

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

    function toJsonLdScript(data: unknown): string {
        const json = JSON.stringify(data).replace(/</g, '\\u003c');
        return `<script type="application/ld+json">${json}<` + `/script>`;
    }

    const articleJsonLdScript = $derived(
        toJsonLdScript({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: data.post.title,
            description: data.post.description ?? undefined,
            datePublished: data.post.date,
            dateModified: data.post.updatedAt,
            keywords: data.post.tags.join(', '),
            author: data.author ? { '@type': 'Person', name: data.author.username } : undefined,
            publisher: {
                '@type': 'Organization',
                name: $page.data.siteConfig?.name,
                url: $page.data.siteConfig?.url
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': $page.url.href
            },
            url: $page.url.href
        })
    );
</script>

<svelte:head>
    <title>{data.post.title} | {$page.data.siteConfig?.name}</title>
    {#if data.post.description}
        <meta name="description" content={data.post.description} />
        <meta property="og:description" content={data.post.description} />
        <meta name="twitter:description" content={data.post.description} />
    {/if}
    <meta property="og:title" content="{data.post.title} | {$page.data.siteConfig?.name}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content={$page.url.href} />
    <meta property="article:published_time" content={data.post.date} />
    <meta property="article:modified_time" content={data.post.updatedAt} />
    {#each data.post.tags as tag (tag)}
        <meta property="article:tag" content={tag} />
    {/each}
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{data.post.title} | {$page.data.siteConfig?.name}" />
    <link rel="canonical" href={$page.url.href} />
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html articleJsonLdScript}
</svelte:head>

<article class="animate-in duration-500 fade-in slide-in-from-bottom-4">
    <div class="space-y-6">
        <h1
            class="max-w-full text-4xl leading-tight font-extrabold tracking-tight wrap-anywhere lg:text-5xl"
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
                {#each data.post.tags as tag (tag)}
                    <Badge variant="secondary" class="rounded-md px-2 py-0.5 text-xs font-normal"
                        >{tag}</Badge
                    >
                {/each}
            </div>
        </div>
    </div>
    <hr class="mt-2" />

    {#if data.post.thumbnailUrl}
        <Collapsible.Root class="pt-2" open={true}>
            <Collapsible.Trigger
                class="flex w-full items-center gap-2 rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
                <ImageIcon class="size-4" />
                <span>썸네일 보기</span>
                <ChevronDown
                    class="ml-auto size-4 transition-transform duration-200 data-[state=open]:rotate-180"
                />
            </Collapsible.Trigger>
            <Collapsible.Content
                class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
            >
                <div class="py-2">
                    <img
                        src={data.post.thumbnailUrl}
                        alt="Post thumbnail"
                        class="w-full rounded-lg object-cover"
                    />
                </div>
            </Collapsible.Content>
        </Collapsible.Root>
    {/if}

    <MarkdownRenderer
        class="prose min-h-100 max-w-none pt-4 prose-zinc dark:prose-invert"
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
