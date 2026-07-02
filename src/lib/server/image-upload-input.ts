export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const REMOTE_FETCH_TIMEOUT_MS = 10_000;
export const MAX_REDIRECTS = 3;
export const IMAGE_UPLOAD_ERROR = 'Image upload failed';

export class UploadInputError extends Error {
    readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export function validateImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
        throw new UploadInputError('Only image files are allowed');
    }

    if (file.size > MAX_IMAGE_BYTES) {
        throw new UploadInputError('Image is too large');
    }
}

export function isRedirectResponse(status: number) {
    return status >= 300 && status < 400;
}

export function extensionFromMime(mimeType: string) {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/gif') return 'gif';
    if (mimeType === 'image/svg+xml') return 'svg';
    return 'jpg';
}

export async function readLimitedResponseBody(response: Response): Promise<ArrayBuffer[]> {
    const reader = response.body?.getReader();
    if (!reader) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_IMAGE_BYTES) {
            throw new UploadInputError('Remote image is too large');
        }
        return [buffer];
    }

    const chunks: ArrayBuffer[] = [];
    let total = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        total += value.byteLength;
        if (total > MAX_IMAGE_BYTES) {
            throw new UploadInputError('Remote image is too large');
        }
        const copy = new Uint8Array(value.byteLength);
        copy.set(value);
        chunks.push(copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength));
    }

    return chunks;
}

export function isBlockedHostname(hostname: string) {
    const normalized = hostname.toLowerCase().replace(/\.$/, '');

    if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
    if (isIpAddress(normalized)) return isBlockedIp(normalized);

    return false;
}

export function isBlockedIp(address: string) {
    const normalized = address.toLowerCase();

    if (normalized === '::' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
        return true;
    }

    if (normalized.startsWith('::ffff:')) {
        return isBlockedIp(normalized.slice('::ffff:'.length));
    }

    if (
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80:') ||
        normalized.startsWith('2001:db8:')
    ) {
        return true;
    }

    const parts = normalized.split('.').map(Number);
    if (
        parts.length !== 4 ||
        parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
        return false;
    }

    const [a, b] = parts;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
    );
}

function isIpAddress(value: string): boolean {
    return value.includes(':') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value);
}
