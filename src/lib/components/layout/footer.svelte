<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import Github from '@lucide/svelte/icons/github';
    import Twitter from '@lucide/svelte/icons/twitter';
    import { PUBLIC_GITHUB_URL, PUBLIC_TWITTER_URL } from '$env/static/public';
</script>

<footer class="w-full border-t bg-background py-6 md:px-8 md:py-0">
    <div class="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p
            class="text-center text-sm leading-loose text-balance text-muted-foreground md:text-left"
        >
            Built by <a
                href="https://github.com/Longcat2957"
                class="font-medium underline underline-offset-4"
            >
                Longcat2957
            </a>. The source code is available on
            <a
                href="https://github.com/Longcat2957/svelte-shadcn-blog"
                class="font-medium underline underline-offset-4"
            >
                GitHub
            </a>.
            <span class="ml-2">© 2026 Blog</span>
        </p>
        <div class="flex items-center gap-2">
            <Button variant="ghost" size="icon" href={PUBLIC_GITHUB_URL}>
                <Github class="h-4 w-4" />
                <span class="sr-only">GitHub</span>
            </Button>
            <Button variant="ghost" size="icon" href={PUBLIC_TWITTER_URL}>
                <Twitter class="h-4 w-4" />
                <span class="sr-only">Twitter</span>
            </Button>
        </div>
    </div>
</footer>
