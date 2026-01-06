<script lang="ts">
   import type { PageData } from './$types';
   import { Badge } from '$lib/components/ui/badge';
   import CommentSection from '$lib/components/blog/comment-section.svelte';

   let { data }: { data: PageData } = $props();

   // 임시 테스트용 댓글 데이터 (서버 연동 전)
   const mockComments = [
       {
           id: 1,
           author_name: '테스터',
           content: '정말 유익한 글이네요! 많은 도움이 되었습니다.',
           created_at: new Date('2024-03-20T10:00:00'),
           parent_id: null
       },
       {
           id: 2,
           author_name: 'SvelteFan',
           content: 'Svelte 5의 Runes 문법이 정말 깔끔하군요. 관련해서 더 많은 글 부탁드립니다.',
           created_at: new Date('2024-03-21T14:30:00'),
           parent_id: null
       },
       {
           id: 3,
           author_name: '작성자',
           content: '감사합니다! 조만간 다음 시리즈 연재 예정입니다.',
           created_at: new Date('2024-03-21T16:00:00'),
           parent_id: 2
       }
   ];
</script>

<article class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
   <div class="space-y-4">
       <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">{data.post.title}</h1>
       <div class="flex items-center gap-2 text-muted-foreground">
           <time datetime={data.post.date}>{data.post.date}</time>
           <span>•</span>
           <div class="flex gap-1">
               {#each data.post.tags as tag}
                   <Badge variant="secondary">{tag}</Badge>
               {/each}
           </div>
       </div>
   </div>
   <hr />
   <div class="prose prose-zinc dark:prose-invert min-h-[400px] max-w-none">
       {@html data.post.content}
   </div>

   <CommentSection comments={mockComments} />
</article>
