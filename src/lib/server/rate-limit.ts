type RateLimitOptions = {
    windowMs: number;
    max: number;
};

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

type RateLimitResult = {
    limited: boolean;
    retryAfterSeconds: number;
    remaining: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        cleanupExpiredBuckets(now);
        return {
            limited: false,
            retryAfterSeconds: Math.ceil(options.windowMs / 1000),
            remaining: options.max - 1
        };
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    if (existing.count >= options.max) {
        return {
            limited: true,
            retryAfterSeconds,
            remaining: 0
        };
    }

    existing.count += 1;

    return {
        limited: false,
        retryAfterSeconds,
        remaining: options.max - existing.count
    };
}

function cleanupExpiredBuckets(now: number) {
    if (buckets.size < 1000) return;

    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
            buckets.delete(key);
        }
    }
}
