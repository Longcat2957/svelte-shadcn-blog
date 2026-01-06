<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { goto } from '$app/navigation';

    let email = $state('');
    let password = $state('');

    function handleLogin() {
        // Mock login
        goto('/admin');
    }
</script>

<div class="max-w-md mx-auto mt-20 space-y-6">
    <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold">Admin Login</h1>
        <p class="text-muted-foreground">Enter your credentials to access the dashboard.</p>
    </div>
    
    <div class="space-y-4">
        <div class="space-y-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="admin@example.com" bind:value={email} />
        </div>
        <div class="space-y-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <Input id="password" type="password" bind:value={password} />
        </div>
        <Button class="w-full" onclick={handleLogin}>Login</Button>
    </div>
</div>
