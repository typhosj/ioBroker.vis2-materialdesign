import { describe, expect, it } from 'vitest';

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

describe('readDefaults', () => {
    it('falls back to the shipped defaults when nothing is saved', () => {
        expect(readDefaults({}, 'colors')).toEqual(themeDefinitions.colors.defaults);
    });

    it('fills gaps in a short saved array from the shipped defaults', () => {
        const result = readDefaults({ [defaultsKey('colors')]: ['#111111'] }, 'colors');
        expect(result[0]).toBe('#111111');
        expect(result.slice(1)).toEqual(themeDefinitions.colors.defaults.slice(1));
    });

    // An older config (or a state round-trip) can leave a font size behind as the string "14".
    // Handing that to the editor's number field makes it uncontrolled and the value sticks.
    it('coerces font sizes back to numbers', () => {
        const saved = themeDefinitions.fontSizes.defaults.map(value => String(value));
        expect(readDefaults({ [defaultsKey('fontSizes')]: saved }, 'fontSizes')).toEqual(themeDefinitions.fontSizes.defaults.map(Number));
    });

    it('ignores a saved value that is not an array', () => {
        expect(readDefaults({ [defaultsKey('colors')]: 'nonsense' }, 'colors')).toEqual(themeDefinitions.colors.defaults);
    });
});

describe('readEntries', () => {
    const defaults = ['#aaaaaa', '#bbbbbb', '#cccccc'];
    const first = themeDefinitions.colors.entries[0];

    it('returns every shipped entry even when nothing is saved', () => {
        expect(readEntries({}, 'colors', defaults)).toHaveLength(themeDefinitions.colors.entries.length);
    });

    it('follows the default slot while the entry is still bound to one', () => {
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

    // An empty string is what a cleared field writes, and Number('') is 0 — treating it as slot 0
    // would silently re-bind an entry the user had just unbound.
    it('treats an empty-string slot index as unbound rather than as slot 0', () => {
        const entries = readEntries({ colors: [{ ...first, defaultValue: '' as unknown as number }] }, 'colors', defaults);
        expect(entries[0].defaultValue).toBeUndefined();
    });

    it('always yields numeric font sizes', () => {
        const entry = themeDefinitions.fontSizes.entries[0];
        const entries = readEntries({ fontSizes: [{ ...entry, value: '18' }] }, 'fontSizes', [14, 16]);
        expect(entries[0].value).toBe(18);
        expect(entries.every(candidate => typeof candidate.value === 'number')).toBe(true);
    });
});

describe('object ids', () => {
    it('files both colour lists under one colors branch and splits the default slots', () => {
        expect(themeStateId(NS, 'colors', 'light.button.default.primary')).toBe(`${NS}.colors.light.button.default.primary`);
        expect(themeStateId(NS, 'colorsDark', 'dark.button.default.primary')).toBe(`${NS}.colors.dark.button.default.primary`);
        expect(themeStateId(NS, 'fontSizes', 'button.default.text')).toBe(`${NS}.fontSizes.button.default.text`);
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
        expect(ancestorChannels(`${NS}.lastchange`, NS)).toEqual([]);
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

    it('never lets two shipped entries claim the same object id', () => {
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

describe('themeStateCommon', () => {
    // role "value" is number-only in the ioBroker role catalogue — pairing it with a hex string is
    // what an object-structure check rejects.
    it('pairs numbers with value and strings with text', () => {
        expect(themeStateCommon(14)).toEqual({ type: 'number', role: 'value' });
        expect(themeStateCommon('#ff0000')).toEqual({ type: 'string', role: 'text' });
        expect(themeStateCommon('')).toEqual({ type: 'string', role: 'text' });
    });

    it('gives every font size a numeric state and every colour a string state', () => {
        for (const value of readDefaults({}, 'fontSizes')) expect(themeStateCommon(value).type).toBe('number');
        for (const value of readDefaults({}, 'colors')) expect(themeStateCommon(value).type).toBe('string');
    });
});
