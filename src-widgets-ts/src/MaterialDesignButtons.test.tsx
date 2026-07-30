import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readFileSync, statSync } from 'node:fs';

import { symbolName } from './IconFilePicker';
import { createButtonClass, m3ColorExplicit, renderIcon } from './MaterialDesignButtons';

function fixture<T>(value: unknown): T { return value as T; }

describe('m3ColorExplicit (M3 token precedence)', () => {
    it('treats a usable saved color as explicit', () => {
        expect(m3ColorExplicit('#ffffff')).toBe(true);
        expect(m3ColorExplicit('rgb(1,2,3)')).toBe(true);
    });
    it('treats empty, non-string, or unresolvable legacy tokens as unset', () => {
        expect(m3ColorExplicit('')).toBe(false);
        expect(m3ColorExplicit(undefined)).toBe(false);
        expect(m3ColorExplicit(123)).toBe(false);
        expect(m3ColorExplicit('#mdwTheme:vis-materialdesign.0.foo')).toBe(false);
    });
});

const definition = (kind: 'navigation' | 'state' | 'multiState' | 'addition' | 'toggle') => ({
    id: `test-${kind}`,
    name: kind,
    kind,
    layout: 'default' as const,
    label: kind,
    icon: 'plus',
});

function widget(kind: Parameters<typeof definition>[0]) {
    const setValue = vi.fn();
    const changeView = vi.fn();
    const Button = createButtonClass(definition(kind));
    const instance = fixture<{
        activate: (data: Record<string, unknown>, current: ioBroker.StateValue | undefined) => void;
        componentWillUnmount: () => void;
    }>(new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue, changeView } })));
    return { changeView, instance, setValue };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('shared button actions', () => {
    it('keeps state action values typed and ignores an empty oid', () => {
        const { instance, setValue } = widget('state');
        instance.activate({ oid: 'test.0.value', value: '12.5' }, undefined);
        instance.activate({ oid: '', value: 'true' }, undefined);
        expect(setValue).toHaveBeenCalledOnce();
        expect(setValue).toHaveBeenCalledWith('test.0.value', 12.5);
    });

    it('clamps additions to configured min/max values', () => {
        const { instance, setValue } = widget('addition');
        instance.activate({ oid: 'test.0.value', value: 8, minmax: '0;10' }, 5);
        instance.activate({ oid: 'test.0.value', value: -20, minmax: '0;10' }, 5);
        expect(setValue.mock.calls).toEqual([
            ['test.0.value', 10],
            ['test.0.value', 0],
        ]);
    });

    it('supports boolean/value toggles and honors read-only', () => {
        const { instance, setValue } = widget('toggle');
        instance.activate({ oid: 'test.0.bool' }, false);
        instance.activate({ oid: 'test.0.mode', toggleType: 'value', valueOn: '1', valueOff: '0' }, 1);
        instance.activate({ oid: 'test.0.readonly', readOnly: true }, false);
        expect(setValue.mock.calls).toEqual([
            ['test.0.bool', true],
            ['test.0.mode', 0],
        ]);
    });

    it('writes indexed multi-state values and cancels delayed writes on unmount', () => {
        vi.useFakeTimers();
        const { instance, setValue } = widget('multiState');
        instance.activate({
            countOids: 1,
            oid0: 'test.0.first',
            value0: 'true',
            oid1: 'test.0.second',
            value1: '7',
            delayInMs1: 50,
        }, undefined);
        expect(setValue).toHaveBeenCalledWith('test.0.first', true);
        instance.componentWillUnmount();
        vi.runAllTimers();
        expect(setValue).not.toHaveBeenCalledWith('test.0.second', 7);
    });

    it('routes navigation through VIS2 context', () => {
        const { changeView, instance } = widget('navigation');
        instance.activate({ nav_view: 'details' }, undefined);
        expect(changeView).toHaveBeenCalledWith('details');
    });

    it('takes the slider arc colors from the M3 tokens unless one is saved', () => {
        const Button = createButtonClass({ id: 'test-slider', name: 'slider', kind: 'slider', layout: 'icon', label: '', icon: 'plus' });
        const instance = fixture<{
            state: unknown;
            renderWidgetBody: (props: unknown) => React.JSX.Element;
        }>(new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })));
        const render = (rxData: Record<string, unknown>): string => {
            instance.state = fixture<typeof instance.state>({ rxData, values: {} });
            return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
        };
        const m3 = render({ oid: 'test.0.dim', designStyle: 'material3', showAlways: true });
        expect(m3).toContain('var(--md-sys-color-primary)');
        expect(m3).not.toContain('#44739e');
        expect(render({ oid: 'test.0.dim', designStyle: 'material3', showAlways: true, foregroundColor: '#00696d' })).toContain('#00696d');
        expect(render({ oid: 'test.0.dim', showAlways: true })).toContain('#44739e');
    });
});

