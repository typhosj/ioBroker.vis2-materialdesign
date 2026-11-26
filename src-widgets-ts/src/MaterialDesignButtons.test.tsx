import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readFileSync, statSync } from 'node:fs';

import { symbolName } from './IconFilePicker';
import { createButtonClass, m3ColorExplicit, renderIcon, repeatTiming } from './MaterialDesignButtons';

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

    // Upstream #12: a single bound read as a minimum made "max 50" jump the state up to 50 and then
    // count on without a limit, and an empty field made 0 the minimum.
    it('reads a single bound in the direction of the step', () => {
        const { instance, setValue } = widget('addition');
        instance.activate({ oid: 'test.0.value', value: 5, minmax: '50' }, 10);
        instance.activate({ oid: 'test.0.value', value: 5, minmax: '50' }, 48);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '5' }, 10);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '5' }, 5);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '' }, 0);
        instance.activate({ oid: 'test.0.value', value: 5, minmax: '50;' }, 10);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: ';5' }, 10);
        expect(setValue.mock.calls).toEqual([
            ['test.0.value', 15],
            ['test.0.value', 50],
            ['test.0.value', 9],
            ['test.0.value', 5],
            ['test.0.value', -1],
            ['test.0.value', 50],
            ['test.0.value', 5],
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

    it('ignores releases without a press so a loading view writes nothing', () => {
        const { instance, setValue } = widget('toggle');
        const push = fixture<{
            press: (data: Record<string, unknown>) => void;
            release: (data: Record<string, unknown>, current: ioBroker.StateValue | undefined) => void;
            cancelPress: (data: Record<string, unknown>) => void;
        }>(instance);
        const data = { oid: 'test.0.push', pushButton: true };

        push.release(data, false);
        push.cancelPress(data);
        expect(setValue).not.toHaveBeenCalled();

        push.press(data);
        push.press(data);
        push.release(data, true);
        expect(setValue.mock.calls).toEqual([
            ['test.0.push', true],
            ['test.0.push', false],
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

describe('button icon when the image field is empty', () => {
    const render = (layout: 'default' | 'vertical' | 'icon', rxData: Record<string, unknown>, current?: ioBroker.StateValue): string => {
        const Button = createButtonClass({ ...definition('state'), layout });
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData: { oid: 'test.0.v', value: '1', buttontext: 'Scene', ...rxData }, values: { 'test.0.v.val': current } });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };

    it('shows the default icon for a widget saved without the image key', () => {
        expect(render('default', {})).toContain('mdi-plus');
        expect(render('vertical', {})).toContain('mdi-plus');
    });

    it('shows no icon on a text button whose image field was emptied', () => {
        for (const image of ['', null, 'null', '   ']) {
            expect(render('default', { image })).not.toContain('class="mdi ');
            expect(render('vertical', { image })).not.toContain('class="mdi ');
            expect(render('default', { image })).toContain('Scene');
        }
    });

    it('keeps the default icon on an icon button, which has nothing else to show', () => {
        for (const image of ['', null, 'null', '   ']) expect(render('icon', { image })).toContain('mdi-plus');
    });

    it('still shows the on icon of a button without an off icon', () => {
        expect(render('default', { image: '', imageTrue: 'check' }, 1)).toContain('mdi-check');
        expect(render('default', { image: '', imageTrue: 'check' }, 2)).not.toContain('class="mdi ');
    });

    it('falls back to the off icon while on when the on icon is empty', () => {
        for (const imageTrue of ['', null, 'null', '   ']) expect(render('default', { image: 'lightbulb', imageTrue }, 1)).toContain('mdi-lightbulb"');
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
    it('insets only the variants carrying a shadow', () => {
        expect(render({ designStyle: 'material3', md3ButtonVariant: 'elevated' })).toContain('padding:4px');
        expect(render({ designStyle: 'material3', md3ButtonVariant: 'filled' })).toContain('padding:0');
        expect(render({ designStyle: 'material3', md3ButtonVariant: 'elevated', buttonStyle: 'raised' })).toContain('padding:4px');
    });

    // The shadow is the only thing telling `raised` and `unelevated` apart; without it the two
    // legacy styles rendered identically.
    it('elevates the legacy raised style and leaves unelevated flat', () => {
        expect(render({ buttonStyle: 'raised' })).toContain('box-shadow:0 3px');
        expect(render({})).toContain('box-shadow:0 3px');
        expect(render({ buttonStyle: 'unelevated' })).not.toContain('box-shadow:');
        expect(render({ buttonStyle: 'unelevated' })).toContain('padding:0');
    });
});

// Upstream #11: a navigation button reads no object, so every "true" option stayed dead until the
// target view itself became the active state.
describe('navigation button active presentation (upstream #11)', () => {
    const Button = createButtonClass(definition('navigation'));
    const render = (activeView: string): string => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn(), activeView } })),
        );
        instance.state = fixture<typeof instance.state>({
            rxData: { nav_view: 'details', buttontext: 'Seite', labelTrue: 'Seite aktiv', labelColorTrue: '#7c0409', colorBgTrue: '#eeeeee', image: 'lightbulb-outline', imageTrue: 'lightbulb', imageTrueColor: '#00696d' },
            values: {},
        });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };

    it('shows the true label, color, background and icon on its own view', () => {
        const active = render('details');
        expect(active).toContain('Seite aktiv');
        expect(active).toContain('#7c0409');
        expect(active).toContain('#eeeeee');
        expect(active).toContain('mdi-lightbulb"');
    });

    it('stays inactive on any other view', () => {
        const inactive = render('overview');
        expect(inactive).toContain('>Seite<');
        expect(inactive).not.toContain('#7c0409');
        expect(inactive).toContain('mdi-lightbulb-outline');
    });
});

