import { describe, expect, it } from 'vitest';

import { THEME_NAMES, readDefaults, readEntries, themeStateId } from '../../src-admin/src/themeConfig';
import { M3_SEEDS, NAMESPACE, m3Schemes, themeStates } from './themeStates';

describe('themeStates', () => {
    const states = themeStates();

    it('holds one state per theme entry under the id the admin writes', () => {
        for (const theme of THEME_NAMES) {
            for (const entry of readEntries({}, theme, readDefaults({}, theme))) {
                expect(states[themeStateId(NAMESPACE, theme, entry.id)]).toBe(entry.value);
            }
        }
    });

    it('starts light, in Material 3, with a parseable baseline scheme', () => {
        expect(states[`${NAMESPACE}.colors.darkTheme`]).toBe('light');
        expect(states[`${NAMESPACE}.designStyle`]).toBe('material3');
        const scheme = JSON.parse(String(states[`${NAMESPACE}.colors.md3Scheme`]));
        expect(scheme.light.primary).toMatch(/^#[0-9a-f]{6}$/);
        expect(scheme.dark.primary).toMatch(/^#[0-9a-f]{6}$/);
        expect(states[`${NAMESPACE}.fonts.md3Font`]).toBe('');
    });

    it('precomputes one scheme per offered seed', () => {
        const schemes = m3Schemes();
        expect(Object.keys(schemes)).toEqual([...M3_SEEDS]);
        expect(new Set(Object.values(schemes)).size).toBe(M3_SEEDS.length);
    });
});
