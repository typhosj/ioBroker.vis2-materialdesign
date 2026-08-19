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
    fields?: Array<{ name?: string; type?: string; indexFrom?: unknown; hidden?: unknown }>;
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
        // The one field left visible past the count is the hint that names the add bar.
        const at = (index: number, kind: 'entry' | 'hint'): boolean[] =>
            (group.fields || [])
                .filter(field => (field.type === 'help') === (kind === 'hint'))
                .map(field => {
                    const hidden = field.hidden as ((data: Record<string, unknown>, index: number) => boolean) | undefined;
                    expect(typeof hidden, `${group.name}.${field.name} has no hidden guard`).toBe('function');
                    return typeof hidden === 'function' ? hidden(data, index) : false;
                });
        expect(at(count, 'entry'), `${group.name} is editable past the count`).not.toContain(false);
        expect(at(count - 1, 'entry'), `${group.name} hides its last entry`).not.toContain(true);
        expect(at(count, 'hint'), `${group.name} has no add-bar hint`).toEqual([false]);
        expect(at(count - 1, 'hint'), `${group.name} hints on a real entry`).toEqual([true]);
    });
});

// A field the editor offers but no widget reads is the worst kind of bug report: the user sets it,
// nothing happens, and the widget looks broken. This is the guard that keeps the list at zero.
//
// Scope matters: a field counts as read only inside its own widget file plus the local modules that
// file imports. Checking all sources at once let `showInputMessageAlways` pass because Select
// implemented it while Input did not.
//
// A read is `data.name`, `data['name']` or `data[`name${i}`]` — not a declaration. Field lists are
// built by helpers (`num("chartPaddingTop")`, `["axisValueMin", …].map(…)`), so a plain text search
// counts those declarations as uses and finds nothing.
const sources = import.meta.glob<string>('./*.tsx', { eager: true, query: '?raw', import: 'default' });
const sourcesTs = import.meta.glob<string>('./*.ts', { eager: true, query: '?raw', import: 'default' });
const allSources: Record<string, string> = { ...sources, ...sourcesTs };

// Names assembled at runtime, which no static search can see:
// - chartPadding*: layoutConfig() loops over the four side names.
// - the colspan fields: MaterialDesignViews picks the field name for the current breakpoint and
//   reads it as d[layout.key].
// - delayInMs: read through indexedValue(data, 'delayInMs', i).
const RUNTIME_NAMES = new Set([
    'chartPaddingTop', 'chartPaddingLeft', 'chartPaddingRight', 'chartPaddingBottom',
    'viewColSpan', 'handyGridPortraitColSpan', 'handyGridLandscapeColSpan',
    'tabletGridPortraitColSpan', 'tabletGridLandscapeColSpan',
    'delayInMs',
]);

function scopeOf(file: string): string {
    const seen = new Set([file]);
    const queue = [file];
    while (queue.length) {
        const current = queue.pop()!;
        for (const match of (allSources[current] || '').matchAll(/from\s+['"]\.\/([A-Za-z0-9_]+)['"]/g)) {
            for (const candidate of [`./${match[1]}.tsx`, `./${match[1]}.ts`]) {
                if (allSources[candidate] && !seen.has(candidate)) { seen.add(candidate); queue.push(candidate); }
            }
        }
    }
    return [...seen].map(name => allSources[name]).join('\n');
}

describe('every declared attribute is read', () => {
    const widgets = Object.entries(modules)
        .map(([file, module]) => ({ file, info: module.default?.getWidgetInfo?.() }))
        .filter((entry): entry is { file: string; info: { visAttrs?: Group[] } } => !!entry.info);

    it.each(widgets.map(w => [w.file, w] as const))('%s reads what it declares', (file, widget) => {
        const text = scopeOf(file);
        const reads = new Set<string>();
        for (const match of text.matchAll(/\.([A-Za-z_$][\w$]*)\b/g)) reads.add(match[1]);
        for (const match of text.matchAll(/\[\s*['"]([^'"\]]+)['"]\s*\]/g)) reads.add(match[1]);
        // Rows of an indexed group are read through helpers that take the base name as a string.
        for (const match of text.matchAll(/\b(?:indexed|indexedValue|item|get)\(\s*(?:\w+\s*,\s*)?['"]([A-Za-z_$][\w$]*)['"]/g)) reads.add(match[1]);
        const prefixes = [...text.matchAll(/\[`([A-Za-z_$][\w$]*)\$\{/g)].map(match => match[1]);
        const suffixes = [...text.matchAll(/\[`\$\{[^}]+\}([A-Za-z_$][\w$]*)`\]/g)].map(match => match[1]);

        const dead = (widget.info.visAttrs || []).flatMap(group => (group.fields || [])
            .filter(field => {
                const name = field.name;
                if (!name || name.startsWith('__mdwTheme') || name === 'addBarHint' || name === 'useTheme') return false;
                if (field.type === 'custom' || field.type === 'help') return false;
                if (RUNTIME_NAMES.has(name) || reads.has(name)) return false;
                if (prefixes.some(prefix => name.startsWith(prefix))) return false;
                return !suffixes.some(suffix => name.endsWith(suffix) && name.length > suffix.length);
            })
            .map(field => `${group.name}.${field.name}`));
        expect(dead, `declared but never read: ${dead.join(', ')}`).toEqual([]);
    });
});