describe('repeat while held (upstream #57)', () => {
    type Press = { press: (d: Record<string, unknown>) => void; release: (d: Record<string, unknown>, current: unknown) => void; cancelPress: (d: Record<string, unknown>) => void; componentWillUnmount: () => void };
    const held = (kind: 'state' | 'addition', rxData: Record<string, unknown>, value: unknown = 0, editMode = false) => {
        vi.useFakeTimers();
        const setValue = vi.fn();
        const Button = createButtonClass(definition(kind));
        const button = new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue }, editMode }));
        const data = { oid: 'test.0.v', repeatOnHold: true, ...rxData };
        button.state = fixture<typeof button.state>({ rxData: data, data, values: { 'test.0.v.val': value } });
        return { setValue, data, api: fixture<Press>(button) };
    };

    it('a short press acts once, as without the option', () => {
        const { setValue, data, api } = held('state', { value: 'up' });
        api.press(data);
        vi.advanceTimersByTime(499);
        api.release(data, 0);
        vi.advanceTimersByTime(5000);
        expect(setValue.mock.calls).toEqual([['test.0.v', 'up']]);
    });

    it('holding repeats after the delay at the interval, and the release adds nothing', () => {
        const { setValue, data, api } = held('state', { value: 'up', repeatDelay: 500, repeatInterval: 200 });
        api.press(data);
        vi.advanceTimersByTime(500);
        expect(setValue).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(600);
        expect(setValue).toHaveBeenCalledTimes(4);
        api.release(data, 0);
        vi.advanceTimersByTime(5000);
        expect(setValue).toHaveBeenCalledTimes(4);
    });

    it('an addition counts on from its own writes and stops at the limit', () => {
        const { setValue, data, api } = held('addition', { value: 2, minmax: '0;7', repeatDelay: 0, repeatInterval: 100 }, 1);
        api.press(data);
        vi.advanceTimersByTime(450);
        api.release(data, 1);
        expect(setValue.mock.calls.map(call => call[1])).toEqual([3, 5, 7, 7, 7]);
    });

    it.each([['cancelPress'], ['componentWillUnmount']] as const)('%s stops the repeat', method => {
        const { setValue, data, api } = held('state', { value: 1, repeatDelay: 100, repeatInterval: 100 });
        api.press(data);
        vi.advanceTimersByTime(150);
        if (method === 'cancelPress') api.cancelPress(data); else api.componentWillUnmount();
        vi.advanceTimersByTime(5000);
        expect(setValue).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['option off', { repeatOnHold: false }, false],
        ['locked', { lockEnabled: true }, false],
        ['editor', {}, true],
    ])('does not repeat when %s', (_name, extra, editMode) => {
        const { setValue, data, api } = held('state', { value: 1, ...extra }, 0, editMode);
        api.press(data);
        vi.advanceTimersByTime(5000);
        expect(setValue).not.toHaveBeenCalled();
    });

    it.each([
        [{}, 500, 200],
        [{ repeatDelay: '', repeatInterval: '' }, 500, 200],
        [{ repeatDelay: 'abc', repeatInterval: Number.NaN }, 500, 200],
        [{ repeatDelay: -5, repeatInterval: 0 }, 0, 50],
        [{ repeatDelay: 99_999, repeatInterval: 99_999 }, 10_000, 10_000],
        [{ repeatDelay: '250', repeatInterval: '75' }, 250, 75],
    ])('timing %j -> delay %d, interval %d', (data, delay, interval) => {
        expect(repeatTiming(data as Record<string, never>)).toEqual({ delay, interval });
    });

    it('offers the option only on State and Addition buttons', () => {
        const names = (kind: Parameters<typeof definition>[0]) => fixture<{ getWidgetInfo: () => { visAttrs: Array<{ fields: Array<{ name: string }> }> } }>(createButtonClass(definition(kind))).getWidgetInfo().visAttrs.flatMap(group => group.fields).map(field => field.name);
        expect(names('state')).toEqual(expect.arrayContaining(['repeatOnHold', 'repeatDelay', 'repeatInterval']));
        expect(names('addition')).toContain('repeatOnHold');
        for (const kind of ['navigation', 'multiState', 'toggle'] as const) expect(names(kind)).not.toContain('repeatOnHold');
    });
});

