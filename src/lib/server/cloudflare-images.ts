import { env } from '$env/dynamic/private';

export class CloudflareImages {
    static async upload(file: File | Blob): Promise<{ result: { variants: string[] } }> {
        const token = env.CF_API_TOKEN?.trim();
        const accountId = env.CF_ACCOUNT_ID?.trim();

        if (!token || !accountId) {
            console.error('Missing CF_API_TOKEN or CF_ACCOUNT_ID');
            throw new Error('Server configuration error: Missing Cloudflare credentials');
        }

        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Cloudflare Upload Error: Status ${response.status}`, errorText);

            let message = `Cloudflare Upload Failed: ${response.status} - ${errorText}`;
            if (response.status === 400 || response.status === 401 || response.status === 403) {
                if (token.length !== 40) {
                    message += `\nHint: The provided CF_API_TOKEN is ${token.length} characters long, but Cloudflare API Tokens are typically 40 characters. Please check if the token is truncated or invalid.`;
                } else {
                    message += "\nHint: Check if CF_API_TOKEN has 'Images: Edit' permission.";
                }
            }
            throw new Error(message);
        }

        return await response.json();
    }
}
