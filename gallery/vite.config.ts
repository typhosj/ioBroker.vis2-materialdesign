import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { reactAlias, repoRoot } from './build/paths';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: './',
    plugins: [react()],
    resolve: { alias: reactAlias() },
    server: { fs: { allow: [repoRoot] } },
    build: { outDir: 'dist', emptyOutDir: true, target: 'chrome89' },
});