// Upstream #159 asks for an active icon and active icon color on the state button; the shared
// button already carries both, and `isActive` makes them fire when the state equals the write value.
describe('state button active presentation (upstream #159)', () => {
    const Button = createButtonClass(definition('state'));
    const render = (rxData: Record<string, unknown>, current: ioBroker.StateValue | undefined): string => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData, values: { 'test.0.mode.val': current } });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };
    const rxData = { oid: 'test.0.mode', value: '2', image: 'lightbulb-outline', imageColor: '#111111', imageTrue: 'lightbulb', imageTrueColor: '#00696d', colorBgTrue: '#eeeeee' };

    it('swaps icon, icon color and background while the state holds the write value', () => {
        const active = render(rxData, 2);
        expect(active).toContain('mdi-lightbulb"');
        expect(active).toContain('#00696d');
        expect(active).toContain('#eeeeee');
    });

    it('keeps the inactive icon and color for any other value', () => {
        const inactive = render(rxData, 1);
        expect(inactive).toContain('mdi-lightbulb-outline');
        expect(inactive).toContain('#111111');
        expect(inactive).not.toContain('#00696d');
    });
});

describe('Material Symbols as a second icon source', () => {
    const html = (value: string): string => renderToStaticMarkup(renderIcon(value, '#000', 24));

    it('renders an `ms-` value as a ligature, not as an MDI class', () => {
        expect(html('ms-light_mode')).toContain('class="mdw-symbol"');
        expect(html('ms-light_mode')).toContain('>light_mode<');
        expect(html('ms-light_mode')).not.toContain('mdi-');
    });

    it('leaves every other value kind on its old path', () => {
        expect(html('weather-sunny')).toContain('class="mdi mdi-weather-sunny"');
        expect(html('mdi-weather-sunny')).toContain('class="mdi mdi-weather-sunny"');
        expect(html('/icons/lamp.png')).toContain('<img');
        expect(symbolName('weather-sunny')).toBeNull();
        expect(symbolName('ms-')).toBe('');
    });

    it('carries no MDI name that the `ms-` prefix would shadow', () => {
        const mdi = readFileSync('src-widgets-ts/src/mdi-font.css', 'utf8');
        expect(mdi).not.toMatch(/\.mdi-ms-[a-z0-9-]+::before/);
    });

    it('ships one static face below the MDI font, and every offered name in it', () => {
        const css = readFileSync('src-widgets-ts/src/material-symbols.css', 'utf8');
        const file = css.match(/url\('\.\.\/img\/([^']+)'\)/)?.[1];
        expect(file).toBe('material-symbols-outlined.woff2');
        // A ligature source with `liga` off renders its own name as text; `swap` shows that text
        // while the face loads. Both are silent, and both look like a broken icon.
        expect(css).toContain("font-feature-settings: 'liga'");
        expect(css).toContain('font-display: block');
        // The 2025 variable face is 487,736 B. Phase 9.3 accepted Symbols on the measurement that
        // the pinned static instance stays UNDER the MDI font it sits next to.
        const symbols = statSync(`src-widgets-ts/static/img/${file}`).size;
        expect(symbols).toBeLessThan(statSync('src-widgets-ts/static/img/materialdesignicons-webfont.woff2').size);

        const names = JSON.parse(readFileSync('src-widgets-ts/src/generated/materialSymbolsNames.json', 'utf8')) as string[];
        expect(names.length).toBeGreaterThan(3000);
        // Anything outside the ligature alphabet cannot resolve to a glyph, and a name carrying the
        // prefix would round-trip through symbolName() as a different icon.
        expect(names.filter(name => !/^[a-z0-9_]+$/.test(name))).toEqual([]);
    });
});

// VIS2 clips a widget at its box, so a shadow drawn on the box edge is invisible.
describe('elevated button shadow room', () => {
    const Button = createButtonClass(definition('state'));
    const render = (rxData: Record<string, unknown>): string => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData, values: {} });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };
    it('insets only the elevated variant, the only one carrying a shadow', () => {
        expect(render({ designStyle: 'material3', md3ButtonVariant: 'elevated' })).toContain('padding:4px');
        expect(render({ designStyle: 'material3', md3ButtonVariant: 'filled' })).toContain('padding:0');
        expect(render({ md3ButtonVariant: 'elevated' })).toContain('padding:0');
    });
});
