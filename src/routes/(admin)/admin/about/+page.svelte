<script lang="ts">
    import PageEditor from '$lib/components/admin/page-editor.svelte';

    let aboutContent = '# About Me\n\nWelcome to my blog! I am a software engineer...';
    let title = 'About Me';

    function handleSave(data: { title: string, content: string }) {
        console.log('Saving About page:', data);
        // 실제 데이터베이스 반영 로직 (Mock)
    }
</script>

<PageEditor 
    pageName="About" 
    title={title} 
    content={aboutContent} 
    onSave={handleSave} 
/>
