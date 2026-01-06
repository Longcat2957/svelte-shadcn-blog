// See https://svelte.dev/docs/kit/types#app
// for information about these interfaces

declare global {
    namespace App {
        interface Locals {
            user: import('$lib/server/auth/jwt').AuthUser | null;
        }
    }
}

export {};

