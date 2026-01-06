import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch }) => {
    const res = await fetch('/api/categories');
    const categories = res.ok ? (await res.json()).items : [];

    return {
        categories
    };
};
