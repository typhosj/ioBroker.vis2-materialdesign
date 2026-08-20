/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

import widgetWords from '../../admin/i18n/en.json';
import themeColors from '../../admin/lib/colors.json';
import themeFontList from '../../admin/lib/fonts.json';
import themeFontSizes from '../../admin/lib/fontSizes.json';
import groupLabels from './generated/groupLabels.json';
import { themeNameAliases } from './widgetUtils';

const groupWords: Record<string, string> = groupLabels.en;
const dictionaries = import.meta.glob<Record<string, string>>('../../admin/i18n/*.json', { eager: true, import: 'default' });
const languages = Object.entries(dictionaries).map(([file, words]) => [file.split('/').pop(), words] as const);

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
    label?: string;
    fields?: Array<{ name?: string; label?: string; type?: string; indexFrom?: unknown; hidden?: unknown }>;
};
type WidgetModule = { default?: { getWidgetInfo?: () => { visAttrs?: Group[]; id?: string; visName?: string } } };

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

describe('no empty attribute group', () => {
    const widgets = Object.entries(modules)
        .map(([file, module]) => ({ file, info: module.default?.getWidgetInfo?.() }))
        .filter((entry): entry is { file: string; info: { visAttrs?: Group[] } } => !!entry.info);

    // An empty group is a section in the editor that opens onto nothing. The theme fields are
    // hidden but real, so a group carrying only those is fine.
    it.each(widgets.map(w => [w.file, w] as const))('%s has no group without fields', (_file, widget) => {
        const empty = (widget.info.visAttrs || [])
            .filter(group => !(group.fields || []).length)
            .map(group => group.name);
        expect(empty, `empty groups: ${empty.join(', ')}`).toEqual([]);
    });
});

