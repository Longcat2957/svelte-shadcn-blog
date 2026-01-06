<script lang="ts">
   import type { PageData } from './$types';
   import { Badge } from '$lib/components/ui/badge';

   let { data }: { data: PageData } = $props();
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
   <div class="prose prose-zinc dark:prose-invert max-w-none">
       {@html data.post.content}
   </div>
</article>
