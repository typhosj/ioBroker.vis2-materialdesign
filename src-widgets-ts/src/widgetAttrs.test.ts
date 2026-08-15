/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

// vis-2 expands only the FIRST indexed group of a widget: after that one it looks for the next with
// `fields.findIndex(group => group.indexFrom)`, and our groups start at index 0, which is falsy
// (visWidgetsCatalog.tsx). A second indexed group renders once, with unindexed field names — the
// whole group silently loses its per-index editing. Indexed FIELDS are tested for truthiness on the
// very first pass, so `indexFrom: 0` never expands there at all.
type Group = {
    name?: string;
    indexFrom?: unknown;
    indexTo?: unknown;
    hidden?: unknown;
    fields?: Array<{ name?: string; indexFrom?: unknown }>;
};
type WidgetModule = { default?: { getWidgetInfo?: () => { visAttrs?: Group[]; id?: string } } };

const modules = import.meta.glob<WidgetModule>('./MaterialDesign*.tsx', { eager: true });

describe('indexed attribute groups', () => {
    const widgets = Object.entries(modules)
        .map(([file, module]) => ({ file, info: module.default?.getWidgetInfo?.() }))
        .filter((entry): entry is { file: string; info: { visAttrs?: Group[]; id?: string } } => !!entry.info);

    it('finds the widget definitions to check', () => {
        expect(widgets.length).toBeGreaterThan(10);
    });

    it.each(widgets.map(w => [w.file, w] as const))('%s declares at most one indexed group and no indexed field', (_file, widget) => {
        const groups = widget.info.visAttrs || [];
        const indexed = groups.filter(group => group.indexFrom !== undefined).map(group => group.name);
        expect(indexed.length, `indexed groups: ${indexed.join(', ')}`).toBeLessThanOrEqual(1);
        const indexedFields = groups.flatMap(group => (group.fields || []).filter(field => field.indexFrom !== undefined).map(field => `${group.name}.${field.name}`));
        expect(indexedFields).toEqual([]);
    });

    // vis-2 expands 0..count inclusive and puts the clone, delete and add buttons on that last
    // group. Hiding it leaves no way to add an entry, because a typed count does not rebuild the
    // groups either (a number field dispatches no `recalculateFields`).
    it.each(widgets.map(w => [w.file, w] as const))('%s keeps the last indexed group, which carries the add button', (_file, widget) => {
        const group = (widget.info.visAttrs || []).find(entry => entry.indexFrom !== undefined);
        if (!group || typeof group.hidden !== 'function') return;
        const hidden = group.hidden as (data: Record<string, unknown>, index?: number) => boolean;
        const count = 3;
        const data = { [String(group.indexTo)]: count };
        expect(hidden(data, count), `group ${group.name} hides index ${count}`).toBe(false);
    });
});
