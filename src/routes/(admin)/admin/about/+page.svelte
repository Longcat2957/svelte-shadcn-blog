<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Input } from '$lib/components/ui/input';

    let aboutContent = $state('# About Me\n\nWelcome to my blog! I am a software engineer...');
    let title = $state('About Me');
</script>

<div class="space-y-8 max-w-4xl mx-auto pb-12">
    <div class="flex items-center justify-between">
        <div class="space-y-1">
            <h1 class="text-3xl font-bold tracking-tight">Edit About</h1>
            <p class="text-sm text-muted-foreground">Modify the content of your About page.</p>
        </div>
        <Button>Save Changes</Button>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-4">
            <div class="space-y-2">
                <label class="text-sm font-semibold">Page Title</label>
                <Input bind:value={title} />
            </div>
            <div class="space-y-2">
                <label class="text-sm font-semibold">Content (Markdown)</label>
                <div class="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all">
                    <Textarea bind:value={aboutContent} class="min-h-[500px] border-0 focus-visible:ring-0 resize-none p-4" />
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <label class="text-sm font-semibold">Preview</label>
            <div class="prose dark:prose-invert max-w-none border rounded-lg p-6 bg-card/30 min-h-[500px]">
                <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-8">{title}</h1>
                <p>Preview of the markdown content would render here...</p>
                <div class="whitespace-pre-wrap text-muted-foreground">
                    {aboutContent}
                </div>
            </div>
        </div>
    </div>
</div>
