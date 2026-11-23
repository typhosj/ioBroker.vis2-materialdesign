import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import io from '../../../io-package.json';
import { repoRoot } from '../../build/paths';
import { themeStates } from '../../build/themeStates';
import { GalleryRxWidget, installShim } from './GalleryRxWidget';
import { defaultData, subscribedIds } from './widgetInfo';

const indexPath = join(repoRoot, 'gallery/src/generated/widgetIndex.json');
const modules = io.common.visWidgets.vis2MaterialDesignWidgets.components;

// widgetUtils.tsx reads window.visRxWidget once, when the module is first evaluated.
beforeAll(() => installShim());

describe('widget index', () => {
    it('lists exactly the widgets vis-2 loads; refresh with GALLERY_UPDATE_INDEX=1', async () => {
        const { loadWidget } = await import('./widgets');
        const actual = [];
        for (const module of modules) {
            const info = (await loadWidget(module)).getWidgetInfo();
            actual.push({ module, tpl: info.id, name: info.visName });
        }
        if (process.env.GALLERY_UPDATE_INDEX) writeFileSync(indexPath, `${JSON.stringify(actual, null, 2)}\n`);
        expect(actual, 'run: $env:GALLERY_UPDATE_INDEX=1; npx vitest run --config gallery/vitest.config.ts gallery/src/runtime/widgets.test.ts')
            .toEqual(JSON.parse(readFileSync(indexPath, 'utf8')));
    }, 120_000);

    it('builds every widget on the gallery shim', async () => {
        const { loadWidget } = await import('./widgets');
        for (const module of modules) expect((await loadWidget(module)).prototype instanceof GalleryRxWidget, module).toBe(true);
    }, 120_000);

    it('finds every theme state a widget subscribes with its default data', async () => {
        const { loadWidget } = await import('./widgets');
        const states = themeStates();
        const missing: string[] = [];
        for (const module of modules) {
            const info = (await loadWidget(module)).getWidgetInfo();
            for (const id of subscribedIds(info, defaultData(info))) {
                if (id.startsWith('vis2-materialdesign.0.') && !(id in states)) missing.push(`${module}: ${id}`);
            }
        }
        expect(missing).toEqual([]);
    }, 120_000);
});
