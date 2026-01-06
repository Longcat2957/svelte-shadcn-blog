<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Button } from '$lib/components/ui/button';
    
    let title = $state('');
    let content = $state('');
</script>

<div class="space-y-8 max-w-2xl mx-auto">
    <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">Write Post</h1>
        <p class="text-muted-foreground">Create a new blog post.</p>
    </div>

    <div class="space-y-4">
        <div class="space-y-2">
            <label for="title" class="text-sm font-medium">Title</label>
            <Input id="title" placeholder="Post Title" bind:value={title} />
        </div>
        
        <div class="space-y-2">
            <label for="content" class="text-sm font-medium">Content (Markdown)</label>
            <Textarea id="content" placeholder="Write your post content here..." class="min-h-[400px]" bind:value={content} />
        </div>

        <div class="flex justify-end gap-4">
            <Button variant="outline" href="/admin">Cancel</Button>
            <Button>Publish</Button>
        </div>
    </div>
</div>
