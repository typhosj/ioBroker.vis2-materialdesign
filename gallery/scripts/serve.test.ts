import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// @ts-expect-error plain .mjs without declarations
import { createGalleryServer } from './serve.mjs';

const server = createGalleryServer();
let base = '';
beforeAll(async () => {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise(resolve => server.close(resolve)));

// fetch normalises dot segments before sending, so the raw requests go through node:http.
const rawStatus = async (path: string): Promise<number> => {
    const { request } = await import('node:http');
    return new Promise((resolve, reject) => {
        request({ host: '127.0.0.1', port: Number(new URL(base).port), path }, res => { res.resume(); resolve(res.statusCode ?? 0); }).on('error', reject).end();
    });
};

describe('serve.mjs', () => {
    it('refuses paths that leave the dist folder', async () => {
        for (const path of ['/..%2F..%2Fpackage.json', '/%2e%2e/%2e%2e/package.json', '/..%5C..%5Cpackage.json', '/../../package.json']) {
            expect([403, 404], path).toContain(await rawStatus(path));
        }
    });
    it('answers 404 for a missing file and 400 for a broken escape', async () => {
        expect(await rawStatus('/no-such-file.js')).toBe(404);
        expect(await rawStatus('/%E0%A4%A')).toBe(400);
    });
});
