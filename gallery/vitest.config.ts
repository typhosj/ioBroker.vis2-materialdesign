import { defineConfig } from 'vitest/config';

import { reactAlias, repoRoot } from './build/paths';

export default defineConfig({
    resolve: { alias: reactAlias() },
    test: {
        root: repoRoot,
        environment: 'jsdom',
        include: ['gallery/**/*.test.{ts,tsx}'],
        // Reuses the canvas and localStorage stubs; tests that load widgets replace window.visRxWidget first.
        setupFiles: ['test/widgets.setup.ts'],
    },
});