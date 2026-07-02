<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import * as RadioGroup from '$lib/components/ui/radio-group';
    import { Button } from '$lib/components/ui/button';
    import Upload from '@lucide/svelte/icons/upload';
    import Image from '@lucide/svelte/icons/image';
    import Loader2 from '@lucide/svelte/icons/loader-2';
    import type { Size, Align, InsertEvent } from './image-upload-types';

    let open = $state(false);
    let selectedFile = $state<File | null>(null);
    let size: Size = $state('100');
    let align: Align = $state('center');
    let uploading = $state(false);
    let uploadedUrl = $state<string | null>(null);
    let errorMessage = $state<string | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    let resolveInsert: ((value: InsertEvent | null) => void) | null = null;

    async function openDialog(): Promise<InsertEvent | null> {
        // Reset state
        selectedFile = null;
        size = '100';
        align = 'center';
        uploading = false;
        uploadedUrl = null;
        errorMessage = null;
        open = true;

        return new Promise((resolve) => {
            resolveInsert = resolve;
        });
    }

    function closeDialog(result: InsertEvent | null) {
        open = false;
        if (resolveInsert) {
            resolveInsert(result);
            resolveInsert = null;
        }
    }

    function handleFileSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        selectedFile = files[0]!;
        input.value = '';
        uploadFile();
    }

    async function uploadFile() {
        if (!selectedFile) return;

        uploading = true;
        errorMessage = null;
        uploadedUrl = null;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/admin/images/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `Upload failed: ${res.status}`);
            }

            const data = await res.json();
            uploadedUrl = data.url;
        } catch (err: unknown) {
            errorMessage = err instanceof Error ? err.message : 'Upload failed';
        } finally {
            uploading = false;
        }
    }

    function handleInsert() {
        if (!uploadedUrl || !selectedFile) return;

        closeDialog({
            url: uploadedUrl,
            alt: selectedFile.name,
            size,
            align
        });
    }

    function handleCancel() {
        closeDialog(null);
    }

    function openFilePicker() {
        fileInputRef?.click();
    }

    // Export the openDialog function for external use via bind:this
    export { openDialog };
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Image class="size-5" />
                이미지 업로드
            </Dialog.Title>
            <Dialog.Description>이미지를 업로드하고 크기와 정렬을 선택하세요.</Dialog.Description>
        </Dialog.Header>

        <div class="space-y-6 py-4">
            <!-- File Selection -->
            <div class="space-y-2">
                <span class="text-sm font-medium">파일</span>
                <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    bind:this={fileInputRef}
                    onchange={handleFileSelect}
                />
                <div class="flex gap-2">
                    <Button
                        variant="outline"
                        onclick={openFilePicker}
                        disabled={uploading}
                        class="flex-1"
                    >
                        <Upload class="mr-2 size-4" />
                        파일 선택
                    </Button>
                </div>
                {#if selectedFile}
                    <p class="text-sm text-muted-foreground">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                {/if}
                {#if errorMessage}
                    <p class="text-sm text-destructive">{errorMessage}</p>
                {/if}
                {#if uploading}
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 class="size-4 animate-spin" />
                        업로드 중...
                    </div>
                {/if}
            </div>

            <!-- Size Selection -->
            <div class="space-y-2">
                <span class="text-sm font-medium">크기</span>
                <RadioGroup.Root bind:value={size}>
                    <div class="flex gap-4">
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="100" id="size-100" />
                            <label for="size-100" class="text-sm">100%</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="75" id="size-75" />
                            <label for="size-75" class="text-sm">75%</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="50" id="size-50" />
                            <label for="size-50" class="text-sm">50%</label>
                        </div>
                    </div>
                </RadioGroup.Root>
            </div>

            <!-- Align Selection -->
            <div class="space-y-2">
                <span class="text-sm font-medium">정렬</span>
                <RadioGroup.Root bind:value={align}>
                    <div class="flex gap-4">
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="left" id="align-left" />
                            <label for="align-left" class="text-sm">좌측</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="center" id="align-center" />
                            <label for="align-center" class="text-sm">중앙</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioGroup.Item value="right" id="align-right" />
                            <label for="align-right" class="text-sm">우측</label>
                        </div>
                    </div>
                </RadioGroup.Root>
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={handleCancel}>취소</Button>
            <Button onclick={handleInsert} disabled={!uploadedUrl || uploading}>
                {#if uploading}
                    <Loader2 class="mr-2 size-4 animate-spin" />
                    업로드 중...
                {:else}
                    삽입
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
