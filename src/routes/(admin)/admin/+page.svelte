<script lang="ts">
    import { stats } from '$lib/mock/admin';
    import { posts } from '$lib/mock/posts';
    import { Button } from '$lib/components/ui/button';
    import Plus from '@lucide/svelte/icons/plus';
</script>

<div class="space-y-8">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button href="/admin/write">
            <Plus class="mr-2 h-4 w-4" /> New Post
        </Button>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        {#each stats as stat}
            <div class="rounded-xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm p-6 transition-all hover:bg-card">
                <div class="flex flex-col space-y-1.5">
                    <h3 class="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                </div>
                <div class="p-0 pt-2">
                    <div class="text-2xl font-bold tracking-tight">{stat.value}</div>
                </div>
            </div>
        {/each}
    </div>

    <div class="space-y-4 pt-4">
        <h2 class="text-xl font-bold tracking-tight">Recent Posts</h2>
        <div class="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
            <div class="divide-y divide-border/50">
                {#each posts as post}
                    <div class="flex items-center justify-between py-4 px-6 hover:bg-muted/30 transition-colors">
                        <div class="min-w-0">
                            <div class="font-semibold truncate">{post.title}</div>
                            <div class="text-xs text-muted-foreground mt-1">{post.date}</div>
                        </div>
                        <Button variant="outline" size="sm" class="ml-4 h-8" href={`/admin/write?id=${post.id}`}>Edit</Button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
