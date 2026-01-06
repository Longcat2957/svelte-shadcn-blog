import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import PenBox from '@lucide/svelte/icons/pen-box';
import UserRoundPen from '@lucide/svelte/icons/user-round-pen';
import FolderTree from '@lucide/svelte/icons/folder-tree';

export type SitemapItem = {
    name: string;
    type: 'file' | 'folder';
    open?: boolean;
    icon?: any;
    href?: string;
    children?: SitemapItem[];
};

export const adminSitemap = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Write Post', icon: PenBox, href: '/admin/write' },
    { name: 'Categories', icon: FolderTree, href: '/admin/categories' },
    { name: 'Edit About', icon: UserRoundPen, href: '/admin/about' }
];
