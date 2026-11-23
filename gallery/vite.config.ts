import react from '@vitejs/plugin-react';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { reactAlias, repoRoot } from './build/paths';
import { iframeDemo, virtualModules } from './build/plugins';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: './',
    // The widget CSS asks for ../img/*.woff2, which only exists in the widget build's static dir.
    publicDir: join(repoRoot, 'src-widgets-ts/static'),
    plugins: [react(), virtualModules(), iframeDemo()],
    resolve: { alias: reactAlias() },
    server: { fs: { allow: [repoRoot] } },
    build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});