// VisWidget.t returns the key in unit tests, so a fallback name shows up as `ariaButton` / `ariaSlider`.
describe('button accessible name', () => {
    const kinds = ['navigation', 'link', 'state', 'multiState', 'addition', 'toggle', 'slider'] as const;
    const render = (layout: 'icon' | 'default', kind: (typeof kinds)[number], rxData: Record<string, unknown>, values: Record<string, unknown> = {}): Element => {
        const Button = createButtonClass({ id: `test-${kind}`, name: 'Internal Widget Name', kind, layout, label: '', icon: 'plus' });
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData: { oid: 'test.0.x', ...rxData }, values });
        document.body.innerHTML = renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
        return document.querySelector('button')!;
    };

    describe.each(kinds)('icon layout, kind %s', kind => {
        it.each([
            ['set', 'Living room light', 'Living room light'],
            ['padded', '  Door  ', 'Door'],
            ['empty', '', 'ariaButton'],
            ['whitespace-only', '   ', 'ariaButton'],
            ['unset', undefined, 'ariaButton'],
        ])('ariaLabel %s', (_name, ariaLabel, expected) => {
            const button = render('icon', kind, { ariaLabel });
            expect(button.getAttribute('aria-label')).toBe(expected);
            if (kind === 'slider') {
                expect(document.querySelector('[role="slider"]')!.getAttribute('aria-label')).toBe(expected === 'ariaButton' ? 'ariaSlider' : expected);
            }
        });
    });

    it('never uses the internal widget name for the slider', () => {
        render('icon', 'slider', {});
        expect(document.querySelector('[role="slider"]')!.getAttribute('aria-label')).toBe('ariaSlider');
        expect(document.body.innerHTML).not.toContain('Internal Widget Name');
    });

    it('leaves a button with visible text to its content, even with ariaLabel set', () => {
        const button = render('default', 'state', { buttontext: 'Start', ariaLabel: 'Something else' });
        expect(button.hasAttribute('aria-label')).toBe(false);
        expect(button.textContent).toContain('Start');
    });

    it('treats the true label as visible text while on', () => {
        const button = render('default', 'toggle', { buttontext: '', labelTrue: 'Running', ariaLabel: 'x' }, { 'test.0.x.val': true });
        expect(button.hasAttribute('aria-label')).toBe(false);
    });

    it('falls back to ariaLabel, then ariaButton, while off with only a true label', () => {
        const rxData = { buttontext: '', labelTrue: 'Running' };
        expect(render('default', 'toggle', { ...rxData, ariaLabel: 'Pump' }).getAttribute('aria-label')).toBe('Pump');
        expect(render('default', 'toggle', rxData).getAttribute('aria-label')).toBe('ariaButton');
    });

    it('names the button by the text it shows while on with an empty true label', () => {
        const button = render('default', 'toggle', { buttontext: 'Pump', labelTrue: '', ariaLabel: 'x' }, { 'test.0.x.val': true });
        expect(button.hasAttribute('aria-label')).toBe(false);
        expect(button.textContent).toContain('Pump');
    });

    it('agrees with the rendered text for a numeric 0 as buttontext', () => {
        const button = render('default', 'state', { buttontext: 0, ariaLabel: 'Pump' });
        const shown = (button.textContent ?? '').trim() !== '';
        expect(button.hasAttribute('aria-label')).toBe(!shown);
    });

    it.each([
        ['empty', ''],
        ['unset', undefined],
        ['markup-only', '<span></span>'],
        ['nbsp-only', '&nbsp;'],
        ['blank', '   '],
    ])('falls back to ariaLabel, then ariaButton, when the text is %s', (_name, buttontext) => {
        // The definition label is empty here, so nothing else is rendered as text.
        expect(render('default', 'state', { buttontext, ariaLabel: 'Pump' }).getAttribute('aria-label')).toBe('Pump');
        expect(render('default', 'state', { buttontext }).getAttribute('aria-label')).toBe('ariaButton');
        expect(render('default', 'state', { buttontext, ariaLabel: '  ' }).getAttribute('aria-label')).toBe('ariaButton');
    });

    it('still writes its state on activation', () => {
        const { instance, setValue } = widget('state');
        instance.activate({ oid: 'test.0.value', value: '1', ariaLabel: 'Pump' }, undefined);
        expect(setValue).toHaveBeenCalledWith('test.0.value', 1);
    });
});