describe('icon fields go through the widget set picker', () => {
    // VIS 2 renders `type: 'icon'` with its own IconPicker, which loads the value as an image URL
    // and 404s on an mdi name. iconField() uses our picker, which takes mdi names, Material
    // Symbols and ioBroker files — the three kinds renderIcon() understands.
    it.each(Object.keys(allSources))('%s declares no raw icon field', file => {
        // The comment above iconField() names the type it replaces, so only code counts.
        const code = allSources[file].replace(/^\s*\/\/.*$/gm, '');
        expect(/type:\s*['"]icon['"]/.test(code)).toBe(false);
    });
});

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

// Every string the editor puts on screen has to come out of a dictionary. Two separate ones are in
// play and they fail differently, which is why both are checked here:
//
//  - FIELD labels resolve through the widget-set translations (the full admin i18n, shipped by
//    translations.ts). A missing key renders the raw key, e.g. "refreshOnWakeUp".
//  - GROUP headers resolve through the legacy `systemDictionary`, which component i18n does not
//    populate. widgetUtils bridges them from generated/groupLabels.json, and that file is built by
//    scripts/gen-group-labels.cjs from the `group_`-prefixed keys ONLY — which is how
//    `label: 'group.buttonOids'` (a dot, not an underscore) shipped a raw key for three widgets
//    while a perfectly good `group_buttonOids` translation sat unused next to it.
describe('every editor label resolves', () => {
    const widgets = Object.entries(modules)
        .map(([file, module]) => ({ file, info: module.default?.getWidgetInfo?.() }))
        .filter((entry): entry is { file: string; info: { visAttrs?: Group[] } } => !!entry.info);

    it.each(widgets.map(w => [w.file, w] as const))('%s translates every field label', (_file, widget) => {
        const missing = (widget.info.visAttrs || []).flatMap(group => (group.fields || [])
            .filter(field => field.label && !(field.label in widgetWords))
            .map(field => `${group.name}.${field.name} -> ${field.label}`));
        expect(missing, `no translation: ${missing.join(', ')}`).toEqual([]);
    });

    it.each(widgets.map(w => [w.file, w] as const))('%s translates every group header', (_file, widget) => {
        const missing = (widget.info.visAttrs || [])
            .filter(group => group.name !== 'common')
            .map(group => group.label || `group_${group.name}`)
            .filter(key => !(key in groupWords));
        expect(missing, `not in groupLabels.json: ${missing.join(', ')}`).toEqual([]);
    });
});

// The theme lists file every colour/font under a WIDGET NAME, and themeEntries() matches that name
// against the widget's visName. A name that matches nothing is silent in both directions: the widget
// gets no theme entries, and the entry reaches no widget. `light.material_design_icon.color` sat
// unreachable that way — its widget is called "Icon", the list said "Material Design Icon".
describe('theme lists name real widgets', () => {
    const visNames = new Set(Object.values(modules)
        .map(module => module.default?.getWidgetInfo?.())
        .filter((info): info is { visName?: string } => !!info)
        .map(info => themeNameAliases[String(info.visName)] || String(info.visName)));

    it('has no entry filed under a widget name that does not exist', () => {
        const names = new Set([...themeColors, ...themeFontList, ...themeFontSizes].flatMap(entry => entry.widget.split(', ')));
        const orphans = [...names].filter(name => !visNames.has(name));
        expect(orphans, `theme entries for no widget: ${orphans.join(', ')}`).toEqual([]);
    });

    it('keeps every alias pointing at a name the lists actually use', () => {
        const names = new Set([...themeColors, ...themeFontList, ...themeFontSizes].flatMap(entry => entry.widget.split(', ')));
        const useless = Object.entries(themeNameAliases).filter(([from, to]) => from === to || !names.has(to));
        expect(useless.map(([from, to]) => `${from} -> ${to}`)).toEqual([]);
    });
});

// aria-labels are the one bit of widget text with no editor field behind it, so nothing else
// would notice a key that was never translated - the label would simply be announced as
// "ariaOpenMenu" by every screen reader outside English.
describe('aria keys are translated', () => {
    const used = [...new Set(Object.values(allSources).flatMap(text => [...text.matchAll(/VisWidget\.t\('(aria[A-Za-z]+)'\)/g)].map(match => match[1])))];

    it('finds the aria keys to check', () => {
        expect(used.length).toBeGreaterThan(4);
    });

    it.each(languages)('%s translates every aria key', (_lang, words) => {
        const missing = used.filter(key => !(words)[key]);
        expect(missing, `untranslated: ${missing.join(', ')}`).toEqual([]);
    });
});

// The check above finds a field the editor offers and nobody reads. This is the other direction: an
// option the code reads that no editor field ever writes. It is stuck on its fallback forever and
// the user has no way to reach it — the line-history chart read `animationDuration` like that while
// the other three charts all offered the field.
//
// Scope is deliberately the file's OWN text here, not its import closure: the wide scope the check
// above needs would pull every `data.x` in MaterialDesignButtons into every widget that renders an
// icon. What is DECLARED, though, is the union over every widget that reaches this file through
// imports, because the 3-line shims declare the fields and the shared implementation does the
// reading.
describe('every option the code reads is declared', () => {
    function closureOf(file: string): Set<string> {
        const seen = new Set([file]);
        const queue = [file];
        while (queue.length) {
            const current = queue.pop()!;
            for (const match of (allSources[current] || '').matchAll(/from\s+['"](\.\/[A-Za-z0-9_]+)['"]/g)) {
                for (const candidate of [`${match[1]}.tsx`, `${match[1]}.ts`]) {
                    if (allSources[candidate] && !seen.has(candidate)) { seen.add(candidate); queue.push(candidate); }
                }
            }
        }
        return seen;
    }

    const declared = new Map<string, Set<string>>(Object.keys(allSources).map(file => [file, new Set<string>()]));
    for (const [file, module] of Object.entries(modules)) {
        const info = module.default?.getWidgetInfo?.();
        if (!info) continue;
        const names = (info.visAttrs || []).flatMap(group => (group.fields || []).map(field => field.name));
        for (const reachable of closureOf(file)) {
            for (const name of names) if (name) declared.get(reachable)!.add(name);
        }
    }

    const widgetFiles = Object.keys(allSources).filter(file => file.startsWith('./MaterialDesign') && declared.get(file)!.size);

    it('finds the widget sources to check', () => {
        expect(widgetFiles.length).toBeGreaterThan(10);
    });

    it.each(widgetFiles)('%s declares every option it reads', file => {
        const text = allSources[file];
        // the local names that hold rxData: `const data = this.state.rxData` and `(d: Data)` params
        const holders = new Set<string>();
        for (const match of text.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*this\.state\.rxData\b/g)) holders.add(match[1]);
        for (const match of text.matchAll(/\b([A-Za-z_$][\w$]*)\s*:\s*Data\b/g)) holders.add(match[1]);
        if (!holders.size) return;

        const names = [...holders].join('|');
        const reads = new Set<string>();
        for (const match of text.matchAll(new RegExp(`\\b(?:${names})\\.([A-Za-z_$][\\w$]*)\\b`, 'g'))) reads.add(match[1]);
        for (const match of text.matchAll(new RegExp(`\\b(?:${names})\\[\\s*['"]([^'"\\]]+)['"]\\s*\\]`, 'g'))) reads.add(match[1]);
        // indexed rows are read as data[`label${i}`]; the base name is what gets declared
        const indexedRead = new RegExp(`\\b(?:${names})\\[\\x60([A-Za-z_$][\\w$]*)\\$\\{`, 'g');
        for (const match of text.matchAll(indexedRead)) reads.add(match[1]);

        const known = declared.get(file)!;
        const undeclared = [...reads].filter(name => !known.has(name));
        expect(undeclared, `read but no editor field: ${undeclared.join(', ')}`).toEqual([]);
    });
});

// The hidden `__mdwTheme_*` fields are skipped by the checks above because no widget reads them by
// name — they are generated from the theme lists. Their real contract runs through the editor's
// "use theme" button, which writes `var(--…)` into the widget attribute named after the entry's
// `desc` (widgetUtils, UseThemeButton). So an entry filed under a widget that has no field of that
// name makes the button silently do nothing for it, and no other check can see that.
//
// Requiring a DECLARED field (not merely a read one) is the strict form on purpose: the check above
// already proves every declared field is read, so declared ⇒ reachable. A pie chart carrying x/y
// axis fonts, and a JSON chart carrying values fonts it never draws, both sat here.
describe('theme entries write into a field the widget has', () => {
    const declaredByName = new Map<string, Set<string>>();
    for (const module of Object.values(modules)) {
        const info = module.default?.getWidgetInfo?.();
        if (!info?.visName) continue;
        const name = themeNameAliases[info.visName] || info.visName;
        const fields = declaredByName.get(name) || new Set<string>();
        for (const group of info.visAttrs || []) for (const field of group.fields || []) if (field.name) fields.add(field.name);
        declaredByName.set(name, fields);
    }

    it.each([['colors', themeColors], ['fonts', themeFontList], ['fontSizes', themeFontSizes]] as const)('%s entries all land on a real field', (_type, list) => {
        const orphans: string[] = [];
        for (const entry of list) {
            for (const name of entry.widget.split(', ')) {
                const fields = declaredByName.get(name);
                if (!fields || fields.has(entry.desc)) continue;
                // indexed groups expose the field as `<desc><row>`; the button writes both forms
                if ([...fields].some(field => field.startsWith(entry.desc) && /^\d+$/.test(field.slice(entry.desc.length)))) continue;
                orphans.push(`${entry.id} -> ${name}.${entry.desc}`);
            }
        }
        expect(orphans, `theme writes into nothing: ${orphans.join(', ')}`).toEqual([]);
    });
});
