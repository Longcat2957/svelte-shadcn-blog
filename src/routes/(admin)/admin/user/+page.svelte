<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Alert from '$lib/components/ui/alert';
    import { readErrorMessage } from '$lib/utils/http';
    import Loader2 from '@lucide/svelte/icons/loader-2';
    import Upload from '@lucide/svelte/icons/upload';

    let username = $state('');
    let avatarUrl = $state('');
    let loading = $state(true);
    let saving = $state(false);
    let uploading = $state(false);
    let errorMessage = $state<string | null>(null);
    let successMessage = $state<string | null>(null);
    let fileInput = $state<HTMLInputElement | null>(null);

    async function loadUser() {
        loading = true;
        try {
            const res = await fetch('/api/admin/user');
            if (res.ok) {
                const data = await res.json();
                username = data.user.username;
                avatarUrl = data.user.avatar_url || '';
            } else {
                errorMessage = await readErrorMessage(res);
            }
        } catch (e) {
            errorMessage = 'Failed to load user data';
        } finally {
            loading = false;
        }
    }

    async function save() {
        if (saving) return;
        saving = true;
        errorMessage = null;
        successMessage = null;

        try {
            const res = await fetch('/api/admin/user', {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    username,
                    avatar_url: avatarUrl || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                username = data.user.username;
                avatarUrl = data.user.avatar_url || '';
                successMessage = 'Profile updated successfully.';
            } else {
                errorMessage = await readErrorMessage(res);
            }
        } catch (e) {
            errorMessage = 'Failed to save changes';
        } finally {
            saving = false;
        }
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        uploading = true;
        errorMessage = null;
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/images/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await readErrorMessage(res);
                throw new Error(err || 'Upload failed');
            }

            const data = await res.json();
            avatarUrl = data.url;
            successMessage = "Image uploaded successfully. Don't forget to save changes.";
        } catch (err: any) {
            errorMessage = err.message || 'Image upload failed';
        } finally {
            uploading = false;
            if (fileInput) fileInput.value = '';
        }
    }

    $effect(() => {
        loadUser();
    });
</script>

<div class="mx-auto max-w-5xl space-y-8 pb-12">
    <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">User Profile</h1>
        <p class="text-sm text-muted-foreground">Manage your admin profile settings.</p>
    </div>

    {#if loading}
        <div class="flex items-center justify-center p-8">
            <Loader2 class="size-8 animate-spin text-muted-foreground" />
        </div>
    {:else}
        <div class="space-y-6">
            {#if errorMessage}
                <Alert.Root variant="destructive">
                    <Alert.Title>Error</Alert.Title>
                    <Alert.Description>{errorMessage}</Alert.Description>
                </Alert.Root>
            {/if}
            {#if successMessage}
                <Alert.Root>
                    <Alert.Title>Success</Alert.Title>
                    <Alert.Description>{successMessage}</Alert.Description>
                </Alert.Root>
            {/if}

            <div class="grid gap-6">
                <!-- Avatar Section -->
                <div class="flex flex-col items-center gap-4 sm:flex-row">
                    <Avatar.Root class="size-24 border-2 border-border">
                        <Avatar.Image src={avatarUrl} alt={username} />
                        <Avatar.Fallback class="text-2xl"
                            >{username.slice(0, 2).toUpperCase()}</Avatar.Fallback
                        >
                    </Avatar.Root>
                    <div class="w-full flex-1 space-y-2">
                        <label
                            for="avatar_url"
                            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Avatar URL
                        </label>
                        <div class="flex gap-2">
                            <Input
                                id="avatar_url"
                                placeholder="https://example.com/avatar.png"
                                bind:value={avatarUrl}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                bind:this={fileInput}
                                onchange={handleFileSelect}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={uploading}
                                onclick={() => fileInput?.click()}
                                aria-label="Upload image"
                            >
                                {#if uploading}
                                    <Loader2 class="size-4 animate-spin" />
                                {:else}
                                    <Upload class="size-4" />
                                {/if}
                            </Button>
                        </div>
                        <p class="text-[0.8rem] text-muted-foreground">
                            Enter a URL or upload an image for your profile picture.
                        </p>
                    </div>
                </div>

                <!-- Username Section -->
                <div class="space-y-2">
                    <label
                        for="username"
                        class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Username
                    </label>
                    <Input id="username" placeholder="admin" bind:value={username} />
                    <p class="text-[0.8rem] text-muted-foreground">This is your login username.</p>
                </div>

                <div class="flex justify-end pt-4">
                    <Button onclick={save} disabled={saving} class="min-w-[120px]">
                        {#if saving}
                            <Loader2 class="mr-2 size-4 animate-spin" />
                            Saving...
                        {:else}
                            Save Changes
                        {/if}
                    </Button>
                </div>
            </div>
        </div>
    {/if}
</div>
