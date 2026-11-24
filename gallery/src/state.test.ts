import { describe, expect, it } from 'vitest';

import { createRuntime } from './runtime/runtime';
import { DEFAULT_QUERY, applyQuery, parseRoute, routeHash } from './state';

describe('parseRoute', () => {
    it('reads path segments and every known query value', () => {
        expect(parseRoute('#/widget/Switch?theme=dark&style=legacy&lang=de&vp=phone&variant=pin&test=1')).toEqual({
            path: ['widget', 'Switch'],
            query: { theme: 'dark', style: 'legacy', lang: 'de', vp: 'phone', variant: 'pin', test: true },
        });
    });

    it('falls back to the defaults for unknown or broken values', () => {
        expect(parseRoute('#/?theme=foo&style=&lang=xx&vp=0x0&test=yes')).toStrictEqual({ path: [], query: DEFAULT_QUERY });
        expect(parseRoute('')).toEqual({ path: [], query: DEFAULT_QUERY });
        expect(parseRoute('#/widget/%E0%A4%A')).toEqual({ path: ['widget', '%E0%A4%A'], query: DEFAULT_QUERY });
    });

    it('defaults to light, Material 3, English and no viewport, which means the page default', () => {
        expect(DEFAULT_QUERY).toEqual({ theme: 'light', style: 'material3', lang: 'en', test: false });
        expect(parseRoute('#/widget/Switch').query.vp).toBeUndefined();
        expect(parseRoute('#/widget/Switch?vp=0x0').query.vp).toBeUndefined();
        expect(parseRoute('#/widget/Switch?vp=').query.vp).toBeUndefined();
    });
    it.each(['phone', 'tablet', 'desktop', 'fit'] as const)('keeps an explicit vp=%s', vp => {
        expect(parseRoute(`#/widget/Switch?vp=${vp}`).query.vp).toBe(vp);
    });
});

describe('route segments', () => {
    it('round-trips a segment with spaces, ampersand, slash and question mark', () => {
        const name = 'Grid Views & a/b?c';
        const hash = routeHash(['widget', name], { ...DEFAULT_QUERY });
        expect(hash).toBe('#/widget/Grid%20Views%20%26%20a%2Fb%3Fc');
        expect(parseRoute(hash).path).toEqual(['widget', name]);
    });
    it('decodes %20 in a path segment', () => {
        expect(parseRoute('#/widget/Button%20State').path).toEqual(['widget', 'Button State']);
    });
    it('keeps a malformed escape raw', () => {
        expect(parseRoute('#/widget/%E0%A4%A').path).toEqual(['widget', '%E0%A4%A']);
    });
});

describe('routeHash', () => {
    it('writes only values that differ from the defaults and round-trips', () => {
        expect(routeHash(['widget', 'Switch'], { ...DEFAULT_QUERY })).toBe('#/widget/Switch');
        const hash = routeHash(['widget', 'Slider'], { ...DEFAULT_QUERY, theme: 'dark', variant: 'vertical' });
        expect(hash).toBe('#/widget/Slider?theme=dark&variant=vertical');
        expect(parseRoute(hash).query.theme).toBe('dark');
    });
});

describe('routeHash viewport', () => {
    it('omits an undefined vp and writes every explicit one, which parses back', () => {
        expect(routeHash(['widget', 'Switch'], { ...DEFAULT_QUERY, vp: undefined })).toBe('#/widget/Switch');
        for (const vp of ['phone', 'tablet', 'desktop', 'fit'] as const) {
            const hash = routeHash(['widget', 'Switch'], { ...DEFAULT_QUERY, vp });
            expect(hash).toBe(`#/widget/Switch?vp=${vp}`);
            expect(parseRoute(hash).query.vp).toBe(vp);
        }
    });
    it('round-trips a route without vp to a query without vp', () => {
        const route = parseRoute('#/dashboard/tablet?theme=dark');
        expect(parseRoute(routeHash(route.path, route.query))).toStrictEqual(route);
    });
});

describe('applyQuery', () => {
    it('writes the dark and design style states the widgets listen to', async () => {
        const runtime = createRuntime({ test: true });
        await applyQuery(runtime, { ...DEFAULT_QUERY, theme: 'dark', style: 'legacy' }, {});
        expect(runtime.store.getState('vis2-materialdesign.0.colors.darkTheme')?.val).toBe('dark');
        expect(runtime.store.getState('vis2-materialdesign.0.designStyle')?.val).toBe('legacy');
        runtime.stop();
    });
});
