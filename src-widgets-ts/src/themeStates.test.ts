import { describe, expect, it } from 'vitest';

import colorsLight from '../../admin/lib/colors.json';
import colorsDark from '../../admin/lib/colorsDark.json';
import fonts from '../../admin/lib/fonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
import { themeStateId, type ThemeType } from './widgetUtils';

// The widget runtime only ever ships the LIGHT list: it derives a dark colour's object id by
// swapping the `light.` prefix for `dark.` (widgetUtils `themeStateId`). The admin, meanwhile,
// writes each list entry verbatim under `<namespace>.colors.<entry.id>`.
//
// So a dark entry that kept a `light.` prefix does two bad things at once: it writes its value over
// the LIGHT state, and the dark state the widget subscribes to never comes into existence. Nothing
// else in the build notices — it is valid JSON, valid TypeScript, and the editor renders it fine.
// `dark.icon_list.subText_selected` shipped that way.
describe('theme entry ids', () => {
    it('prefixes every light entry with light. and every dark entry with dark.', () => {
        expect(colorsLight.filter(entry => !entry.id.startsWith('light.')).map(entry => entry.id)).toEqual([]);
        expect(colorsDark.filter(entry => !entry.id.startsWith('dark.')).map(entry => entry.id)).toEqual([]);
    });

    it('pairs light and dark one to one', () => {
        const light = colorsLight.map(entry => entry.id.replace(/^light\./, '')).sort();
        const dark = colorsDark.map(entry => entry.id.replace(/^dark\./, '')).sort();
        expect(dark).toEqual(light);
    });

    it.each([
        ['colors', colorsLight],
        ['colorsDark', colorsDark],
        ['fonts', fonts],
        ['fontSizes', fontSizes],
    ] as const)('keeps every id unique within %s', (_name, entries) => {
        const ids = entries.map(entry => entry.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    // The invariant that actually broke: two entries resolving to one object id means one of them
    // silently overwrites the other at runtime.
    it('never lets two entries claim the same object id', () => {
        const claimed = new Map<string, string>();
        const lists: Array<[ThemeType, Array<{ id: string }>, boolean]> = [
            ['colors', colorsLight, false],
            ['colors', colorsLight, true],
            ['fonts', fonts, false],
            ['fontSizes', fontSizes, false],
        ];
        for (const [type, entries, dark] of lists) {
            for (const entry of entries) {
                const id = themeStateId(type, entry.id, dark);
                expect(claimed.get(id), `${id} claimed twice`).toBeUndefined();
                claimed.set(id, entry.id);
            }
        }
    });

    // The admin writes the dark list verbatim, the widget derives it from the light list. Both have
    // to land on the same object or the colour a user picks never reaches the widget.
    it('lands the admin dark id and the runtime dark id on the same object', () => {
        const written = new Set(colorsDark.map(entry => `vis2-materialdesign.0.colors.${entry.id}`));
        const subscribed = colorsLight.map(entry => themeStateId('colors', entry.id, true));
        const orphans = subscribed.filter(id => !written.has(id));
        expect(orphans, `subscribed but never written: ${orphans.join(', ')}`).toEqual([]);
    });
});
