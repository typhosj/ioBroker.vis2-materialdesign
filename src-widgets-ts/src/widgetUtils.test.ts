import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VisRxWidgetProps, VisRxWidgetState, WidgetData } from '@iobroker/types-vis-2';
import { pickerValueName } from './IconFilePicker';
import { DEFAULT_DARK_THEME_OID, M3_FONT_OID, M3_SCHEME_OID, M3_TOKEN_ROLES, MAX_DYNAMIC_ITEMS, VisWidget, accessibleText, applyM3SeedVariables, applyThemeVariables, boundedCount, createInfo, itemCount, darkThemeOid, designStyle, resolveDarkTheme, designStyleClasses, editorDialogPalette, formatDurationTokens, formatMoment, humanizeDuration, iconFieldDataKey, m3SeedOids, parseActionValue, parseM3Scheme, safeWidgetUrl, sanitizeHtml, setProjectDesignStyle, setStateValue, SliderWriter, sliderKeyValue, stateValue, stringValue } from './widgetUtils';

function fixture<T>(value: unknown): T { return value as T; }

describe('widget utilities', () => {
    it('keeps legacy action values typed', () => {
        expect(parseActionValue('true')).toBe(true);
        expect(parseActionValue('false')).toBe(false);
        expect(parseActionValue('12.5')).toBe(12.5);
        expect(parseActionValue('')).toBe('');
        expect(parseActionValue('on')).toBe('on');
    });

    it('reads and writes VIS2 states only for configured IDs', () => {
        const state = fixture<VisRxWidgetState>({ values: { 'test.0.value.val': 42 } });
        expect(stateValue(state, 'test.0.value')).toBe(42);
        expect(stateValue(state, '')).toBeUndefined();

        const writes: Array<[string, ioBroker.StateValue]> = [];
        const props = fixture<Parameters<typeof setStateValue>[0]>({ context: { setValue: (id: string, value: ioBroker.StateValue): void => { writes.push([id, value]); } } });
        setStateValue(props, 'test.0.value', true);
        setStateValue(props, '', false);
        expect(writes).toEqual([['test.0.value', true]]);
    });

    it('adds calendar theme selectors and applies light/dark values', () => {
        const info = createInfo('test-calendar', 'Calendar', []);
        const fields = (info.visAttrs?.find(group => group.name === 'common')?.fields || []) as ReadonlyArray<{ name?: string; default?: string }>;
        const light = fields.find(field => field.name?.includes('colors_light_d_calendar_d_border'));
        expect(light).toBeDefined();
        expect(fields.some(field => field.name === 'useTheme')).toBe(true);
        expect(fields.some(field => field.name === '__mdwThemeDark')).toBe(true);

        const data = {
            __mdwThemeDark: 'vis2-materialdesign.0.colors.darkTheme',
            [light!.name!]: light!.default,
            [`${light!.name}_dark`]: fields.find(field => field.name === `${light!.name}_dark`)?.default,
        };
        applyThemeVariables(data, {
            'vis2-materialdesign.0.colors.darkTheme.val': false,
            [`${light!.default}.val`]: '#112233',
            [`${data[`${light!.name}_dark`]}.val`]: '#445566',
        });
        expect(document.documentElement.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#112233');

        applyThemeVariables(data, {
            'vis2-materialdesign.0.colors.darkTheme.val': true,
            [`${data[`${light!.name}_dark`]}.val`]: '#445566',
        });
        expect(document.documentElement.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#445566');
    });

    it('resolves the dark-theme oid, falling back to the shared default', () => {
        expect(darkThemeOid(undefined)).toBe(DEFAULT_DARK_THEME_OID);
        expect(darkThemeOid({})).toBe(DEFAULT_DARK_THEME_OID);
        expect(darkThemeOid({ __mdwThemeDark: 'custom.0.dark' })).toBe('custom.0.dark');
    });

    it('VisWidget self-subscribes to the dark-theme oid instead of relying on VIS2 discovery', () => {
        // VIS2 only subscribes to ids present in a widget's saved data, never to an unset visAttrs
        // `default`, so a widget whose `theme` group was never touched received no dark-theme state.
        type Handler = (id: string, state: { val: unknown } | null) => void;
        const handlers: Record<string, Handler> = {};
        const subscribeState = vi.fn((id: string, cb: Handler) => { handlers[id] = cb; return Promise.resolve(); });
        const unsubscribeState = vi.fn();
        type Inspection = { isDarkTheme: () => boolean };

        const widget = fixture<Inspection & VisWidget>(new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState } } })));
        widget.state = fixture<typeof widget.state>({ rxData: {}, values: {} });

        widget.componentDidMount();
        expect(subscribeState).toHaveBeenCalledWith(DEFAULT_DARK_THEME_OID, expect.any(Function));
        expect(widget.isDarkTheme()).toBe(false);

        let forceUpdateCalls = 0;
        widget.forceUpdate = () => { forceUpdateCalls += 1; };
        handlers[DEFAULT_DARK_THEME_OID](DEFAULT_DARK_THEME_OID, { val: true });
        expect(widget.isDarkTheme()).toBe(true);
        expect(forceUpdateCalls).toBe(1);

        handlers[DEFAULT_DARK_THEME_OID](DEFAULT_DARK_THEME_OID, { val: true });
        expect(forceUpdateCalls).toBe(1);

        widget.componentWillUnmount();
        expect(unsubscribeState).toHaveBeenCalledWith(DEFAULT_DARK_THEME_OID, expect.any(Function));
    });

    it('resolves the three dark-theme settings and the booleans written before them', () => {
        expect(resolveDarkTheme(true, 'light')).toBe(true);
        expect(resolveDarkTheme('dark', 'light')).toBe(true);
        expect(resolveDarkTheme(false, 'dark')).toBe(false);
        expect(resolveDarkTheme('light', 'dark')).toBe(false);
        // Everything else, `auto` included, hands the decision to VIS2.
        expect(resolveDarkTheme('auto', 'dark')).toBe(true);
        expect(resolveDarkTheme('auto', 'light')).toBe(false);
        expect(resolveDarkTheme(undefined, 'dark')).toBe(true);
        expect(resolveDarkTheme(null, undefined)).toBe(false);
    });

    it('a widget on `auto` follows the VIS theme', () => {
        type Handler = (id: string, state: { val: unknown } | null) => void;
        const handlers: Record<string, Handler> = {};
        const subscribeState = vi.fn((id: string, cb: Handler) => { handlers[id] = cb; return Promise.resolve(); });
        type Inspection = { isDarkTheme: () => boolean };

        const widget = fixture<Inspection & VisWidget>(new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState: vi.fn() }, themeType: 'dark' } })));
        widget.state = fixture<typeof widget.state>({ rxData: {}, values: {} });
        widget.forceUpdate = () => {};

        widget.componentDidMount();
        expect(widget.isDarkTheme()).toBe(true);

        handlers[DEFAULT_DARK_THEME_OID](DEFAULT_DARK_THEME_OID, { val: 'light' });
        expect(widget.isDarkTheme()).toBe(false);
    });

    it('VisWidget subscribes to an explicit override oid instead of the shared default', () => {
        const subscribeState = vi.fn().mockResolvedValue(undefined);
        const widget = new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState: vi.fn() } } }));
        widget.state = fixture<typeof widget.state>({ rxData: { __mdwThemeDark: 'custom.0.dark' }, values: {} });

        widget.componentDidMount();
        expect(subscribeState).toHaveBeenCalledWith('custom.0.dark', expect.any(Function));
    });

    it('every widget receives the same designStyle field via createInfo(), strictly defaulting to legacy', () => {
        const info = createInfo('test-widget', 'Calendar', []);
        const commonGroup = info.visAttrs?.find(group => group.name === 'common');
        const field = commonGroup?.fields.find(candidate => candidate.name === 'designStyle') as { options?: Array<{ value: string }>; default?: string } | undefined;
        expect(field).toBeDefined();
        expect(commonGroup?.fields[0]?.name).toBe('designStyle');
        expect(commonGroup?.fields[1]?.name).toBe('useTheme');
        expect(field?.options?.map(option => option.value)).toEqual(['default', 'legacy', 'material3']);
        expect(field?.default).toBe('default');

        const withOwnCommon = createInfo('test-widget-2', 'Calendar', [{ name: 'common', fields: [{ name: 'oid', type: 'id' }] }]);
        const merged = withOwnCommon.visAttrs?.find(group => group.name === 'common')?.fields || [];
        expect(merged[0]?.name).toBe('designStyle');
        expect(merged[merged.length - 1]?.name).toBe('oid');
        expect(withOwnCommon.visAttrs?.filter(group => group.name === 'common')).toHaveLength(1);

        // Compat rule #4: missing/unknown value always means legacy.
        expect(designStyle(undefined)).toBe('legacy');
        expect(designStyle({})).toBe('legacy');
        expect(designStyle({ designStyle: 'material3' })).toBe('material3');
        expect(designStyle({ designStyle: 'not-a-real-style' })).toBe('legacy');
    });

    it('hides advanced groups until the switch is on or the widget already holds an advanced value', () => {
        const attrs = [
            { name: 'common', fields: [{ name: 'oid', type: 'id' as const }] },
            { name: 'color', fields: [{ name: 'barColor', type: 'color' as const }, { name: 'dense', type: 'checkbox' as const, default: true }, { name: 'width', type: 'number' as const, default: 4 }] },
            { name: 'rows', indexFrom: 0, indexTo: 'count', hidden: (data: WidgetData) => data.method !== 'inputPerEditor', fields: [{ name: 'rowText', type: 'text' as const }] },
        ];
        const info = createInfo('test-advanced', 'Calendar', attrs, ['color', 'rows']);
        const hiddenOf = (name: string): ((data: WidgetData, index: number) => boolean) =>
            info.visAttrs.find(group => group.name === name)!.hidden as (data: WidgetData, index: number) => boolean;

        expect(info.visAttrs.find(group => group.name === 'common')?.fields.some(field => field.name === 'showAdvanced')).toBe(true);
        // Fresh insert: VIS2 has written every declared default and nothing else.
        expect(hiddenOf('color')({ oid: '', dense: true }, 0)).toBe(true);
        expect(hiddenOf('color')({ showAdvanced: true }, 0)).toBe(false);
        // An upstream project's widget carries a value in an advanced group — every advanced group opens.
        expect(hiddenOf('color')({ barColor: '#ff0000' }, 0)).toBe(false);
        expect(hiddenOf('color')({ dense: false }, 0)).toBe(false);
        // A checkbox VIS2 materialised as `false` without a declared default is not the user's doing.
        expect(hiddenOf('color')({ barColor: '', dense: true, showAdvanced: false }, 0)).toBe(true);
        // An explicit `false` wins over the derived "on" — otherwise turning the switch off does
        // nothing at all on a widget that carries an advanced value, which every List does.
        expect(hiddenOf('color')({ barColor: '#ff0000', showAdvanced: false }, 0)).toBe(true);
        // ...but only when it was actually flipped; an absent key still derives.
        expect(hiddenOf('color')({ barColor: '#ff0000', showAdvanced: '' }, 0)).toBe(false);
        // VIS2 hands a number field back as a string; that is not a changed value.
        expect(hiddenOf('color')({ width: '4' }, 0)).toBe(true);
        expect(hiddenOf('color')({ width: '6' }, 0)).toBe(false);
        // The group's own hidden() still applies once the advanced gate is open.
        expect(hiddenOf('rows')({ showAdvanced: true, method: 'jsonStringObject' }, 0)).toBe(true);
        expect(hiddenOf('rows')({ showAdvanced: true, method: 'inputPerEditor' }, 0)).toBe(false);

        // No advanced group means no switch and no hidden() anywhere.
        const plain = createInfo('test-plain', 'Calendar', attrs);
        expect(plain.visAttrs.find(group => group.name === 'common')?.fields.some(field => field.name === 'showAdvanced')).toBe(false);
        expect(plain.visAttrs.find(group => group.name === 'color')?.hidden).toBeUndefined();
    });

    it('falls back to the project default style, which a widget\'s own choice always overrides', () => {
        try {
            setProjectDesignStyle('material3');
            expect(designStyle(undefined)).toBe('material3');
            expect(designStyle({ designStyle: 'default' })).toBe('material3');
            expect(designStyle({ designStyle: 'legacy' })).toBe('legacy');

            // Anything but 'material3' stays legacy — an untouched project must never flip on its own.
            setProjectDesignStyle(undefined);
            expect(designStyle(undefined)).toBe('legacy');
            setProjectDesignStyle('');
            expect(designStyle({ designStyle: 'default' })).toBe('legacy');
        } finally {
            setProjectDesignStyle('legacy');
        }
    });

    // Only the M3 case reaches this: every caller guards with its own `isM3`, and no CSS selects a
    // legacy class. The dark flag is the only thing left to decide.
    it('designStyleClasses adds only a root class plus the shared dark flag', () => {
        expect(designStyleClasses({ designStyle: 'material3' }, false)).toBe('mdw-style-material3');
        expect(designStyleClasses({ designStyle: 'material3' }, true)).toBe('mdw-style-material3 mdw-dark');
    });

    it('subscribes to exactly the scheme and the font, not a state per role', () => {
        expect(m3SeedOids()).toEqual([M3_SCHEME_OID, M3_FONT_OID]);
        expect(M3_SCHEME_OID).toBe('vis2-materialdesign.0.colors.md3Scheme');
    });

    it('rejects anything that is not a {light,dark} map of role→hex', () => {
        expect(parseM3Scheme(undefined)).toBeUndefined();
        expect(parseM3Scheme('')).toBeUndefined();
        expect(parseM3Scheme('not json')).toBeUndefined();
        expect(parseM3Scheme('42')).toBeUndefined();
        expect(parseM3Scheme('{}')).toEqual({ light: {}, dark: {} });
        expect(parseM3Scheme(JSON.stringify({ light: { primary: '#123456', 'not a role': '#000000', bad: 'red', 'on-surface': '#fff' }, dark: null })))
            .toEqual({ light: { primary: '#123456', 'on-surface': '#fff' }, dark: {} });
    });

    it('applies the derived scheme as the --mdw-seed-* layer, falling back to the token default when unset', () => {
        // The `--md-sys-*` tokens are declared ON the widget root and would beat anything set on `html`.
        applyM3SeedVariables({
            [`${M3_SCHEME_OID}.val`]: JSON.stringify({ light: { primary: '#123456', 'on-primary': '#ffffff' }, dark: { primary: '#ffe082', 'on-primary': '#1d1b20' } }),
            [`${M3_FONT_OID}.val`]: 'Jura-Regular',
        });
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-primary')).toBe('#123456');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-on-primary')).toBe('#ffffff');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-primary-dark')).toBe('#ffe082');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-on-primary-dark')).toBe('#1d1b20');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-font')).toBe('Jura-Regular');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-outline')).toBe('');

        // Cleared: every property is removed so the tokens-file baseline shows through the var() fallback.
        applyM3SeedVariables({ [`${M3_SCHEME_OID}.val`]: '' });
        M3_TOKEN_ROLES.forEach(role => {
            expect(document.documentElement.style.getPropertyValue(`--mdw-seed-${role}`)).toBe('');
            expect(document.documentElement.style.getPropertyValue(`--mdw-seed-${role}-dark`)).toBe('');
        });
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-font')).toBe('');

        applyM3SeedVariables(undefined);
        applyM3SeedVariables({});
    });

    it('VisWidget only subscribes to the optional M3 scheme oids for widgets actually using material3', () => {
        const subscribeState = vi.fn().mockResolvedValue(undefined);
        const unsubscribeState = vi.fn();
        const legacyWidget = new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState } } }));
        legacyWidget.state = fixture<typeof legacyWidget.state>({ rxData: {}, values: {} });
        legacyWidget.componentDidMount();
        expect(subscribeState).not.toHaveBeenCalledWith(M3_SCHEME_OID, expect.any(Function));

        subscribeState.mockClear();
        const m3Widget = new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState } } }));
        m3Widget.state = fixture<typeof m3Widget.state>({ rxData: { designStyle: 'material3' }, values: {} });
        m3Widget.componentDidMount();
        m3SeedOids().forEach(oid => expect(subscribeState).toHaveBeenCalledWith(oid, expect.any(Function)));

        m3Widget.componentWillUnmount();
        m3SeedOids().forEach(oid => expect(unsubscribeState).toHaveBeenCalledWith(oid, expect.any(Function)));
    });

    it('derives editor dialog colors from the surrounding VIS2 surface', () => {
        const surface = document.createElement('div');
        const child = document.createElement('div');
        surface.style.backgroundColor = 'rgb(48, 48, 48)';
        surface.style.color = 'rgb(255, 255, 255)';
        surface.appendChild(child);
        document.body.appendChild(surface);

        expect(editorDialogPalette(child)).toEqual({
            surface: 'rgb(48, 48, 48)',
            text: 'rgb(255, 255, 255)',
            secondaryText: 'rgba(255, 255, 255, 0.7)',
        });
        surface.remove();
    });

    it('supports both VIS2 counted-field name shapes', () => {
        expect(iconFieldDataKey('listImage', { name: 'listImage2', index: 2 })).toBe('listImage2');
        expect(iconFieldDataKey('listImage', { name: 'listImage', index: 2 })).toBe('listImage2');
    });

    it('shows icon names and file names in picker buttons', () => {
        expect(pickerValueName('home-outline')).toBe('home-outline');
        expect(pickerValueName('/icons-mfd-svg/weather/cloud%20white.svg')).toBe('cloud white.svg');
    });

    it('formats timestamps with moment-style tokens natively (no moment)', () => {
        const date = new Date(2024, 0, 5, 9, 7, 3); // 2024-01-05 09:07:03, local
        expect(formatMoment(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-05 09:07:03');
        expect(formatMoment(date, 'D.M.YY h:mm a')).toBe('5.1.24 9:07 am');
        expect(formatMoment(new Date(2024, 0, 5, 15, 0, 0), 'h A')).toBe('3 PM');
    });

    it('formats durations with the largest present token accumulating overflow', () => {
        expect(formatDurationTokens(3661, 'hh:mm:ss')).toBe('01:01:01');
        expect(formatDurationTokens(3700, 'mm:ss')).toBe('61:40'); // minutes accumulate the hour
        expect(formatDurationTokens(90061, 'd:hh:mm:ss')).toBe('1:01:01:01');
        expect(formatDurationTokens(-61, 'mm:ss')).toBe('-01:01');
    });

    it('humanizes a duration to its largest unit, localized', () => {
        expect(humanizeDuration(7200, 'en-US')).toBe('2 hours');
        expect(humanizeDuration(45, 'en-US')).toBe('45 seconds');
        expect(humanizeDuration(90000, 'en-US')).toBe('1 day');
    });

    it('sanitizes HTML sinks: strips handlers/scripts, keeps formatting', () => {
        expect(sanitizeHtml('<b style="color:red">hi</b>')).toBe('<b style="color:red">hi</b>');
        expect(sanitizeHtml('<img src="data:image/png;base64,AAAA">')).toContain('data:image/png');
        expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
        expect(sanitizeHtml('<div onclick="steal()">x</div>')).toBe('<div>x</div>');
        expect(sanitizeHtml('<script>alert(1)</script>ok')).toBe('ok');
        expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
        expect(sanitizeHtml('<a href="java\tscript:alert(1)">x</a>')).toBe('<a>x</a>');
        expect(sanitizeHtml(undefined)).toBe('');
        expect(sanitizeHtml(42)).toBe('42');
    });

    it('allows supported widget links and rejects active or ambiguous URLs', () => {
        expect(safeWidgetUrl('https://example.com/path')).toBe('https://example.com/path');
        expect(safeWidgetUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
        expect(safeWidgetUrl('/vis-2/index.html#/main')).toBe('/vis-2/index.html#/main');
        expect(safeWidgetUrl('../relative/view')).toBe('../relative/view');
        expect(safeWidgetUrl('javascript:alert(1)')).toBeUndefined();
        expect(safeWidgetUrl('java\nscript:alert(1)')).toBeUndefined();
        expect(safeWidgetUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
        expect(safeWidgetUrl('//example.com')).toBeUndefined();
    });

    it('bounds user-controlled dynamic item counts', () => {
        expect(boundedCount(-1, 3)).toBe(0);
        expect(boundedCount('4.9')).toBe(4);
        expect(boundedCount('invalid', 3)).toBe(3);
        expect(boundedCount(Infinity, 3)).toBe(3);
        expect(boundedCount(MAX_DYNAMIC_ITEMS + 1)).toBe(MAX_DYNAMIC_ITEMS);
    });

    it('reads a count option as the number of rows, never as the last index', () => {
        expect(itemCount(3)).toBe(3);
        expect(itemCount(1)).toBe(1);
        expect(itemCount('4')).toBe(4);
        // Nothing configured, an empty field or a zero still leaves one row to edit.
        expect(itemCount(undefined)).toBe(1);
        expect(itemCount('')).toBe(1);
        expect(itemCount(0)).toBe(1);
    });

    it('stringifies primitives without leaking object default strings', () => {
        expect(stringValue(12)).toBe('12');
        expect(stringValue(true)).toBe('true');
        expect(stringValue({ unsafe: true }, 'fallback')).toBe('fallback');
    });

    it('derives accessible names from configured rich text', () => {
        expect(accessibleText('<b>Open</b> &amp; close', 'Action')).toBe('Open & close');
        expect(accessibleText('', 'Action')).toBe('Action');
    });

    it('moves slider values by keyboard within min/max and on the step grid', () => {
        expect(sliderKeyValue('ArrowRight', 50, 0, 100, 5)).toBe(55);
        expect(sliderKeyValue('ArrowUp', 50, 0, 100, 5)).toBe(55);
        expect(sliderKeyValue('ArrowLeft', 50, 0, 100, 5)).toBe(45);
        expect(sliderKeyValue('ArrowDown', 50, 0, 100, 5)).toBe(45);
        expect(sliderKeyValue('PageUp', 50, 0, 100, 5)).toBe(100);
        expect(sliderKeyValue('PageDown', 50, 0, 100, 1)).toBe(40);
        expect(sliderKeyValue('Home', 50, 10, 100, 5)).toBe(10);
        expect(sliderKeyValue('End', 50, 10, 90, 5)).toBe(90);
        expect(sliderKeyValue('ArrowRight', 100, 0, 100, 5)).toBeNull();
        expect(sliderKeyValue('ArrowLeft', 0, 0, 100, 5)).toBeNull();
        expect(sliderKeyValue('Enter', 50, 0, 100, 5)).toBeNull();
        expect(sliderKeyValue('ArrowRight', 52, 0, 100, 5)).toBe(55);
        expect(sliderKeyValue('ArrowRight', 0.3, 0, 1, 0.1)).toBe(0.4);
        expect(sliderKeyValue('ArrowRight', 12, 2, 100, 5)).toBe(12 + 5);
        expect(sliderKeyValue('ArrowRight', 50, 0, 100, 0)).toBe(51);
    });
});

describe('SliderWriter', () => {
    const harness = (): { props: VisRxWidgetProps; sent: Array<[string, unknown]> } => {
        const sent: Array<[string, unknown]> = [];
        const props = { context: { setValue: (id: string, value: unknown) => sent.push([id, value]) } } as unknown as VisRxWidgetProps;
        return { props, sent };
    };

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('sends the first value at once so a tap still reacts', () => {
        const { props, sent } = harness();
        new SliderWriter(200).write(props, 'test.0.dim', 10);
        expect(sent).toEqual([['test.0.dim', 10]]);
    });

    it('collapses a drag into few writes and never loses the last value', () => {
        const { props, sent } = harness();
        const writer = new SliderWriter(200);
        for (let value = 1; value <= 20; value++) {
            writer.write(props, 'test.0.dim', value);
            vi.advanceTimersByTime(10);
        }
        writer.flush(props);
        expect(sent.length).toBeLessThanOrEqual(2);
        expect(sent[sent.length - 1]).toEqual(['test.0.dim', 20]);
    });

    it('keeps writing while the drag continues past the interval', () => {
        const { props, sent } = harness();
        const writer = new SliderWriter(200);
        writer.write(props, 'test.0.dim', 1);
        vi.advanceTimersByTime(250);
        writer.write(props, 'test.0.dim', 2);
        vi.advanceTimersByTime(250);
        expect(sent).toEqual([['test.0.dim', 1], ['test.0.dim', 2]]);
    });

    it('drops a queued write when the widget goes away', () => {
        const { props, sent } = harness();
        const writer = new SliderWriter(200);
        writer.write(props, 'test.0.dim', 1);
        writer.write(props, 'test.0.dim', 2);
        writer.cancel();
        vi.advanceTimersByTime(1000);
        expect(sent).toEqual([['test.0.dim', 1]]);
    });
});
