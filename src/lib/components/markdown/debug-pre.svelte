<script lang="ts">
  let props = $props();
  $effect(() => {
    console.log('PreRenderer props:', props);
  });
</script>

<pre {...props}>
  {@render props.children?.()}
</pre>
