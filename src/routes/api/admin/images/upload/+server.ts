import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '../../_utils';
import { CloudflareImages } from '$lib/server/cloudflare-images';

export const POST: RequestHandler = async (event) => {
    console.log('[API] POST /api/admin/images/upload started');
    const auth = requireAdmin(event);
    if (auth) return auth;

    let formData;
    try {
        formData = await event.request.formData();
    } catch (e) {
        console.error('[API] Failed to parse FormData:', e);
        return json({ message: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        console.error('[API] No file found in FormData');
        return json({ message: 'No file uploaded' }, { status: 400 });
    }

    console.log(`[API] Received file: ${file.name}, size: ${file.size}`);

    try {
        const data = await CloudflareImages.upload(file);
        // data.result.variants usually contains URLs like https://imagedelivery.net/<hash>/<variant>
        // We'll return the first one as the default URL.
        const url = data.result.variants[0];
        console.log('[API] Upload successful, URL:', url);
        return json({ url });
    } catch (e: any) {
        console.error('[API] Image upload failed in helper:', e);
        return json({ message: e.message || 'Upload failed' }, { status: 500 });
    }
};
