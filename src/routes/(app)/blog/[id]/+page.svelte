<script lang="ts">
   import type { PageData } from './$types';
   import { Badge } from '$lib/components/ui/badge';
   import CommentSection from '$lib/components/blog/comment-section.svelte';
   import MarkdownRenderer from '$lib/components/markdown/markdown-renderer.svelte';

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
</script>

<article class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
   <div class="space-y-6">
       <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">{data.post.title}</h1>
       <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <div class="flex items-center gap-3">
               <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               </div>
               <div class="flex flex-col text-sm">
                   <span class="font-medium text-foreground">Admin</span>
                   <time class="text-muted-foreground" datetime={data.post.date}>{data.post.date}</time>
               </div>
           </div>
           
           <div class="flex gap-1.5 flex-wrap">
               {#each data.post.tags as tag}
                   <Badge variant="secondary" class="rounded-md px-2 py-0.5 text-xs font-normal">{tag}</Badge>
               {/each}
           </div>
       </div>
   </div>
   <hr />
   <MarkdownRenderer
       class="prose prose-zinc dark:prose-invert min-h-[400px] max-w-none"
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
