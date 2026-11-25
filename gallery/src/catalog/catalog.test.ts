import { beforeAll, describe, expect, it } from 'vitest';

import { themeStates } from '../../build/themeStates';
import scenarioJson from '../../scenario/scenario.json';
import { installShim } from '../runtime/GalleryRxWidget';
import { validateScenario } from '../runtime/scenario';
import { VIEWS } from '../views/views';

beforeAll(() => installShim());

describe('catalog', () => {
    it('has a family and a doc page with text for every widget', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry, FAMILIES } = await import('./catalog');
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const entry = catalogEntry(module, (await loadWidget(module)).getWidgetInfo());
            if (!FAMILIES[module]) problems.push(`${module}: no family`);
            if (!entry.excluded && (!entry.description.en || !entry.description.de)) problems.push(`${module}: no description from doc/${entry.doc}`);
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('puts the configured examples first and the as-inserted variant last for every widget', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const { EXAMPLES } = await import('./examples');
        const { DEFAULTS_ID } = await import('./example');
        for (const { module } of widgetIndex) {
            const entry = catalogEntry(module, (await loadWidget(module)).getWidgetInfo());
            expect(entry.variants.at(-1)!.id, module).toBe(DEFAULTS_ID);
            expect(entry.variants.length, module).toBe((EXAMPLES[module] ?? []).length + 1);
            expect(EXAMPLES[module]?.length ?? 0, `${module} has no configured example`).toBeGreaterThan(0);
        }
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

    it('gives every variant a value range and unit that fit its data point', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const objects = (scenarioJson as unknown as { objects: Record<string, { common: { unit?: string; min?: number; max?: number } }> }).objects;
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            for (const variant of catalogEntry(module, info).variants) {
                const { oid, min, max, valueLabelUnit } = variant.data as { oid?: string; min?: unknown; max?: unknown; valueLabelUnit?: unknown };
                const common = typeof oid === 'string' ? objects[oid]?.common : undefined;
                if (!common) continue;
                const where = `${module}/${variant.id} on ${oid}`;
                // A progress bar in its default style shows a percentage of min..max; its unit only shows with progressValue.
                const showsPercent = module.startsWith('MaterialDesignProgress') && ((variant.data.valueLabelStyle as string | undefined) ?? 'progressPercent') === 'progressPercent';
                if (!showsPercent && typeof valueLabelUnit === 'string' && valueLabelUnit && common.unit && valueLabelUnit !== common.unit) problems.push(`${where}: unit ${valueLabelUnit}, data point ${common.unit}`);
                if (typeof min === 'number' && typeof common.min === 'number' && common.min < min) problems.push(`${where}: min ${min} above data point min ${common.min}`);
                if (typeof max === 'number' && typeof common.max === 'number' && common.max > max) problems.push(`${where}: max ${max} below data point max ${common.max}`);
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

    it('shows a gallery view in the as-inserted variant of every widget with a views field', async () => {
        const { widgetIndex, loadWidget } = await import('../runtime/widgets');
        const { catalogEntry } = await import('./catalog');
        const { defaultData, expandFields, isHidden } = await import('../runtime/widgetInfo');
        const { DEFAULTS_ID } = await import('./example');
        const problems: string[] = [];
        for (const { module } of widgetIndex) {
            const info = (await loadWidget(module)).getWidgetInfo();
            const data = { ...defaultData(info), ...catalogEntry(module, info).variants.find(v => v.id === DEFAULTS_ID)!.data };
            const viewKeys = expandFields(info, data).filter(entry => (entry.field as { type?: string }).type === 'views' && !isHidden(entry, data)).map(({ key }) => key);
            if (viewKeys.length && !viewKeys.some(key => typeof data[key] === 'string' && data[key] in VIEWS)) problems.push(module);
        }
        expect(problems).toEqual([]);
    }, 120_000);

    it('offers at least two examples plus the as-inserted variant for every shown widget', async () => {
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

    it('writes examples only with fields the widget declares', async () => {
        const { loadWidget } = await import('../runtime/widgets');
        const { EXAMPLES } = await import('./examples');
        const { defaultData, expandFields } = await import('../runtime/widgetInfo');
        const problems: string[] = [];
        for (const [module, variants] of Object.entries(EXAMPLES)) {
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

    it('gives every example an English and German label and purpose', async () => {
        const { EXAMPLES } = await import('./examples');
        const { FAMILIES } = await import('./catalog');
        // Families whose examples still carry the imported placeholder texts; each review round removes its own.
        const PENDING_FAMILIES = new Set(['input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation']);
        const missing = new Map<string, string[]>();
        for (const [module, examples] of Object.entries(EXAMPLES)) {
            const family = FAMILIES[module].family;
            for (const e of examples) {
                for (const field of ['label', 'purpose'] as const) {
                    for (const lang of ['en', 'de'] as const) {
                        if (!e[field][lang].trim()) missing.set(family, [...(missing.get(family) ?? []), `${module}/${e.id}: ${field}.${lang}`]);
                    }
                }
            }
        }
        const problems = [...missing].filter(([family]) => !PENDING_FAMILIES.has(family)).flatMap(([, list]) => list);
        const stalePending = [...PENDING_FAMILIES].filter(family => !missing.has(family));
        expect({ problems, stalePending }).toEqual({ problems: [], stalePending: [] });
    });

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