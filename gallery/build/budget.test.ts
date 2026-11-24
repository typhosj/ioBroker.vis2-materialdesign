import { describe, expect, it } from 'vitest';

import { START_PAGE_BUDGET, gzipSize, isOverBudget, startPageFiles, testFileNames } from './budget';

describe('budget', () => {
    it('follows the entry, its static imports and its own dynamic imports, but no deeper dynamic import', () => {
        const manifest = {
            'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_shared.js'], dynamicImports: ['src/pages/App.tsx'], css: ['assets/index.css'] },
            '_shared.js': { file: 'assets/shared.js' },
            'src/pages/App.tsx': { file: 'assets/app.js', imports: ['_catalog.js'], dynamicImports: ['src-widgets-ts/src/MaterialDesignSwitch.tsx'], assets: ['assets/mdi.woff2'] },
            '_catalog.js': { file: 'assets/catalog.js' },
            'src-widgets-ts/src/MaterialDesignSwitch.tsx': { file: 'assets/switch.js' },
        };
        expect(startPageFiles(manifest).sort()).toEqual(['assets/app.js', 'assets/catalog.js', 'assets/index.css', 'assets/index.js', 'assets/mdi.woff2', 'assets/shared.js', 'index.html']);
    });

    it('terminates on an import cycle', () => {
        const manifest = {
            'index.html': { file: 'assets/index.js', isEntry: true, imports: ['a.js'] },
            'a.js': { file: 'assets/a.js', imports: ['b.js'] },
            'b.js': { file: 'assets/b.js', imports: ['a.js'] },
        };
        expect(startPageFiles(manifest).sort()).toEqual(['assets/a.js', 'assets/b.js', 'assets/index.js', 'index.html']);
    });

    it('skips an import that has no manifest key', () => {
        const manifest = { 'index.html': { file: 'assets/index.js', isEntry: true, imports: ['missing.js'], dynamicImports: ['gone.tsx'] } };
        expect(startPageFiles(manifest).sort()).toEqual(['assets/index.js', 'index.html']);
    });

    it('measures gzip size', () => {
        expect(gzipSize('a'.repeat(10_000))).toBeLessThan(200);
    });

    it('passes exactly at the budget and fails one byte over', () => {
        expect(isOverBudget(START_PAGE_BUDGET)).toBe(false);
        expect(isOverBudget(START_PAGE_BUDGET + 1)).toBe(true);
    });

    it('flags emitted test files and passes a normal file list', () => {
        expect(testFileNames(['index.html', 'assets/foo.test-abc.js'])).toEqual(['assets/foo.test-abc.js']);
        expect(testFileNames(['index.html', 'assets/index-abc.js', 'assets/latest-abc.js'])).toEqual([]);
    });
});
