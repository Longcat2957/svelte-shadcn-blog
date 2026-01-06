<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { authState, login, logout } from "$lib/mock/auth.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import User from "@lucide/svelte/icons/user";
    import LogOut from "@lucide/svelte/icons/log-out";
    import Settings from "@lucide/svelte/icons/settings";
    import Menu from "@lucide/svelte/icons/menu";
    import { ThemeSelector } from "$lib/components/ui/theme-selector";
    import { page } from "$app/stores";
    import { sidebarOpen } from "$lib/components/layout/sidebar.svelte";
    import SearchBar from "./search-bar.svelte";

    let { onMenuClick } = $props<{ onMenuClick?: () => void }>();
</script>

<div class="flex h-14 items-center justify-between w-full px-4 md:px-8">
    <div class="flex items-center gap-6">
        <div class="flex items-center gap-4">
            <Button variant="ghost" size="icon" class="md:hidden" onclick={onMenuClick}>
                <Menu class="h-5 w-5" />
                <span class="sr-only">Toggle menu</span>
            </Button>
            
            <div class="flex items-center gap-2">
                <a href="/" class="flex items-center space-x-2 mr-2">
                    <span class="font-bold inline-block text-lg">My Blog</span>
                </a>
            </div>
        </div>
        
        <nav class="hidden md:flex items-center gap-4 text-sm font-medium">
            <a href="/about" class="transition-colors hover:text-foreground/80 {$page.url.pathname === '/about' ? 'text-foreground' : 'text-foreground/60'}">About</a>
        </nav>
    </div>

    <div class="flex flex-1 items-center justify-end px-4">
        <SearchBar class="hidden md:flex" expandable={true} />
    </div>

    <div class="flex items-center gap-2">
        <ThemeSelector />
        <nav class="flex items-center gap-2">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Button {...props} variant="ghost" size="icon" class="rounded-full">
                            <User class="h-5 w-5" />
                            <span class="sr-only">User menu</span>
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-56">
                    <DropdownMenu.Label class="font-normal">
                        <div class="flex flex-col space-y-1">
                            <p class="text-sm font-medium leading-none">
                                {authState.isLoggedIn ? 'Admin User' : 'Guest'}
                            </p>
                            <p class="text-xs leading-none text-muted-foreground">
                                {authState.isLoggedIn ? 'admin@example.com' : 'Please log in'}
                            </p>
                        </div>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    {#if authState.isLoggedIn}
                        <DropdownMenu.Item onclick={() => (window.location.href = '/admin')}>
                            <Settings class="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item onclick={logout}>
                            <LogOut class="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenu.Item>
                    {:else}
                        <DropdownMenu.Item onclick={login}>
                            <User class="mr-2 h-4 w-4" />
                            <span>Login</span>
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </nav>
    </div>
</div>
