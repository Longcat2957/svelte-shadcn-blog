import FileIcon from '@lucide/svelte/icons/file';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import FolderIcon from '@lucide/svelte/icons/folder';

export const sitemap = [
    {
        name: 'Overview',
        type: 'folder',
        open: true,
        children: [
             { name: 'Home', type: 'file', icon: FileIcon, href: '/' },
             { name: 'About', type: 'file', icon: FileIcon, href: '/about' }
        ]
    },
    {
        name: 'Blog',
        type: 'folder',
        open: true,
        children: [
            { name: 'All Posts', type: 'file', icon: FileIcon, href: '/' }
        ]
    },
    {
        name: 'Admin',
        type: 'folder',
        open: true,
        children: [
            { name: 'Dashboard', type: 'file', icon: LayoutDashboard, href: '/admin' },
            { name: 'Write', type: 'file', icon: FileIcon, href: '/admin/write' },
            { name: 'Login', type: 'file', icon: FileIcon, href: '/admin/login' }
        ]
    }
];
