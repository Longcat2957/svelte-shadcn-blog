<script lang="ts">
    import { page } from '$app/stores';
    import { Button } from '$lib/components/ui/button';
    import ArrowUp from '@lucide/svelte/icons/arrow-up';
    import MessageCircle from '@lucide/svelte/icons/message-circle';

    let showScrollTop = $state(false);

    // 스크롤 감지
    $effect(() => {
        function handleScroll() {
            showScrollTop = window.scrollY > 300;
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    });

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToComments() {
        document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
    }

    // 블로그 포스트 페이지인지 확인
    const isBlogPost = $derived($page.url.pathname.startsWith('/blog/'));
</script>

{#if showScrollTop || isBlogPost}
    <div class="fixed right-6 bottom-6 z-40 flex flex-col gap-1.5 rounded-2xl border-2 border-border/60 bg-background/70 p-2 backdrop-blur-md shadow-lg">
        {#if isBlogPost}
            <Button
                variant="ghost"
                size="icon"
                onclick={scrollToComments}
                class="size-10 rounded-full hover:bg-accent/80 transition-all"
                title="댓글로 이동"
            >
                <MessageCircle class="size-5" />
            </Button>
        {/if}
        {#if showScrollTop}
            {#if isBlogPost}
                <div class="h-px w-6 self-center bg-border/50"></div>
            {/if}
            <Button
                variant="ghost"
                size="icon"
                onclick={scrollToTop}
                class="size-10 rounded-full hover:bg-accent/80 transition-all"
                title="맨 위로"
            >
                <ArrowUp class="size-5" />
            </Button>
        {/if}
    </div>
{/if}
