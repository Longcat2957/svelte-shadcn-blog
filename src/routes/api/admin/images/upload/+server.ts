import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { assertSameOrigin, requireAdmin } from '../../_utils';
import { CloudflareImages } from '$lib/server/cloudflare-images';
import {
    extensionFromMime,
    IMAGE_UPLOAD_ERROR,
    isBlockedHostname,
    isBlockedIp,
    isRedirectResponse,
    MAX_IMAGE_BYTES,
    MAX_REDIRECTS,
    readLimitedResponseBody,
    REMOTE_FETCH_TIMEOUT_MS,
    UploadInputError,
    validateImageFile
} from '$lib/server/image-upload-input';

export const POST: RequestHandler = async (event) => {
    const auth = requireAdmin(event);
    if (auth) return auth;

    const origin = assertSameOrigin(event);
    if (origin) return origin;

    let formData;
    try {
        formData = await event.request.formData();
    } catch (e) {
        console.error('[API] Failed to parse FormData:', e);
        return json({ message: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    const url = formData.get('url');

    try {
        const uploadTarget = await getUploadTarget(file, url);
        const data = await CloudflareImages.upload(uploadTarget);
        // data.result.variants contains URLs like https://imagedelivery.net/<account_hash>/<image_id>/<variant>
        // Find the /public variant for original quality, fallback to first variant
        const publicUrl = data.result.variants.find((v) => v.endsWith('/public'));
        const resultUrl = publicUrl ?? data.result.variants[0];
        if (!resultUrl) {
            return json(
                { message: 'Upload response did not include an image URL' },
                { status: 502 }
            );
        }
        return json({ url: resultUrl });
    } catch (e: unknown) {
        if (e instanceof UploadInputError) {
            return json({ message: e.message }, { status: e.status });
        }

        console.error('[API] Image upload failed:', e);
        return json({ message: IMAGE_UPLOAD_ERROR }, { status: 500 });
    }
};

async function getUploadTarget(file: FormDataEntryValue | null, url: FormDataEntryValue | null) {
    if (url && typeof url === 'string') {
        return await fetchRemoteImage(url);
    }

    if (file instanceof File) {
        validateImageFile(file);
        return file;
    }

    throw new UploadInputError('No file or url provided');
}

async function fetchRemoteImage(input: string, redirects = 0): Promise<File> {
    if (redirects > MAX_REDIRECTS) {
        throw new UploadInputError('Too many redirects while fetching image');
    }

    const url = await parseAllowedRemoteUrl(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: 'manual'
        });

        if (isRedirectResponse(response.status)) {
            const location = response.headers.get('location');
            if (!location) throw new UploadInputError('Remote image redirect is missing location');
            return await fetchRemoteImage(new URL(location, url).toString(), redirects + 1);
        }

        if (!response.ok) {
            throw new UploadInputError('Failed to fetch image from URL');
        }

        const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
        if (!contentType.startsWith('image/')) {
            throw new UploadInputError('Remote URL did not return an image');
        }

        const contentLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
            throw new UploadInputError('Remote image is too large');
        }

        const chunks = await readLimitedResponseBody(response);
        return new File(chunks, `remote-image.${extensionFromMime(contentType)}`, {
            type: contentType
        });
    } catch (e: unknown) {
        if (e instanceof UploadInputError) throw e;
        throw new UploadInputError('Failed to fetch image from URL');
    } finally {
        clearTimeout(timeout);
    }
}

async function parseAllowedRemoteUrl(input: string) {
    let url: URL;

    try {
        url = new URL(input);
    } catch {
        throw new UploadInputError('Invalid image URL');
    }

    if (url.protocol !== 'https:') {
        throw new UploadInputError('Only HTTPS image URLs are allowed');
    }

    if (isBlockedHostname(url.hostname) || (await resolvesToBlockedAddress(url.hostname))) {
        throw new UploadInputError('Image URL host is not allowed');
    }

    return url;
}

async function resolvesToBlockedAddress(hostname: string) {
    if (isIP(hostname)) return isBlockedIp(hostname);

    try {
        const addresses = await lookup(hostname, { all: true, verbatim: true });
        return addresses.some(({ address }) => isBlockedIp(address));
    } catch {
        throw new UploadInputError('Unable to resolve image URL host');
    }
}
