import { describe, expect, it } from 'vitest';

import colorsLight from '../../admin/lib/colors.json';
import colorsDark from '../../admin/lib/colorsDark.json';
import {
    THEME_NAMES,
    ancestorChannels,
    defaultSlotId,
    defaultsKey,
    readDefaults,
    readEntries,
    themeDefinitions,
    themeStateCommon,
    themeStateId,
} from './themeConfig';

const NS = 'vis2-materialdesign.0';

describe('theme entry lists', () => {
    // The runtime only ships the LIGHT list and derives the dark object id by swapping the `light.`
    // prefix for `dark.` (widgetUtils.tsx `themeStateId`). A dark entry that kept a `light.` prefix
    // therefore wrote its value over the light state and left the dark state missing entirely —
    // exactly what `dark.icon_list.subText_selected` did.
    it('prefixes every light entry with light. and every dark entry with dark.', () => {
        expect(colorsLight.filter(entry => !entry.id.startsWith('light.'))).toEqual([]);
        expect(colorsDark.filter(entry => !entry.id.startsWith('dark.'))).toEqual([]);
    });

    it('pairs light and dark one to one', () => {
        const light = colorsLight.map(entry => entry.id.replace(/^light\./, '')).sort();
        const dark = colorsDark.map(entry => entry.id.replace(/^dark\./, '')).sort();
        expect(dark).toEqual(light);
    });

    it('keeps every entry id unique within its list', () => {
        for (const theme of THEME_NAMES) {
            const ids = themeDefinitions[theme].entries.map(entry => entry.id);
            expect(new Set(ids).size, theme).toBe(ids.length);
        }
    });

    it('never lets two themes claim the same object id', () => {
        const seen = new Map<string, string>();
        for (const theme of THEME_NAMES) {
            for (const entry of themeDefinitions[theme].entries) {
                const id = themeStateId(NS, theme, entry.id);
                expect(seen.get(id), `${id} claimed by ${seen.get(id)} and ${theme}`).toBeUndefined();
                seen.set(id, theme);
            }
        }
    });
});

describe('readDefaults', () => {
    it('falls back to the shipped defaults when nothing is saved', () => {
        expect(readDefaults({}, 'colors')).toEqual(themeDefinitions.colors.defaults);
    });

    it('fills gaps in a short saved array from the shipped defaults', () => {
        const saved = ['#111111'];
        const result = readDefaults({ [defaultsKey('colors')]: saved }, 'colors');
        expect(result[0]).toBe('#111111');
        expect(result.slice(1)).toEqual(themeDefinitions.colors.defaults.slice(1));
    });

    it('coerces font sizes back to numbers when an older config saved strings', () => {
        const saved = themeDefinitions.fontSizes.defaults.map(value => String(value));
        expect(readDefaults({ [defaultsKey('fontSizes')]: saved }, 'fontSizes')).toEqual(themeDefinitions.fontSizes.defaults.map(Number));
    });
});

describe('readEntries', () => {
    const defaults = ['#aaaaaa', '#bbbbbb', '#cccccc'];
    const first = themeDefinitions.colors.entries[0];

    it('follows the default slot when the entry is still bound to one', () => {
        const entries = readEntries({ colors: [{ ...first, defaultValue: 2, value: '#000000' }] }, 'colors', defaults);
        expect(entries[0].defaultValue).toBe(2);
    });

    it('keeps a hand-edited value and drops its slot binding', () => {
        const entries = readEntries({ colors: [{ ...first, defaultValue: undefined, value: '#123456' }] }, 'colors', defaults);
        expect(entries[0].value).toBe('#123456');
        expect(entries[0].defaultValue).toBeUndefined();
    });

    it('ignores a slot index that no longer exists', () => {
        const entries = readEntries({ colors: [{ ...first, defaultValue: 99 }] }, 'colors', defaults);
        expect(entries[0].defaultValue).toBeUndefined();
    });

    it('treats an empty-string slot index as unbound rather than as slot 0', () => {
        const entries = readEntries({ colors: [{ ...first, defaultValue: '' as unknown as number }] }, 'colors', defaults);
        expect(entries[0].defaultValue).toBeUndefined();
    });

    it('returns every shipped entry even when nothing is saved', () => {
        expect(readEntries({}, 'colors', defaults)).toHaveLength(themeDefinitions.colors.entries.length);
    });

    it('always yields numeric font sizes', () => {
        const entry = themeDefinitions.fontSizes.entries[0];
        const entries = readEntries({ fontSizes: [{ ...entry, value: '18' }] }, 'fontSizes', [14, 16]);
        expect(entries[0].value).toBe(18);
        expect(entries.every(candidate => typeof candidate.value === 'number')).toBe(true);
    });
});

describe('object ids', () => {
    it('splits the default slots into the light and dark branches', () => {
        expect(defaultSlotId(NS, 'colors', 1)).toBe(`${NS}.colors.light.default_1`);
        expect(defaultSlotId(NS, 'colorsDark', 1)).toBe(`${NS}.colors.dark.default_1`);
        expect(defaultSlotId(NS, 'fontSizes', 1)).toBe(`${NS}.fontSizes.default_1`);
    });

    it('lists every intermediate channel, outermost first, without the leaf', () => {
        expect(ancestorChannels(`${NS}.colors.light.button.default.primary`, NS)).toEqual([
            `${NS}.colors`,
            `${NS}.colors.light`,
            `${NS}.colors.light.button`,
            `${NS}.colors.light.button.default`,
        ]);
    });

    it('returns nothing for a state sitting directly under the namespace', () => {
        expect(ancestorChannels(`${NS}.designStyle`, NS)).toEqual([]);
    });

    // Every id the sync writes must be reachable: a missing intermediate channel is what the
    // community bot's live-instance dump check rejects, and no local lint/tsc/test sees it.
    it('covers every shipped entry with a full channel chain', () => {
        for (const theme of THEME_NAMES) {
            for (const entry of themeDefinitions[theme].entries) {
                const id = themeStateId(NS, theme, entry.id);
                const channels = ancestorChannels(id, NS);
                expect(channels.length, id).toBe(id.substring(NS.length + 1).split('.').length - 1);
                expect(channels.every(channel => channel.startsWith(`${NS}.`))).toBe(true);
            }
        }
    });
});

describe('themeStateCommon', () => {
    // role "value" is number-only in the ioBroker role catalogue — pairing it with a hex string is
    // what the object-structure check rejected in 0.3.3.
    it('pairs numbers with value and strings with text', () => {
        expect(themeStateCommon(14)).toEqual({ type: 'number', role: 'value' });
        expect(themeStateCommon('#ff0000')).toEqual({ type: 'string', role: 'text' });
        expect(themeStateCommon('')).toEqual({ type: 'string', role: 'text' });
    });

    it('gives every font size a numeric state and every color a string state', () => {
        for (const value of readDefaults({}, 'fontSizes')) expect(themeStateCommon(value).type).toBe('number');
        for (const value of readDefaults({}, 'colors')) expect(themeStateCommon(value).type).toBe('string');
    });
});
