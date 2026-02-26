<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/stores';
	import Home from '@lucide/svelte/icons/home';

	const status = $derived($page.status);
	const message = $derived($page.error?.message || '알 수 없는 오류가 발생했습니다.');

	const statusMessages: Record<number, string> = {
		400: '잘못된 요청',
		401: '인증이 필요합니다',
		403: '접근이 거부되었습니다',
		404: '페이지를 찾을 수 없습니다',
		500: '서버 오류',
		502: '잘못된 게이트웨이',
		503: '서비스를 사용할 수 없습니다'
	};

	const statusText = $derived(statusMessages[status] || '오류');
</script>

<svelte:head>
	<title>{status} - {statusText}</title>
</svelte:head>

<div class="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8">
	<div class="text-center">
		<h1 class="text-7xl font-bold text-muted-foreground">{status}</h1>
		<p class="mt-2 text-xl font-medium">{statusText}</p>
		<p class="mt-1 text-sm text-muted-foreground">{message}</p>
	</div>
	<Button href="/" variant="outline">
		<Home class="size-4" />
		홈으로 돌아가기
	</Button>
</div>