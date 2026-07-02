import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import PenBox from '@lucide/svelte/icons/pen-box';
import UserRoundPen from '@lucide/svelte/icons/user-round-pen';
import FolderTree from '@lucide/svelte/icons/folder-tree';
import List from '@lucide/svelte/icons/list';
import MessageSquareMore from '@lucide/svelte/icons/message-square-more';
import type { Component } from 'svelte';

export type SitemapItem = {
    name: string;
    type: 'file' | 'folder';
    open?: boolean;
    icon?: Component;
    href?: string;
    children?: SitemapItem[];
};

export const adminSitemap = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Posts', icon: List, href: '/admin/posts' },
    { name: 'Write Post', icon: PenBox, href: '/admin/write' },
    { name: 'Categories', icon: FolderTree, href: '/admin/categories' },
    { name: 'Comments', icon: MessageSquareMore, href: '/admin/comments' },
    { name: 'User', icon: UserRoundPen, href: '/admin/user' }
] as const;
