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
        expect(parseRoute('#/?theme=foo&style=&lang=xx&vp=0x0&test=yes')).toEqual({ path: [], query: DEFAULT_QUERY });
        expect(parseRoute('')).toEqual({ path: [], query: DEFAULT_QUERY });
        expect(parseRoute('#/widget/%E0%A4%A')).toEqual({ path: ['widget', '%E0%A4%A'], query: DEFAULT_QUERY });
    });

    it('defaults to light, Material 3, English, desktop', () => {
        expect(DEFAULT_QUERY).toEqual({ theme: 'light', style: 'material3', lang: 'en', vp: 'desktop', test: false });
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

describe('applyQuery', () => {
    it('writes the dark and design style states the widgets listen to', async () => {
        const runtime = createRuntime({ test: true });
        await applyQuery(runtime, { ...DEFAULT_QUERY, theme: 'dark', style: 'legacy' }, {});
        expect(runtime.store.getState('vis2-materialdesign.0.colors.darkTheme')?.val).toBe('dark');
        expect(runtime.store.getState('vis2-materialdesign.0.designStyle')?.val).toBe('legacy');
        runtime.stop();
    });
});
