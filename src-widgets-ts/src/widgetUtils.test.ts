import { describe, expect, it, vi } from 'vitest';
import type { VisRxWidgetState } from '@iobroker/types-vis-2';
import { pickerValueName } from './IconFilePicker';
import { DEFAULT_DARK_THEME_OID, M3_FONT_OID, M3_SCHEME_OID, M3_TOKEN_ROLES, MAX_DYNAMIC_ITEMS, VisWidget, accessibleText, applyM3SeedVariables, applyThemeVariables, boundedCount, createInfo, darkThemeOid, designStyle, designStyleClasses, editorDialogPalette, formatDurationTokens, formatMoment, humanizeDuration, iconFieldDataKey, m3SeedOids, parseActionValue, parseM3Scheme, safeWidgetUrl, sanitizeHtml, setProjectDesignStyle, setStateValue, sliderKeyValue, stateValue, stringValue } from './widgetUtils';

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
        // Regression test for the bug documented in ../../BUGS.md: VIS2 only ever subscribes to
        // ids actually present in a widget's saved data, never to an unset visAttrs `default`, so
        // a widget whose `theme` group was never touched in the editor (no visible fields besides
        // `useTheme`, e.g. Calendar) would never receive the shared dark-theme state at all.
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

        // no re-render for a state change that doesn't flip the boolean
        handlers[DEFAULT_DARK_THEME_OID](DEFAULT_DARK_THEME_OID, { val: true });
        expect(forceUpdateCalls).toBe(1);

        widget.componentWillUnmount();
        expect(unsubscribeState).toHaveBeenCalledWith(DEFAULT_DARK_THEME_OID, expect.any(Function));
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
        // designStyle and useTheme lead the widget's `common` group, whether the widget brings one
        // of its own or not — an existing group keeps its own fields after them.
        const commonGroup = info.visAttrs?.find(group => group.name === 'common');
        const field = commonGroup?.fields.find(candidate => candidate.name === 'designStyle') as { options?: Array<{ value: string }>; default?: string } | undefined;
        expect(field).toBeDefined();
        expect(commonGroup?.fields[0]?.name).toBe('designStyle');
        expect(commonGroup?.fields[1]?.name).toBe('useTheme');
        // Default is the project default, so a widget the user never touched follows the adapter
        // setting — which itself starts at legacy, keeping compat rule #4 intact.
        expect(field?.options?.map(option => option.value)).toEqual(['default', 'legacy', 'material3']);
        expect(field?.default).toBe('default');

        const withOwnCommon = createInfo('test-widget-2', 'Calendar', [{ name: 'common', fields: [{ name: 'oid', type: 'id' }] }]);
        const merged = withOwnCommon.visAttrs?.find(group => group.name === 'common')?.fields || [];
        expect(merged[0]?.name).toBe('designStyle');
        expect(merged[merged.length - 1]?.name).toBe('oid');
        expect(withOwnCommon.visAttrs?.filter(group => group.name === 'common')).toHaveLength(1);

        // Compat rule #4: missing/unknown value always means legacy, never an implicit opt-in.
        expect(designStyle(undefined)).toBe('legacy');
        expect(designStyle({})).toBe('legacy');
        expect(designStyle({ designStyle: 'material3' })).toBe('material3');
        expect(designStyle({ designStyle: 'not-a-real-style' })).toBe('legacy');
    });

    it('falls back to the project default style, which a widget\'s own choice always overrides', () => {
        try {
            setProjectDesignStyle('material3');
            // No own style (and the "project default" option) follow the project setting ...
            expect(designStyle(undefined)).toBe('material3');
            expect(designStyle({ designStyle: 'default' })).toBe('material3');
            // ... an explicit per-widget style never does.
            expect(designStyle({ designStyle: 'legacy' })).toBe('legacy');

            // Anything but 'material3' (unset state, empty string, garbage) stays legacy — an
            // untouched project must never flip to M3 on its own.
            setProjectDesignStyle(undefined);
            expect(designStyle(undefined)).toBe('legacy');
            setProjectDesignStyle('');
            expect(designStyle({ designStyle: 'default' })).toBe('legacy');
        } finally {
            setProjectDesignStyle('legacy');
        }
    });

    it('designStyleClasses adds only a root class (plus the shared dark flag) in M3 mode', () => {
        expect(designStyleClasses(undefined, false)).toBe('mdw-style-legacy');
        expect(designStyleClasses({ designStyle: 'material3' }, false)).toBe('mdw-style-material3');
        expect(designStyleClasses({ designStyle: 'material3' }, true)).toBe('mdw-style-material3 mdw-dark');
        // Dark flag is irrelevant in legacy mode - never leaks an M3 class.
        expect(designStyleClasses({ designStyle: 'legacy' }, true)).toBe('mdw-style-legacy');
    });

    it('subscribes to exactly the scheme and the font, not a state per role', () => {
        expect(m3SeedOids()).toEqual([M3_SCHEME_OID, M3_FONT_OID]);
        expect(M3_SCHEME_OID).toBe('vis2-materialdesign.0.colors.md3Scheme');
    });

    it('rejects anything that is not a {light,dark} map of role→hex', () => {
        // The state is writable, and a role name goes straight into a CSS custom property name.
        expect(parseM3Scheme(undefined)).toBeUndefined();
        expect(parseM3Scheme('')).toBeUndefined();
        expect(parseM3Scheme('not json')).toBeUndefined();
        expect(parseM3Scheme('42')).toBeUndefined();
        expect(parseM3Scheme('{}')).toEqual({ light: {}, dark: {} });
        expect(parseM3Scheme(JSON.stringify({ light: { primary: '#123456', 'not a role': '#000000', bad: 'red', 'on-surface': '#fff' }, dark: null })))
            .toEqual({ light: { primary: '#123456', 'on-surface': '#fff' }, dark: {} });
    });

    it('applies the derived scheme as the --mdw-seed-* layer, falling back to the token default when unset', () => {
        // The `--md-sys-*` tokens themselves are declared ON the widget root by material3-tokens.css
        // and would beat anything set on `html`, so the override layer has its own variable names.
        applyM3SeedVariables({
            [`${M3_SCHEME_OID}.val`]: JSON.stringify({ light: { primary: '#123456', 'on-primary': '#ffffff' }, dark: { primary: '#ffe082', 'on-primary': '#1d1b20' } }),
            [`${M3_FONT_OID}.val`]: 'Jura-Regular',
        });
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-primary')).toBe('#123456');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-on-primary')).toBe('#ffffff');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-primary-dark')).toBe('#ffe082');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-on-primary-dark')).toBe('#1d1b20');
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-font')).toBe('Jura-Regular');
        // Roles the scheme does not carry stay unset rather than half-applied.
        expect(document.documentElement.style.getPropertyValue('--mdw-seed-outline')).toBe('');

        // Unset (or explicitly cleared): every property is removed so the material3-tokens.css
        // baseline shows through the var() fallback again, instead of pinning a stale scheme.
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
        // formatting HTML and data:image survive untouched
        expect(sanitizeHtml('<b style="color:red">hi</b>')).toBe('<b style="color:red">hi</b>');
        expect(sanitizeHtml('<img src="data:image/png;base64,AAAA">')).toContain('data:image/png');
        // active content and handlers are removed
        expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x">');
        expect(sanitizeHtml('<div onclick="steal()">x</div>')).toBe('<div>x</div>');
        expect(sanitizeHtml('<script>alert(1)</script>ok')).toBe('ok');
        expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
        // obfuscated javascript: URL (tabs/newlines between chars) is still caught
        expect(sanitizeHtml('<a href="java\tscript:alert(1)">x</a>')).toBe('<a>x</a>');
        // empty / non-string inputs are safe
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
        // clamped at the ends, and a no-op there reports "not handled" so the key stays free
        expect(sliderKeyValue('ArrowRight', 100, 0, 100, 5)).toBeNull();
        expect(sliderKeyValue('ArrowLeft', 0, 0, 100, 5)).toBeNull();
        expect(sliderKeyValue('Enter', 50, 0, 100, 5)).toBeNull();
        // off-grid state values snap onto the grid, fractional steps stay free of float noise
        expect(sliderKeyValue('ArrowRight', 52, 0, 100, 5)).toBe(55);
        expect(sliderKeyValue('ArrowRight', 0.3, 0, 1, 0.1)).toBe(0.4);
        // min offsets the grid, an invalid step falls back to 1
        expect(sliderKeyValue('ArrowRight', 12, 2, 100, 5)).toBe(12 + 5);
        expect(sliderKeyValue('ArrowRight', 50, 0, 100, 0)).toBe(51);
    });
});
