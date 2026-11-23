import { beforeAll, describe, expect, it } from 'vitest';

import { themeStates } from '../../build/themeStates';
import scenarioJson from '../../scenario/scenario.json';
import { installShim } from '../runtime/GalleryRxWidget';
import { validateScenario } from '../runtime/scenario';

beforeAll(() => installShim());

describe('catalog', () => {
    it('has a family, a doc page with text and a default variant for every widget', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry, FAMILIES } = await import('./catalog');
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const entry = catalogEntry(module, (await loadWidget(module)).getWidgetInfo());
            if (!FAMILIES[module]) problems.push(`${module}: no family`);
            if (!entry.excluded && (!entry.description.en || !entry.description.de)) problems.push(`${module}: no description from doc/${entry.doc}`);
            if (!entry.variants.some(v => v.id === 'default')) problems.push(`${module}: no default variant`);
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('points every variant id field at a scenario state or a theme state', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const { subscribedIds } = await import('../runtime/widgetInfo');
        const { states } = validateScenario(scenarioJson);
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            for (const variant of catalogEntry(module, info).variants) {
                for (const id of subscribedIds(info, variant.data)) {
                    if (!(id in states) && !(id in themeStates())) problems.push(`${module}/${variant.id}: ${id}`);
                }
            }
        }
        expect(problems).toEqual([]);
    }, 120_000);
});