// Brightness only darkens: on a dark icon (the M3 light theme) the dimming was invisible.
describe('icon slider colorize', () => {
    const render = (rxData: Record<string, unknown>, current: ioBroker.StateValue | undefined, kind: 'slider' | 'state' = 'slider'): string => {
        const Button = createButtonClass({ id: `test-${kind}`, name: kind, kind, layout: 'icon', label: '', icon: 'lightbulb' });
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData: { oid: 'test.0.dim', colorize: true, showAlways: true, ...rxData }, values: { 'test.0.dim.val': current } });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };
    // Only the span around the icon may fade: the ring and the lock badge stay fully visible.
    const opacity = (html: string): number | undefined => {
        expect((html.match(/opacity:/g) ?? []).length).toBeLessThanOrEqual(1);
        const match = /display:inline-flex;opacity:([\d.]+)"><span class="mdi mdi-lightbulb"/.exec(html);
        if (!match && html.includes('opacity:')) throw new Error('opacity is not on the icon span');
        return match ? Number(match[1]) : undefined;
    };

    it('fades the icon instead of darkening it, so it shows on dark and light icons alike', () => {
        const html = render({}, 0);
        expect(html).not.toContain('brightness(');
        expect(opacity(html)).toBe(0.5);
    });

    it('runs from 1 - factor at the minimum to full at the maximum', () => {
        expect(opacity(render({ colorizeFactor: 0.6 }, 0))).toBeCloseTo(0.4);
        expect(opacity(render({ colorizeFactor: 0.6 }, 50))).toBeCloseTo(0.7);
        expect(opacity(render({ colorizeFactor: 0.6 }, 100))).toBe(1);
        expect(opacity(render({ colorizeFactor: 0.6 }, 250))).toBe(1);
        expect(opacity(render({ colorizeFactor: 0.6 }, -20))).toBeCloseTo(0.4);
    });

    it('never fades the icon below 20 %, so a large factor does not leave an empty button', () => {
        expect(opacity(render({ colorizeFactor: 1 }, 0))).toBeCloseTo(0.2);
        expect(opacity(render({ colorizeFactor: 3 }, 0))).toBeCloseTo(0.2);
        expect(opacity(render({ colorizeFactor: 1 }, 100))).toBe(1);
    });

    it('clamps a negative factor and ignores an empty one', () => {
        expect(opacity(render({ colorizeFactor: -1 }, 0))).toBe(1);
        expect(opacity(render({ colorizeFactor: '' }, 0))).toBe(0.5);
        expect(opacity(render({ colorizeFactor: 'abc' }, 0))).toBe(0.5);
    });

    it('stays at the floor of the factor when minimum and maximum are equal', () => {
        expect(opacity(render({ valueOff: 50, valueOn: 50 }, 50))).toBe(0.5);
    });

    it('leaves the icon untouched without colorize or on a button that is no slider', () => {
        expect(opacity(render({ colorize: false }, 0))).toBeUndefined();
        expect(opacity(render({}, 0, 'state'))).toBeUndefined();
    });
});

