import { describe, expect, it } from 'vitest';

import { M3_BASELINE_SEED, m3SchemeFromSeed } from '../../src-admin/src/m3scheme';
import { m3CssVariables } from './m3Tokens';

describe('m3CssVariables', () => {
    it('writes every role for light under :root and for dark under the dark theme attribute', () => {
        const css = m3CssVariables({ light: { primary: '#6750a4', 'on-primary': '#ffffff' }, dark: { primary: '#d0bcff', 'on-primary': '#381e72' } });
        expect(css).toBe(":root{--md-sys-color-primary:#6750a4;--md-sys-color-on-primary:#ffffff}[data-theme='dark']{--md-sys-color-primary:#d0bcff;--md-sys-color-on-primary:#381e72}");
    });
    it('covers the surface container roles the layout uses', () => {
        const css = m3CssVariables(m3SchemeFromSeed(M3_BASELINE_SEED)!);
        for (const role of ['surface', 'surface-container-low', 'surface-container', 'surface-container-high', 'on-surface', 'on-surface-variant', 'outline', 'outline-variant', 'secondary-container', 'on-secondary-container']) {
            expect(css).toContain(`--md-sys-color-${role}:`);
        }
    });
    it('rejects a value that could break out of the style element', () => {
        expect(() => m3CssVariables({ light: { primary: '#fff;}</style>' }, dark: {} })).toThrow(/invalid color/);
    });
    it('rejects a role name that could leave the style element', () => {
        expect(() => m3CssVariables({ light: { 'x:red}</style><script>': '#ffffff' }, dark: {} })).toThrow(/invalid role/);
        expect(() => m3CssVariables({ light: {}, dark: { 'On-Primary': '#ffffff' } })).toThrow(/invalid role/);
    });
    it('rejects a short hex and a color name', () => {
        expect(() => m3CssVariables({ light: { primary: '#fff' }, dark: {} })).toThrow(/invalid color/);
        expect(() => m3CssVariables({ light: {}, dark: { primary: 'red' } })).toThrow(/invalid color/);
    });
});
