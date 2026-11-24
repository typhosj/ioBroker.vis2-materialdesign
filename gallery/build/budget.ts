import { gzipSync } from 'node:zlib';

export const START_PAGE_BUDGET = 2 * 1024 * 1024;

export type ManifestChunk = { file: string; css?: string[]; assets?: string[]; imports?: string[]; dynamicImports?: string[]; isEntry?: boolean };

// Entry + its static imports + the entry's own dynamic imports (main.tsx loads App after installShim)
// with their static imports. Deeper dynamic imports (widget modules, chart.js) are not on the start page.
export function startPageFiles(manifest: Record<string, ManifestChunk>): string[] {
    const files = new Set<string>(['index.html']);
    const seen = new Set<string>();
    const add = (key: string, withDynamic: boolean): void => {
        const chunk = manifest[key];
        if (!chunk || seen.has(key)) {
            return;
        }
        seen.add(key);
        files.add(chunk.file);
        [...(chunk.css ?? []), ...(chunk.assets ?? [])].forEach(file => files.add(file));
        (chunk.imports ?? []).forEach(child => add(child, false));
        if (withDynamic) {
            (chunk.dynamicImports ?? []).forEach(child => add(child, false));
        }
    };
    Object.keys(manifest).filter(key => manifest[key].isEntry).forEach(key => add(key, true));
    return [...files];
}

export function gzipSize(content: Uint8Array | string): number {
    return gzipSync(content).length;
}

export function isOverBudget(bytes: number): boolean {
    return bytes > START_PAGE_BUDGET;
}

// vitest's include glob drops test files before they reach the bundle, so a test chunk can only be caught by name.
export function testFileNames(files: string[]): string[] {
    return files.filter(file => file.includes('.test'));
}