describe('icon slider diameter', () => {
    const Slider = createButtonClass({ id: 'test-slider', name: 'slider', kind: 'slider', layout: 'icon', label: '', icon: 'lightbulb' });
    const ring = (rxData: Record<string, unknown>): number => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Slider(fixture<ConstructorParameters<typeof Slider>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData: { oid: 'test.0.dim', showAlways: true, ...rxData }, values: {} });
        const match = /<svg[^>]*width="(\d+)"/.exec(renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({}))));
        return Number(match?.[1]);
    };

    it('inserts a diameter the ring can actually have (48 to 160 px)', () => {
        const info = fixture<{ getWidgetInfo(): { visAttrs?: Array<{ fields: Array<{ name: string; default?: unknown }> }> } }>(Slider).getWidgetInfo();
        const diameter = (info.visAttrs ?? []).flatMap(group => group.fields).find(field => field.name === 'sliderWidth');
        expect(diameter?.default).toBe(48);
        expect(ring({ sliderWidth: diameter?.default })).toBe(48);
    });

    it('keeps saved widgets as they were: the old default, values out of range and a missing value', () => {
        expect(ring({ sliderWidth: 20 })).toBe(48);
        expect(ring({ sliderWidth: 47 })).toBe(48);
        expect(ring({ sliderWidth: 100 })).toBe(100);
        expect(ring({ sliderWidth: 161 })).toBe(160);
        expect(ring({ sliderWidth: '' })).toBe(54);
        expect(ring({})).toBe(54);
    });
});

describe('label on a filled button', () => {
    type El = React.ReactElement<Record<string, unknown>>;
    const button = (rxData: Record<string, unknown>): React.CSSProperties => {
        const Button = createButtonClass(definition('navigation'));
        const instance = new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: {} }));
        instance.state = fixture<typeof instance.state>({ rxData: { buttontext: 'Go', ...rxData }, values: {} });
        const find = (node: React.ReactNode): El | undefined => {
            if (Array.isArray(node)) return node.map(find).find(Boolean);
            if (!React.isValidElement(node)) return undefined;
            const el = node as El;
            return el.type === 'button' ? el : find(el.props.children as React.ReactNode);
        };
        return find(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})))!.props.style as React.CSSProperties;
    };

    it.each([
        ['Classic default', {}, '#ffffff'],
        ['Classic light own color', { mdwButtonPrimaryColor: '#ffee00' }, '#1d1b20'],
        ['Classic dark own color', { mdwButtonPrimaryColor: '#003366' }, '#ffffff'],
        ['Classic unparseable color', { mdwButtonPrimaryColor: 'yellow' }, '#fff'],
        ['Classic explicit label color', { mdwButtonPrimaryColor: '#ffee00', mdwButtonSecondaryColor: '#ff0000' }, '#ff0000'],
        ['M3 theme fill', { designStyle: 'material3' }, undefined],
        ['M3 light own fill', { designStyle: 'material3', mdwButtonPrimaryColor: '#ffee00' }, '#1d1b20'],
        ['M3 explicit label color', { designStyle: 'material3', mdwButtonPrimaryColor: '#ffee00', mdwButtonSecondaryColor: '#ff0000' }, '#ff0000'],
    ])('%s', (_case, rxData, color) => {
        expect(button(rxData).color).toBe(color);
    });

    it('keeps the theme color on a Classic outlined or text button', () => {
        expect(button({ buttonStyle: 'outlined', mdwButtonPrimaryColor: '#ffee00' }).color).toBe('#ffee00');
        expect(button({ buttonStyle: 'text' }).color).toBe('#44739e');
    });
});
