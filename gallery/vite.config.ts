import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { reactAlias, repoRoot } from './build/paths';
import { virtualModules } from './build/plugins';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: './',
    plugins: [react(), virtualModules()],
    resolve: { alias: reactAlias() },
    server: { fs: { allow: [repoRoot] } },
    build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});