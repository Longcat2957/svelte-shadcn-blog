import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
    }
});

const token = env.CF_API_TOKEN;

console.log(`Token: ${token} (Length: ${token ? token.length : 0})`);

async function verify(headerName, headerValue) {
    try {
        console.log(`\nTesting with header: ${headerName}: ${headerValue.substring(0, 10)}...`);
        const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
            headers: {
                [headerName]: headerValue
            }
        });
        const data = await res.json();
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

async function run() {
    await verify('Authorization', `Bearer ${token}`);
    await verify('Authorization', token);
    await verify('X-Auth-Key', token); // Will fail due to missing Email usually
}

run();
