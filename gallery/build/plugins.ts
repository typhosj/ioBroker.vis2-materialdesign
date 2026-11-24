import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

import { START_PAGE_BUDGET, gzipSize, isOverBudget, startPageFiles, testFileNames, type ManifestChunk } from './budget';
import { firstParagraph } from './docText';
import { repoRoot } from './paths';
import { templateFiles, templateNames } from './templates';
import { m3Schemes, themeStates } from './themeStates';

const modules: Record<string, () => unknown> = {
    'virtual:gallery-theme': () => ({ states: themeStates(), schemes: m3Schemes() }),
    'virtual:gallery-meta': () => ({ version: (JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as { version: string }).version, templates: templateNames() }),
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

export function budgetPlugin(): Plugin {
    let config: ResolvedConfig;
    return {
        name: 'gallery-budget',
        apply: 'build',
        config: () => ({ build: { manifest: true } }),
        configResolved: resolved => {
            config = resolved;
        },
        closeBundle() {
            const out = join(config.root, config.build.outDir);
            const emitted = readdirSync(out, { recursive: true, withFileTypes: true })
                .filter(entry => entry.isFile())
                .map(entry => relative(out, join(entry.parentPath, entry.name)).replaceAll('\\', '/'));
            const tests = testFileNames(emitted);
            if (tests.length) {
                throw new Error(`test files in the gallery bundle: ${tests.join(', ')}`);
            }
            const manifest = JSON.parse(readFileSync(join(out, '.vite/manifest.json'), 'utf8')) as Record<string, ManifestChunk>;
            const sizes = startPageFiles(manifest)
                .map(file => ({ file, size: gzipSize(readFileSync(join(out, file))) }))
                .sort((a, b) => b.size - a.size);
            const total = sizes.reduce((sum, { size }) => sum + size, 0);
            const kB = (bytes: number): number => Math.round(bytes / 1024);
            if (isOverBudget(total)) {
                const largest = sizes.slice(0, 5).map(({ file, size }) => `${file} ${kB(size)} kB`).join(', ');
                throw new Error(`start page transfers ${kB(total)} kB, budget ${kB(START_PAGE_BUDGET)} kB: ${largest}`);
            }
            console.log(`gallery start page transfers ${kB(total)} kB gzip (budget ${kB(START_PAGE_BUDGET)} kB)`);
        },
    };
}
export { m3TokensPlugin } from './m3Tokens';
