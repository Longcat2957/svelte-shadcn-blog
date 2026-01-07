export async function readErrorMessage(res: Response): Promise<string> {
    try {
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            return `${res.status} ${res.statusText}`.trim();
        }
        const data: unknown = await res.json();
        if (typeof data === 'object' && data !== null && 'message' in data) {
            const message = (data as { message?: unknown }).message;
            if (typeof message === 'string' && message.trim()) return message;
        }
        return `${res.status} ${res.statusText}`.trim();
    } catch {
        return `${res.status} ${res.statusText}`.trim();
    }
}

export async function readErrorPayload<T extends object>(res: Response): Promise<T | null> {
    try {
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}
