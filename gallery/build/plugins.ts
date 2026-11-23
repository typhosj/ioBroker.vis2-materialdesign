import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

import { firstParagraph } from './docText';
import { repoRoot } from './paths';
import { templateFiles } from './templates';
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

// publicDir is the widget build's static folder, so the demo page lives beside the gallery and is served and emitted here.
export function iframeDemo(): Plugin {
    const file = join(repoRoot, 'gallery/public/iframe-demo.html');
    return {
        name: 'gallery-iframe-demo',
        configureServer(server) {
            server.middlewares.use('/iframe-demo.html', (_req, res) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(readFileSync(file));
            });
        },
        generateBundle() {
            this.emitFile({ type: 'asset', fileName: 'iframe-demo.html', source: readFileSync(file) });
        },
    };
}

export function importTemplates(): Plugin {
    return {
        name: 'gallery-import-templates',
        configureServer(server) {
            server.middlewares.use('/templates', (req, res) => {
                const source = templateFiles()[`templates${(req.url ?? '').split('?')[0]}`];
                res.statusCode = source ? 200 : 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(source);
            });
        },
        generateBundle() {
            for (const [fileName, source] of Object.entries(templateFiles())) {
                this.emitFile({ type: 'asset', fileName, source });
            }
        },
    };
}
