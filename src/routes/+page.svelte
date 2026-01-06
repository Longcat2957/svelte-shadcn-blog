<script lang="ts">
    import { posts } from '$lib/mock/posts';
    import { Badge } from '$lib/components/ui/badge';
</script>

<div class="space-y-8">
    <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Latest Posts</h1>
        <p class="text-muted-foreground">Thoughts on development, design, and more.</p>
    </div>

    <div class="grid gap-8">
        {#each posts as post}
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
</div>
