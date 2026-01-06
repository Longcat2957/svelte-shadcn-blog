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
            <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div class="flex flex-col space-y-1.5">
                    <h3 class="font-semibold leading-none tracking-tight">{stat.label}</h3>
                </div>
                <div class="p-0 pt-4">
                    <div class="text-2xl font-bold">{stat.value}</div>
                </div>
            </div>
        {/each}
    </div>

    <div class="space-y-4">
        <h2 class="text-xl font-semibold">Recent Posts</h2>
        <div class="rounded-md border">
            <div class="p-4">
                {#each posts as post}
                    <div class="flex items-center justify-between py-4 border-b last:border-0 hover:bg-muted/50 px-2 transition-colors">
                        <div>
                            <div class="font-medium">{post.title}</div>
                            <div class="text-sm text-muted-foreground">{post.date}</div>
                        </div>
                        <Button variant="ghost" size="sm" href={`/admin/write?id=${post.id}`}>Edit</Button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
