import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/public';
import { defaultSiteConfig, type SiteConfig } from '$lib/config/site';

export const load: LayoutServerLoad = async ({ locals }) => {
    const siteConfig: SiteConfig = {
        name: env.PUBLIC_SITE_NAME || defaultSiteConfig.name,
        description: env.PUBLIC_SITE_DESCRIPTION || defaultSiteConfig.description,
        url: env.PUBLIC_SITE_URL || defaultSiteConfig.url,
        locale: defaultSiteConfig.locale,
        author: env.PUBLIC_SITE_AUTHOR || defaultSiteConfig.author
    };

    return {
        user: locals.user,
        siteConfig
    };
};
