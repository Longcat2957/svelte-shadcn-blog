<script lang="ts">
   import type { PageData } from './$types';
   import { Badge } from '$lib/components/ui/badge';
   import CommentSection from '$lib/components/blog/comment-section.svelte';

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

   <CommentSection
       postId={data.post.id}
       comments={comments.map((c) => ({
           ...c,
           created_at: new Date(c.created_at)
       }))}
   />
</article>
