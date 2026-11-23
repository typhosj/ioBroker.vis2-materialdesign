import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A string, not new URL(): the jsdom test environment replaces the URL global with one fileURLToPath rejects.
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function reactDir(root: string = repoRoot): string {
    const widgetTree = join(root, 'src-widgets-ts/node_modules');
    return existsSync(join(widgetTree, 'react/package.json')) ? widgetTree : join(root, 'node_modules');
}

// Widget sources and gallery code must share one React; two copies break every hook in PinPad,
// the pickers and the chart canvas ("Invalid hook call").
export function reactAlias(root: string = repoRoot): Array<{ find: RegExp; replacement: string }> {
    const dir = reactDir(root).replace(/\\/g, '/');
    return [{ find: /^(react|react-dom)(\/.*)?$/, replacement: `${dir}/$1$2` }];
}