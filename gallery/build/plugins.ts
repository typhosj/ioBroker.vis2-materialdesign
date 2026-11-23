import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

import { repoRoot } from './paths';
import { m3Schemes, themeStates } from './themeStates';

const modules: Record<string, () => unknown> = {
    'virtual:gallery-theme': () => ({ states: themeStates(), schemes: m3Schemes() }),
    'virtual:gallery-meta': () => ({ version: (JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as { version: string }).version }),
};

export function virtualModules(): Plugin {
    return {
        name: 'gallery-virtual-modules',
        resolveId: id => (id in modules ? `\0${id}` : undefined),
        load(id) {
            const key = id.startsWith('\0') ? id.slice(1) : '';
            return key in modules ? `export default ${JSON.stringify(modules[key]())};` : undefined;
        },
    };
}
