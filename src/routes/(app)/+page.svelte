<script lang="ts">
    import { posts } from '$lib/mock/posts';
    import { Badge } from '$lib/components/ui/badge';
    import SearchBar from '$lib/components/layout/search-bar.svelte';
    import * as Pagination from "$lib/components/ui/pagination";

    const allTags = [...new Set(posts.flatMap(p => p.tags))];
    let selectedTag = $state<string | null>(null);

    const filteredPosts = $derived(
        selectedTag 
            ? posts.filter(p => p.tags.includes(selectedTag!))
            : posts
    );
</script>

<div class="space-y-8">
    <div class="space-y-6">
        <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">Latest Posts</h1>
            <p class="text-muted-foreground">Thoughts on development, design, and more.</p>
        </div>
        
        <div class="flex flex-wrap gap-2">
            <Badge 
                variant={selectedTag === null ? "default" : "secondary"}
                class="cursor-pointer"
                onclick={() => selectedTag = null}
            >
                All
            </Badge>
            {#each allTags as tag}
                <Badge 
                    variant={selectedTag === tag ? "default" : "secondary"}
                    class="cursor-pointer"
                    onclick={() => selectedTag = tag}
                >
                    {tag}
                </Badge>
            {/each}
        </div>
    </div>

    <div class="grid gap-8">
        {#each filteredPosts as post}
            <div class="group flex flex-col gap-2">
                <a href="/blog/{post.slug}" class="text-xl font-semibold hover:underline decoration-primary decoration-2 underline-offset-4">
                    {post.title}
                </a>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <time datetime={post.date}>{post.date}</time>
                    <span>•</span>
                    <div class="flex gap-1">
                         {#each post.tags as tag}
                             <Badge variant="secondary" class="rounded-sm px-1 py-0 text-xs font-normal">{tag}</Badge>
                         {/each}
                    </div>
                </div>
                <p class="text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.description}
                </p>
            </div>
        {/each}
    </div>

    <div class="flex flex-col items-center pt-8 border-t">
        <Pagination.Root count={100} perPage={10}>
             {#snippet children({ pages, currentPage })}
                <Pagination.Content>
                    <Pagination.Item>
                        <Pagination.PrevButton />
                    </Pagination.Item>
                    {#each pages as page (page.key)}
                        {#if page.type === "page"}
                            <Pagination.Item>
                                <Pagination.Link {page} isActive={currentPage === page.value}>
                                    {page.value}
                                </Pagination.Link>
                            </Pagination.Item>
                        {:else}
                            <Pagination.Item>
                                <Pagination.Ellipsis />
                            </Pagination.Item>
                        {/if}
                    {/each}
                    <Pagination.Item>
                        <Pagination.NextButton />
                    </Pagination.Item>
                </Pagination.Content>
            {/snippet}
        </Pagination.Root>
    </div>
</div>
