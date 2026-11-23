import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

import { firstParagraph } from './docText';
import { repoRoot } from './paths';
import { m3Schemes, themeStates } from './themeStates';

const modules: Record<string, () => unknown> = {
    'virtual:gallery-theme': () => ({ states: themeStates(), schemes: m3Schemes() }),
    'virtual:gallery-meta': () => ({ version: (JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as { version: string }).version }),
    'virtual:gallery-docs': () => Object.fromEntries(readdirSync(join(repoRoot, 'doc/en/widgets'))
        .filter(file => file.endsWith('.md') && file !== 'README.md')
        .map(file => [file.replace(/\.md$/, ''), {
            en: firstParagraph(readFileSync(join(repoRoot, 'doc/en/widgets', file), 'utf8')),
            de: firstParagraph(readFileSync(join(repoRoot, 'doc/de/widgets', file), 'utf8')),
        }])),
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
