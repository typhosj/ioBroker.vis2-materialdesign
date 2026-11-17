import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = __dirname;

function usedColorTokens(source: string): string[] {
    return [...new Set([...source.matchAll(/var\(\s*(--md-sys-color-[a-z0-9-]+)/g)].map(m => m[1]))];
}

function definedColorTokens(css: string): Set<string> {
    return new Set([...css.matchAll(/(--md-sys-color-[a-z0-9-]+)\s*:/g)].map(m => m[1]));
}

describe('usedColorTokens / definedColorTokens', () => {
    it('yields nothing for an empty file', () => {
        expect(usedColorTokens('')).toEqual([]);
        expect(definedColorTokens('').size).toBe(0);
    });

    it('matches whole names only, not a prefix of a longer token', () => {
        const css = '--md-sys-color-surface-container-high: #fff;';
        expect(definedColorTokens(css).has('--md-sys-color-surface')).toBe(false);
        expect(definedColorTokens(css).has('--md-sys-color-surface-container-high')).toBe(true);
        expect(usedColorTokens("c: 'var(--md-sys-color-surface-container-high)'")).toEqual([
            '--md-sys-color-surface-container-high',
        ]);
    });

    it('ignores fallback values and non-color vars', () => {
        expect(usedColorTokens('var(--md-sys-color-surface, #fff) var(--other)')).toEqual(['--md-sys-color-surface']);
    });
});

describe('theme color tokens used by widgets', () => {
    const defined = definedColorTokens(readFileSync(join(dir, 'material3-tokens.css'), 'utf8'));
    const files = readdirSync(dir).filter(f => f.endsWith('.tsx') && !/\.test\.tsx$/.test(f));

    it('finds widget sources', () => {
        expect(files.length).toBeGreaterThan(0);
    });

    it('defines every --md-sys-color-* token a widget uses', () => {
        const missing: string[] = [];
        for (const f of files) {
            for (const t of usedColorTokens(readFileSync(join(dir, f), 'utf8'))) {
                if (!defined.has(t)) {
                    missing.push(`${f}: ${t}`);
                }
            }
        }
        expect(missing).toEqual([]);
    });
});
