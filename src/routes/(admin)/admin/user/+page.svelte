<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Alert from '$lib/components/ui/alert';
    import * as Separator from '$lib/components/ui/separator';
    import { readErrorMessage } from '$lib/utils/http';
    import Loader2 from '@lucide/svelte/icons/loader-2';
    import Upload from '@lucide/svelte/icons/upload';
    import Eye from '@lucide/svelte/icons/eye';
    import EyeOff from '@lucide/svelte/icons/eye-off';

    let username = $state('');
    let avatarUrl = $state('');
    let loading = $state(true);
    let saving = $state(false);
    let uploading = $state(false);
    let errorMessage = $state<string | null>(null);
    let successMessage = $state<string | null>(null);
    let fileInput = $state<HTMLInputElement | null>(null);

    // 비밀번호 변경 관련 상태
    let currentPassword = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');
    let showCurrentPassword = $state(false);
    let showNewPassword = $state(false);
    let showConfirmPassword = $state(false);

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

        // 비밀번호 확인 검증
        if (newPassword && newPassword !== confirmPassword) {
            errorMessage = 'New passwords do not match';
            return;
        }

        saving = true;
        errorMessage = null;
        successMessage = null;

        try {
            const body: Record<string, unknown> = {
                username,
                avatar_url: avatarUrl || null
            };

            // 비밀번호 변경이 요청된 경우에만 포함
            if (newPassword) {
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            const res = await fetch('/api/admin/user', {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                username = data.user.username;
                avatarUrl = data.user.avatar_url || '';
                successMessage = 'Profile updated successfully.';
                // 비밀번호 필드 초기화
                currentPassword = '';
                newPassword = '';
                confirmPassword = '';
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

<div class="mx-auto max-w-5xl space-y-6 pb-12">
    <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">User Profile</h1>
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

                <Separator.Root />

                <!-- Password Section -->
                <div class="space-y-4">
                    <div>
                        <h2 class="text-lg font-semibold">Change Password</h2>
                        <p class="text-[0.8rem] text-muted-foreground">
                            Leave blank to keep your current password.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <label
                            for="current-password"
                            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Current Password
                        </label>
                        <div class="relative">
                            <Input
                                id="current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="Enter current password"
                                bind:value={currentPassword}
                                autocomplete="current-password"
                                class="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                class="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                                onclick={() => (showCurrentPassword = !showCurrentPassword)}
                                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                            >
                                {#if showCurrentPassword}
                                    <EyeOff class="size-4 text-muted-foreground" />
                                {:else}
                                    <Eye class="size-4 text-muted-foreground" />
                                {/if}
                            </Button>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label
                            for="new-password"
                            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            New Password
                        </label>
                        <div class="relative">
                            <Input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="Enter new password (min 8 characters)"
                                bind:value={newPassword}
                                autocomplete="new-password"
                                class="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                class="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                                onclick={() => (showNewPassword = !showNewPassword)}
                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                                {#if showNewPassword}
                                    <EyeOff class="size-4 text-muted-foreground" />
                                {:else}
                                    <Eye class="size-4 text-muted-foreground" />
                                {/if}
                            </Button>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label
                            for="confirm-password"
                            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Confirm New Password
                        </label>
                        <div class="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                bind:value={confirmPassword}
                                autocomplete="new-password"
                                class="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                class="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                                onclick={() => (showConfirmPassword = !showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {#if showConfirmPassword}
                                    <EyeOff class="size-4 text-muted-foreground" />
                                {:else}
                                    <Eye class="size-4 text-muted-foreground" />
                                {/if}
                            </Button>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <Button onclick={save} disabled={saving} class="min-w-30">
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
