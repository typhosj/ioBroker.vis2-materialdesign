import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(import.meta.url);
const root = join(dirname(here), '..', 'dist') + sep;
const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.woff2': 'font/woff2',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
};

/** Serves gallery/dist without compression; requests outside it get 403. */
export function createGalleryServer() {
    return createServer((request, response) => {
        let file;
        try {
            file = join(root, normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)));
        } catch {
            return void response.writeHead(400).end();
        }
        if (file !== root && !file.startsWith(root.endsWith(sep) ? root : root + sep)) {
            return void response.writeHead(403).end();
        }
        if (existsSync(file) && statSync(file).isDirectory()) {
            file = join(file, 'index.html');
        }
        if (!existsSync(file)) {
            return void response.writeHead(404).end();
        }
        response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(response);
    });
}

if (process.argv[1] === here) {
    const port = Number(process.argv[2] ?? 4173);
    createGalleryServer().listen(port, () => console.log(`gallery on http://localhost:${port}/`));
}
