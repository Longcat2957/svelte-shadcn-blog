import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto';

type ScryptHash = {
    algo: 'scrypt';
    salt: string;
    hash: string;
};

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

function encode(hash: ScryptHash): string {
    return `${hash.algo}$${hash.salt}$${hash.hash}`;
}

function decode(encoded: string): ScryptHash | null {
    const parts = encoded.split('$');
    if (parts.length !== 3) return null;
    const [algo, salt, hash] = parts;
    if (algo !== 'scrypt') return null;
    if (!salt || !hash) return null;
    return { algo: 'scrypt', salt, hash };
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = await deriveKey(password, salt);

    return encode({ algo: 'scrypt', salt, hash: derivedKey.toString('base64url') });
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
    const parsed = decode(encodedHash);
    if (!parsed) return false;

    const derivedKey = await deriveKey(password, parsed.salt);

    const expected = Buffer.from(parsed.hash, 'base64url');
    if (expected.length !== derivedKey.length) return false;

    return timingSafeEqual(expected, derivedKey);
}

async function deriveKey(password: string, salt: string): Promise<Buffer> {
    return await new Promise((resolve, reject) => {
        scrypt(
            password,
            salt,
            KEY_LEN,
            {
                N: SCRYPT_N,
                r: SCRYPT_R,
                p: SCRYPT_P
            },
            (err, derivedKey) => {
                if (err) return reject(err);
                resolve(derivedKey as Buffer);
            }
        );
    });
}
