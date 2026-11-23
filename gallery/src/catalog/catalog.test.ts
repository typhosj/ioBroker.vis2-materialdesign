import { beforeAll, describe, expect, it } from 'vitest';

import { themeStates } from '../../build/themeStates';
import scenarioJson from '../../scenario/scenario.json';
import { installShim } from '../runtime/GalleryRxWidget';
import { validateScenario } from '../runtime/scenario';
import { VIEWS } from '../views/views';

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

    it('points every variant view field at a gallery view', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const { expandFields } = await import('../runtime/widgetInfo');
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            for (const variant of catalogEntry(module, info).variants) {
                for (const { key, field } of expandFields(info, variant.data)) {
                    const value = variant.data[key];
                    if ((field as { type?: string }).type === 'views' && typeof value === 'string' && value && !(value in VIEWS)) problems.push(`${module}/${variant.id}: ${key} = ${value}`);
                }
            }
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('shows a gallery view in the default variant of every widget with a views field', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const { expandFields, isHidden } = await import('../runtime/widgetInfo');
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            const data = catalogEntry(module, info).variants.find(v => v.id === 'default')!.data;
            const viewKeys = expandFields(info, data).filter(entry => (entry.field as { type?: string }).type === 'views' && !isHidden(entry, data)).map(({ key }) => key);
            if (viewKeys.length && !viewKeys.some(key => typeof data[key] === 'string' && data[key] in VIEWS)) problems.push(module);
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('offers the default plus at least two variants for every shown widget', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const thin: string[] = [];
        for (const { module } of widgetIndex) {
            const entry = catalogEntry(module, (await loadWidget(module)).getWidgetInfo());
            if (!entry.excluded && entry.variants.length < 3) thin.push(`${module}: ${entry.variants.length}`);
        }
        expect(thin).toEqual([]);
    }, 120_000);

    it('documents the expected data point for every widget with an oid field', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const missing: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            const hasOid = info.visAttrs.some(g => g.fields.some(f => (f as { name?: string }).name === 'oid'));
            if (hasOid && !catalogEntry(module, info).expects.length) missing.push(module);
        }
        expect(missing).toEqual([]);
    }, 120_000);

    it('writes hand-made variants only with fields the widget declares', async () => {
        const { loadWidget } = await import('../runtime/widgets');
        const { HAND_VARIANTS } = await import('./catalog');
        const { defaultData, expandFields } = await import('../runtime/widgetInfo');
        const problems: string[] = [];
        for (const [module, variants] of Object.entries(HAND_VARIANTS)) {
            const info = (await loadWidget(module)).getWidgetInfo();
            for (const variant of variants) {
                const known = new Set(expandFields(info, { ...defaultData(info), ...variant.data }).map(({ key }) => key));
                for (const key of Object.keys(variant.data)) if (!known.has(key)) problems.push(`${module}/${variant.id}: ${key}`);
            }
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('keeps variant ids unique per module', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const duplicates: string[] = [];
        for (const { module } of widgetIndex) {
            const ids = catalogEntry(module, (await loadWidget(module)).getWidgetInfo()).variants.map(v => v.id);
            for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) duplicates.push(`${module}/${id}`);
        }
        expect(duplicates).toEqual([]);
    }, 120_000);

    it('keeps expects entries unique by attribute and type', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const duplicates: string[] = [];
        for (const { module } of widgetIndex) {
            const keys = catalogEntry(module, (await loadWidget(module)).getWidgetInfo()).expects.map(e => `${e.attr}:${e.type}`);
            for (const key of new Set(keys.filter((x, i) => keys.indexOf(x) !== i))) duplicates.push(`${module}/${key}`);
        }
        expect(duplicates).toEqual([]);
    }, 120_000);
});