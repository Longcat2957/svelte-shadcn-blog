<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { enhance } from '$app/forms';

    let { form } = $props<{ form?: { message?: string } }>();

    let username = $state('');
    let password = $state('');
</script>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
    <div class="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div class="space-y-2 text-center">
            <h1 class="text-2xl font-bold">Admin Login</h1>
            <p class="text-muted-foreground">Enter your credentials to access the dashboard.</p>
        </div>

        <form method="POST" use:enhance class="space-y-4">
            <div class="space-y-2">
                <label for="username" class="text-sm font-medium">Username</label>
                <Input
                    id="username"
                    name="username"
                    placeholder="admin"
                    bind:value={username}
                    autocomplete="username"
                />
            </div>
            <div class="space-y-2">
                <label for="password" class="text-sm font-medium">Password</label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    bind:value={password}
                    autocomplete="current-password"
                />
            </div>

            {#if form?.message}
                <p class="text-sm text-destructive">{form.message}</p>
            {/if}

            <Button class="w-full" type="submit">Login</Button>
        </form>
    </div>
</div>
