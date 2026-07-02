import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { consumeRateLimit } from '../../src/lib/server/rate-limit.ts';

const realDateNow = Date.now;

afterEach(() => {
    Date.now = realDateNow;
});

describe('consumeRateLimit', () => {
    it('allows requests until the configured max is exceeded', () => {
        const key = `limit-${Date.now()}-${Math.random()}`;
        const options = { windowMs: 10_000, max: 2 };

        const first = consumeRateLimit(key, options);
        const second = consumeRateLimit(key, options);
        const third = consumeRateLimit(key, options);

        assert.equal(first.limited, false);
        assert.equal(first.remaining, 1);
        assert.equal(second.limited, false);
        assert.equal(second.remaining, 0);
        assert.equal(third.limited, true);
        assert.equal(third.remaining, 0);
    });

    it('starts a new bucket after the window expires', () => {
        const key = `reset-${Date.now()}-${Math.random()}`;
        const options = { windowMs: 1_000, max: 1 };

        Date.now = () => 1_000;
        assert.equal(consumeRateLimit(key, options).limited, false);
        assert.equal(consumeRateLimit(key, options).limited, true);

        Date.now = () => 2_001;
        const reset = consumeRateLimit(key, options);

        assert.equal(reset.limited, false);
        assert.equal(reset.remaining, 0);
    });
});
