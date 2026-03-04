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
    const url = formData.get('url');

    let uploadTarget: File | Blob;

    if (url && typeof url === 'string') {
        // 서버에서 URL을 fetch해서 blob으로 변환 (CORS 우회)
        console.log(`[API] Fetching image from URL: ${url}`);
        const imageResponse = await fetch(url);
        if (!imageResponse.ok) {
            console.error(`[API] Failed to fetch image from URL: ${imageResponse.status}`);
            return json({ message: 'Failed to fetch image from URL' }, { status: 400 });
        }
        const contentType = imageResponse.headers.get('content-type');
        const mimeType = contentType?.startsWith('image/') ? contentType : 'image/jpeg';
        const blob = await imageResponse.blob();
        uploadTarget = new File([blob], 'ai-generated.jpg', { type: mimeType });
        console.log(`[API] Fetched image blob, size: ${blob.size}, type: ${mimeType}`);
    } else if (file && file instanceof File) {
        uploadTarget = file;
        console.log(`[API] Received file: ${file.name}, size: ${file.size}`);
    } else {
        console.error('[API] No file or url found in FormData');
        return json({ message: 'No file or url provided' }, { status: 400 });
    }

    try {
        const data = await CloudflareImages.upload(uploadTarget);
        // data.result.variants contains URLs like https://imagedelivery.net/<account_hash>/<image_id>/<variant>
        // Find the /public variant for original quality, fallback to first variant
        const publicUrl = data.result.variants.find(v => v.endsWith('/public'));
        const resultUrl = publicUrl ?? data.result.variants[0];
        console.log('[API] Upload successful, URL:', resultUrl);
        return json({ url: resultUrl });
    } catch (e: any) {
        console.error('[API] Image upload failed in helper:', e);
        return json({ message: e.message || 'Upload failed' }, { status: 500 });
    }
};
