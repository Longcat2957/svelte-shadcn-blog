import FileIcon from '@lucide/svelte/icons/file';

export type SitemapItem = {
    name: string;
    type: 'file' | 'folder';
    open?: boolean;
    icon?: any;
    href?: string;
    children?: SitemapItem[];
};

export const sitemap: SitemapItem[] = [
    {
        name: 'Blog',
        type: 'folder',
        open: true,
        children: [
            { 
                name: 'Development', 
                type: 'folder', 
                open: true,
                children: [
                    { name: 'Svelte', type: 'file', icon: FileIcon, href: '/blog/1' },
                    { name: 'Typescript', type: 'file', icon: FileIcon, href: '/blog/2' }
                ]
            },
            { 
                name: 'Life', 
                type: 'folder',
                children: [
                    { name: 'Review', type: 'file', icon: FileIcon, href: '/blog/3' },
                    { 
                        name: 'Hobby', 
                        type: 'folder',
                        children: [
                            { name: 'Gaming', type: 'file', icon: FileIcon, href: '/blog/4' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: 'Guide',
        type: 'file',
        icon: FileIcon,
        href: '/about'
    }
];

import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import PenBox from '@lucide/svelte/icons/pen-box';
import UserRoundPen from '@lucide/svelte/icons/user-round-pen';
import Navigation from '@lucide/svelte/icons/navigation';

export const adminSitemap = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Write Post', icon: PenBox, href: '/admin/write' },
    { name: 'Edit About', icon: UserRoundPen, href: '/admin/about' }
];
