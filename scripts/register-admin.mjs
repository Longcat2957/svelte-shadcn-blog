import 'dotenv/config';
import postgres from 'postgres';
import { scrypt, randomBytes } from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const username = (process.env.ADMIN_USERNAME ?? '').trim();
const password = process.env.ADMIN_PASSWORD ?? '';

if (!username || !password) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD are required');
    console.error('Example: ADMIN_USERNAME=admin ADMIN_PASSWORD=pass pnpm -s register:admin');
    process.exit(1);
}

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

/** @param {string} pw */
async function hashPassword(pw) {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = await new Promise((resolve, reject) => {
        scrypt(pw, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, buf) => {
            if (err) return reject(err);
            resolve(buf);
        });
    });

    return `scrypt$${salt}$${derivedKey.toString('base64url')}`;
}

const sql = postgres(DATABASE_URL, { max: 1 });

try {
    const existing = await sql`
        select id, username
        from "user"
        where username = ${username}
        limit 1
    `;

    if (existing.length > 0) {
        console.log(`Admin user already exists: ${existing[0].username} (id=${existing[0].id})`);
        process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    const created = await sql`
        insert into "user" (username, password)
        values (${username}, ${passwordHash})
        returning id, username
    `;

    console.log(`Created admin user: ${created[0].username} (id=${created[0].id})`);
} finally {
    await sql.end({ timeout: 5 });
}
