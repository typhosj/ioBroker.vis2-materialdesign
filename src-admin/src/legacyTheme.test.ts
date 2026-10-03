import { describe, expect, it } from 'vitest';

import { legacyDarkTheme, legacyTakeOver, legacyThemeConfig } from './legacyTheme';

describe('legacyThemeConfig', () => {
    it('takes the four theme lists and their default slots', () => {
        const native = {
            colors: [{ id: 'light.card.background', value: '#111111' }], colorsDark: [], fonts: [], fontSizes: [],
            defaultcolors: ['#000000'], defaultcolorsDark: [], defaultfonts: [], defaultfontSizes: [14],
        };
        expect(legacyThemeConfig(native)).toEqual(native);
    });

    it('never takes the script and sentry settings', () => {
        const result = legacyThemeConfig({ colors: [], scriptName: 'Theme', variableName: 'x', javascriptInstance: 'javascript.0', sentryReport: true });
        expect(result).toEqual({ colors: [] });
    });

    it('drops a value that is not a list', () => {
        expect(legacyThemeConfig({ colors: 'broken', fonts: null, fontSizes: {} })).toEqual({});
    });

    it('returns nothing for a missing or malformed native', () => {
        expect(legacyThemeConfig(undefined)).toEqual({});
        expect(legacyThemeConfig('x')).toEqual({});
    });
});

describe('legacyDarkTheme', () => {
    it('keeps the old switch a boolean, so switches and bindings on the state still read it', () => {
        expect(legacyDarkTheme(true)).toBe(true);
        expect(legacyDarkTheme('true')).toBe(true);
        expect(legacyDarkTheme(false)).toBe(false);
        expect(legacyDarkTheme('false')).toBe(false);
    });
    it('takes over nothing for a missing or unexpected value', () => {
        expect(legacyDarkTheme(null)).toBeNull();
        expect(legacyDarkTheme(undefined)).toBeNull();
        expect(legacyDarkTheme('')).toBeNull();
        expect(legacyDarkTheme(1)).toBeNull();
        expect(legacyDarkTheme(0)).toBeNull();
        expect(legacyDarkTheme('dark')).toBeNull();
        expect(legacyDarkTheme('TRUE')).toBeNull();
    });
});

describe('legacyTakeOver', () => {
    it('collects the theme lists and the dark switch', () => {
        expect(legacyTakeOver({ colors: [], sentryReport: true }, 'false')).toEqual({ config: { colors: [] }, dark: false });
    });
    it('takes over the dark switch alone, or the lists alone', () => {
        expect(legacyTakeOver({}, true)).toEqual({ config: {}, dark: true });
        expect(legacyTakeOver({ fonts: [] }, undefined)).toEqual({ config: { fonts: [] }, dark: null });
    });
    it('reports nothing to take over when neither a list nor the switch is there', () => {
        expect(legacyTakeOver({}, undefined)).toBeNull();
        expect(legacyTakeOver(undefined, 'auto')).toBeNull();
        expect(legacyTakeOver({ colors: 'broken', scriptName: 'Theme' }, null)).toBeNull();
    });
});
