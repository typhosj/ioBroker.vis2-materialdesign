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
    fields?: Array<{ name?: string; indexFrom?: unknown; hidden?: unknown }>;
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
    // group. The group has to stay visible or nothing can be added at all — a typed count rebuilds
    // no groups (a number field dispatches no `recalculateFields`). Its FIELDS are hidden instead,
    // so the extra group is only the add bar and the count keeps meaning the number of entries.
    it.each(widgets.map(w => [w.file, w] as const))('%s makes the group past the count an add bar, not an entry', (_file, widget) => {
        const group = (widget.info.visAttrs || []).find(entry => entry.indexFrom !== undefined);
        if (!group) return;
        const count = 3;
        const data = { [String(group.indexTo)]: count };
        const groupHidden = group.hidden as ((data: Record<string, unknown>, index: number) => boolean) | undefined;
        if (typeof groupHidden === 'function') {
            expect(groupHidden(data, count), `group ${group.name} hides index ${count}`).toBe(false);
        }
        const at = (index: number): boolean[] =>
            (group.fields || []).map(field => {
                const hidden = field.hidden as ((data: Record<string, unknown>, index: number) => boolean) | undefined;
                expect(typeof hidden, `${group.name}.${field.name} has no hidden guard`).toBe('function');
                return typeof hidden === 'function' ? hidden(data, index) : false;
            });
        expect(at(count), `${group.name} is editable past the count`).not.toContain(false);
        expect(at(count - 1), `${group.name} hides its last entry`).not.toContain(true);
    });
});
