import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VisRxWidgetProps, VisRxWidgetState, WidgetData } from '@iobroker/types-vis-2';
import { pickerValueName } from './IconFilePicker';
import { boolValue, numberValue, textValue, DEFAULT_DARK_THEME_OID, M3_FONT_OID, M3_SCHEME_OID, M3_TOKEN_ROLES, MAX_DYNAMIC_ITEMS, VisWidget, accessibleText, applyM3SeedVariables, applyThemeVariables, resolveThemeVars, boundedCount, createInfo, itemCount, darkThemeOid, designStyle, resolveDarkTheme, designStyleClasses, editorDialogPalette, formatDurationTokens, formatMoment, humanizeDuration, iconFieldDataKey, m3SeedOids, parseActionValue, parseM3Scheme, safeWidgetUrl, sanitizeHtml, setProjectDesignStyle, setStateValue, SliderWriter, sliderKeyValue, stateValue, stringValue } from './widgetUtils';

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
        const element = document.createElement('div');
        applyThemeVariables(element, data, {
            'vis2-materialdesign.0.colors.darkTheme.val': false,
            [`${light!.default}.val`]: '#112233',
            [`${data[`${light!.name}_dark`]}.val`]: '#445566',
        });
        expect(element.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#112233');

        applyThemeVariables(element, data, {
            'vis2-materialdesign.0.colors.darkTheme.val': true,
            [`${data[`${light!.name}_dark`]}.val`]: '#445566',
        });
        expect(element.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#445566');
        // The variables must stay off the document: two widgets on one view write the same names,
        // and a page-wide write lets whichever rendered last decide the colors for both.
        expect(document.documentElement.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('');

        // Two widgets, different dark resolution, same variable — each keeps its own value.
        const other = document.createElement('div');
        applyThemeVariables(other, data, {
            'vis2-materialdesign.0.colors.darkTheme.val': false,
            [`${light!.default}.val`]: '#112233',
        });
        expect(element.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#445566');
        expect(other.style.getPropertyValue('--materialdesign-widget-theme-color-calendar-border')).toBe('#112233');
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
        const subscribeState = vi.fn((ids: string | string[], cb: Handler) => { [ids].flat().forEach(id => { handlers[id] = cb; }); return Promise.resolve(); });
        const unsubscribeState = vi.fn();
        type Inspection = { isDarkTheme: () => boolean };

        const widget = fixture<Inspection & VisWidget>(new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState } } })));
        widget.state = fixture<typeof widget.state>({ rxData: {}, values: {} });

        widget.componentDidMount();
        expect(subscribeState).toHaveBeenCalledWith([DEFAULT_DARK_THEME_OID], expect.any(Function));
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
        const subscribeState = vi.fn((ids: string | string[], cb: Handler) => { [ids].flat().forEach(id => { handlers[id] = cb; }); return Promise.resolve(); });
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
        expect(subscribeState).toHaveBeenCalledWith(['custom.0.dark'], expect.any(Function));
    });

    it('every widget receives the same designStyle field via createInfo(), inserting as material3 while saved widgets stay legacy', () => {
        const info = createInfo('test-widget', 'Calendar', []);
        const commonGroup = info.visAttrs?.find(group => group.name === 'common');
        const field = commonGroup?.fields.find(candidate => candidate.name === 'designStyle') as { options?: Array<{ value: string }>; default?: string } | undefined;
        expect(field).toBeDefined();
        expect(commonGroup?.fields[0]?.name).toBe('designStyle');
        expect(commonGroup?.fields[1]?.name).toBe('useTheme');
        expect(field?.options?.map(option => option.value)).toEqual(['default', 'legacy', 'material3']);
        // Insert default. Flipping this back to 'default' would silently un-ship Material 3 for 1.0.0.
        expect(field?.default).toBe('material3');

        const withOwnCommon = createInfo('test-widget-2', 'Calendar', [{ name: 'common', fields: [{ name: 'oid', type: 'id' }] }]);
        const merged = withOwnCommon.visAttrs?.find(group => group.name === 'common')?.fields || [];
        expect(merged[0]?.name).toBe('designStyle');
        expect(merged[merged.length - 1]?.name).toBe('oid');
        expect(withOwnCommon.visAttrs?.filter(group => group.name === 'common')).toHaveLength(1);

        // Compat rule #4: missing/unknown value always means legacy. The insert default above is the
        // ONLY thing that changed in 1.0.0 — a saved widget from 0.3.x (no key) or 0.4.0 ('default')
        // must keep rendering classic, or every existing project repaints itself on update.
        expect(designStyle(undefined)).toBe('legacy');
        expect(designStyle({})).toBe('legacy');
        expect(designStyle({ designStyle: 'default' })).toBe('legacy');
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

    // Without the cache a `Project default` widget paints legacy on every load until the socket
    // answers, then switches — the flash this remembers away.
    it('remembers the project style so the first paint after a reload is already right', async () => {
        try {
            setProjectDesignStyle('material3');
            expect(window.localStorage.getItem('mdw.projectDesignStyle')).toBe('material3');

            vi.resetModules();
            const reloaded = await import('./widgetUtils');
            expect(reloaded.designStyle({ designStyle: 'default' })).toBe('material3');

            setProjectDesignStyle('legacy');
            vi.resetModules();
            const again = await import('./widgetUtils');
            expect(again.designStyle({ designStyle: 'default' })).toBe('legacy');
        } finally {
            window.localStorage.removeItem('mdw.projectDesignStyle');
            setProjectDesignStyle('legacy');
            window.localStorage.removeItem('mdw.projectDesignStyle');
            vi.resetModules();
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

    // moment's escape convention, which MDW 1.x configs already carry: every d/h/m/s of a unit label
    // was otherwise a token, so `hh:mm [Std]` came out as `08:30 St0`.
    it('keeps [bracketed] text out of both token replacers', () => {
        expect(formatDurationTokens(3661, 'hh:mm [Std]')).toBe('01:01 Std');
        expect(formatMoment(new Date(2024, 0, 5, 9, 7, 3), 'HH:mm [Uhr]')).toBe('09:07 Uhr');
    });

    // A label's letters used to decide which units were "present", so the `d` of [Stunden] claimed
    // the days unit and stole the overflow that mm was supposed to accumulate.
    it('decides the present units on the tokens alone', () => {
        expect(formatDurationTokens(3700, 'mm [Stunden]')).toBe('61 Stunden');
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
        // A `style` ELEMENT is page-wide, so a state value could hide the whole view or drop an
        // invisible full-screen layer over it. Only the style ATTRIBUTE used to be filtered.
        expect(sanitizeHtml('<style>body{display:none}</style>hi')).toBe('hi');
        expect(sanitizeHtml('<svg><style>a{}</style></svg>')).toBe('<svg></svg>');
        // mXSS: the parser re-reads the text inside <style> on the way out, and inside MathML
        // text-integration points that turns an inert <img onerror> into a live element.
        expect(sanitizeHtml('<math><mtext><table><mglyph><style><img src=1 onerror=alert(1)>')).not.toContain('onerror');
        // <object data=> and <form action=> are dropped whole, not just their URL
        expect(sanitizeHtml('<object data="javascript:alert(1)"></object>')).toBe('');
        expect(sanitizeHtml('<form action="javascript:alert(1)"><button>x</button></form>')).toBe('');
        expect(sanitizeHtml('<iframe srcdoc="<script>alert(1)</script>"></iframe>')).toBe('');
        // SVG animation elements write ANOTHER element's attribute at run time, so the URL never
        // appears on an attribute the loop below inspects. They go out whole.
        expect(sanitizeHtml('<svg><a><animate attributeName="href" to="javascript:alert(1)" /><text>x</text></a></svg>')).not.toContain('javascript:');
        expect(sanitizeHtml('<svg><set attributeName="onload" to="alert(1)" /></svg>')).toBe('<svg></svg>');
        // handler names are matched case-insensitively, and a leading space does not smuggle a scheme
        expect(sanitizeHtml('<img src=x ONERROR=alert(1)>')).toBe('<img src="x">');
        expect(sanitizeHtml('<a href=" javascript:alert(1)">x</a>')).toBe('<a>x</a>');
        expect(sanitizeHtml('<a href="vbscript:alert(1)">x</a>')).toBe('<a>x</a>');
        expect(sanitizeHtml('<div style="background:url(javascript:alert(1))">x</div>')).toBe('<div>x</div>');
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

// vis-2 strips up to two trailing digits before it looks a data key up in the widget's attribute
// info, so `__mdwTheme_…_<index>` never matched a declared field and was never subscribed: only the
// `_dark` keys were. The widget subscribes every theme key itself.
describe('VisWidget theme state subscription', () => {
    type Handler = (id: string, state: { val: unknown } | null) => void;
    type Mounted = VisWidget & { refService: { current: HTMLElement }; onRxDataChanged: (prev: unknown) => void };
    const COLOR = '__mdwTheme_colors_light_d_switch_d_on_0';
    const FONT = '__mdwTheme_fonts_switch_d_value_8';
    const SIZE = '__mdwTheme_fontSizes_switch_d_value_9';
    const themed = {
        __mdwThemeDark: DEFAULT_DARK_THEME_OID,
        [COLOR]: 'vis2-materialdesign.0.colors.light.switch.on',
        [`${COLOR}_dark`]: 'vis2-materialdesign.0.colors.dark.switch.on',
        [FONT]: 'vis2-materialdesign.0.fonts.switch.value',
        [SIZE]: 'vis2-materialdesign.0.fontSizes.switch.value',
    };
    const THEME_IDS = Object.values(themed).filter(id => id !== DEFAULT_DARK_THEME_OID);

    // socket-client takes one id or an array; every call is one getStates request.
    type Calls = () => string[][];
    function mount(rxData: Record<string, unknown> | null): { widget: Mounted; element: HTMLElement; handlers: Record<string, Handler>; subscribed: () => string[]; unsubscribed: () => string[]; subscribeCalls: Calls; unsubscribeCalls: Calls } {
        const handlers: Record<string, Handler> = {};
        const subscribeState = vi.fn((ids: string | string[], cb: Handler) => { [ids].flat().forEach(id => { handlers[id] = cb; }); return Promise.resolve(); });
        const unsubscribeState = vi.fn((_ids: string | string[], _cb: Handler) => undefined);
        const calls = (mock: typeof unsubscribeState | typeof subscribeState): Calls => () => mock.mock.calls.map(call => [call[0]].flat());
        const widget = fixture<Mounted>(new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket: { subscribeState, unsubscribeState } } })));
        const element = document.createElement('div');
        widget.state = fixture<typeof widget.state>({ rxData, values: {} });
        widget.refService = { current: element };
        widget.forceUpdate = () => widget.componentDidUpdate(widget.props, widget.state);
        widget.componentDidMount();
        return {
            widget,
            element,
            handlers,
            subscribed: () => calls(subscribeState)().flat(),
            unsubscribed: () => calls(unsubscribeState)().flat(),
            subscribeCalls: calls(subscribeState),
            unsubscribeCalls: calls(unsubscribeState),
        };
    }
    const sorted = (ids: string[]): string[] => [...ids].sort();
    const themeCalls = (all: string[][]): string[][] => all.filter(ids => ids.some(id => THEME_IDS.includes(id)));

    // An inserted widget carries up to 58 theme keys; one subscribe call per id was one request and
    // one render each. Unsubscribing sends no request and must go per id (see the next test).
    it('subscribes all theme states in one call on mount and releases them one call per id on unmount', () => {
        const { widget, subscribeCalls, unsubscribeCalls } = mount({ ...themed });
        expect(themeCalls(subscribeCalls()).map(sorted)).toEqual([sorted(THEME_IDS)]);

        widget.componentWillUnmount();
        const released = themeCalls(unsubscribeCalls());
        expect(released.every(ids => ids.length === 1)).toBe(true);
        expect(sorted(released.flat())).toEqual(sorted(THEME_IDS));
    });
    const variable = (element: HTMLElement, name: string): string => element.style.getPropertyValue(name);

    it('subscribes the light color, font and font-size states and applies them when they arrive', () => {
        const { element, handlers, subscribed } = mount({ ...themed });
        expect(subscribed()).toEqual(expect.arrayContaining(THEME_IDS));

        handlers[themed[COLOR]](themed[COLOR], { val: '#112233' });
        handlers[themed[FONT]](themed[FONT], { val: 'Roboto' });
        handlers[themed[SIZE]](themed[SIZE], { val: 18 });
        expect(variable(element, '--materialdesign-widget-theme-color-switch-on')).toBe('#112233');
        expect(variable(element, '--materialdesign-widget-theme-font-switch-value')).toBe('Roboto');
        expect(variable(element, '--materialdesign-widget-theme-font-size-switch-value')).toBe('18px');
    });

    it('takes the dark color once the dark-theme state says dark', () => {
        const { element, handlers } = mount({ ...themed });
        handlers[themed[COLOR]](themed[COLOR], { val: '#112233' });
        handlers[themed[`${COLOR}_dark`]](themed[`${COLOR}_dark`], { val: '#445566' });
        handlers[DEFAULT_DARK_THEME_OID](DEFAULT_DARK_THEME_OID, { val: true });
        expect(variable(element, '--materialdesign-widget-theme-color-switch-on')).toBe('#445566');
    });

    it('follows changed theme keys and releases everything on unmount', () => {
        const { widget, unsubscribed, subscribeCalls, unsubscribeCalls } = mount({ ...themed });
        const before = subscribeCalls().length;
        const moved = 'vis2-materialdesign.0.fonts.other.value';
        widget.state = fixture<typeof widget.state>({ rxData: { ...themed, [FONT]: moved, [SIZE]: undefined }, values: {} });
        widget.onRxDataChanged(themed);
        expect(unsubscribeCalls()).toEqual([[themed[FONT]], [themed[SIZE]]]);
        // Ids that stayed are not subscribed a second time.
        expect(subscribeCalls().slice(before)).toEqual([[moved]]);

        widget.componentWillUnmount();
        expect(unsubscribed()).toEqual(expect.arrayContaining([moved, themed[COLOR], themed[`${COLOR}_dark`]]));
        expect(unsubscribed().filter(id => id === themed[FONT])).toHaveLength(1);
    });

    it('keeps the server subscription of an id another widget still uses when one widget unmounts', () => {
        // Like socket-client: once any id of the call loses its last callback, the server is told
        // to drop every id of that call.
        const callbacks: Record<string, Handler[]> = {};
        const serverDropped: string[] = [];
        const socket = {
            subscribeState: (ids: string | string[], cb: Handler): Promise<void> => {
                [ids].flat().forEach(id => { (callbacks[id] ||= []).push(cb); });
                return Promise.resolve();
            },
            unsubscribeState: (ids: string | string[], cb: Handler): void => {
                const list = [ids].flat();
                let lost = false;
                list.forEach(id => {
                    callbacks[id] = (callbacks[id] || []).filter(candidate => candidate !== cb);
                    if (!callbacks[id].length) lost = true;
                });
                if (lost) serverDropped.push(...list);
            },
        };
        const create = (rxData: Record<string, unknown>): VisWidget => {
            const widget = new VisWidget(fixture<ConstructorParameters<typeof VisWidget>[0]>({ context: { socket } }));
            widget.state = fixture<typeof widget.state>({ rxData, values: {} });
            widget.forceUpdate = () => {};
            widget.componentDidMount();
            return widget;
        };
        const a = create({ [COLOR]: themed[COLOR], [FONT]: themed[FONT] });
        create({ [COLOR]: themed[COLOR] });

        a.componentWillUnmount();
        expect(serverDropped).toContain(themed[FONT]);
        expect(serverDropped).not.toContain(themed[COLOR]);
    });

    it('subscribes nothing for keys that are not theme keys or hold no state id', () => {
        const { subscribed } = mount({
            [COLOR]: 42,
            [FONT]: '',
            [SIZE]: '   ',
            __mdwTheme_colors_light_d_switch_d_on: 'no.index.here',
            __mdwTheme_shadows_x_1: 'unknown.type.here',
            __mdwThemeX_colors_x_1: 'wrong.prefix.here',
        });
        expect(subscribed().filter(id => id !== DEFAULT_DARK_THEME_OID && id !== 'vis2-materialdesign.0.designStyle')).toEqual([]);
    });

    it('survives a widget without data', () => {
        expect(() => mount(null).widget.componentWillUnmount()).not.toThrow();
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

// The three of these replaced a copy of `s`/`n`/`b` in fourteen widget files. The copies had
// drifted: the Calendar one read `Number.isFinite(Number(v)) ? Number(v) : d`, and because
// Number('') and Number(null) are both a finite 0, clearing a number field in the editor beat
// the declared default instead of falling back to it. These are the cases that told them apart.
describe('rxData coercions', () => {
    it('treats an unset field as unset, not as a value', () => {
        expect(numberValue('', 24)).toBe(24);
        expect(numberValue(null, 24)).toBe(24);
        expect(numberValue(undefined, 24)).toBe(24);
        expect(textValue('', 'x')).toBe('x');
        expect(textValue(null, 'x')).toBe('x');
        // VIS2 writes the STRING 'null' into a cleared id field.
        expect(textValue('null', 'x')).toBe('x');
        expect(boolValue('', true)).toBe(true);
        expect(boolValue(null, true)).toBe(true);
    });

    it('keeps a real value, including the falsy ones', () => {
        expect(numberValue(0, 24)).toBe(0);
        expect(numberValue('0', 24)).toBe(0);
        expect(numberValue(-5, 24)).toBe(-5);
        expect(textValue('0', 'x')).toBe('0');
        expect(textValue(0, 'x')).toBe('0');
        expect(boolValue(false, true)).toBe(false);
    });

    it('reads the strings VIS2 hands numbers and booleans back as', () => {
        expect(numberValue('21.5')).toBe(21.5);
        expect(boolValue('true')).toBe(true);
        expect(boolValue('1')).toBe(true);
        expect(boolValue(1)).toBe(true);
        expect(boolValue('false')).toBe(false);
        expect(boolValue('anything else')).toBe(false);
    });

    it('falls back rather than returning NaN or [object Object]', () => {
        expect(numberValue('not a number', 7)).toBe(7);
        expect(numberValue(Number.NaN, 7)).toBe(7);
        expect(numberValue(Number.POSITIVE_INFINITY, 7)).toBe(7);
        expect(textValue({}, 'x')).toBe('x');
        expect(textValue([], 'x')).toBe('x');
    });
});

describe('sanitizeHtml without a DOM parser', () => {
    afterEach(() => vi.unstubAllGlobals());

    // vis-2 renders widgets in the browser only, so nothing hits this today. It is a floor: the one
    // sink that matters must fail closed, never hand the markup through untouched.
    it('escapes the markup instead of passing it through', () => {
        vi.stubGlobal('document', undefined);
        expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
        expect(sanitizeHtml('a & b')).toBe('a &amp; b');
    });

    it('still reduces accessible text to words, not entities', () => {
        vi.stubGlobal('document', undefined);
        expect(accessibleText('<b>Kitchen</b> light', 'fallback')).toBe('Kitchen light');
        expect(accessibleText('<b></b>', 'fallback')).toBe('fallback');
    });
});

describe('resolveThemeVars', () => {
    const COLOR = '__mdwTheme_colors_light_d_switch_d_on_0';
    const SIZE = '__mdwTheme_fontSizes_switch_d_value_1';
    const data = {
        [COLOR]: 'vis2-materialdesign.0.colors.light.switch.on',
        [`${COLOR}_dark`]: 'vis2-materialdesign.0.colors.dark.switch.on',
        [SIZE]: 'vis2-materialdesign.0.fontSizes.switch.value',
        colorOn: 'var(--materialdesign-widget-theme-color-switch-on)',
        valueFontSize: 'var(--materialdesign-widget-theme-font-size-switch-value)',
        own: 'var(--my-own-variable)',
        label: 'plain',
        count: 3,
    };
    const values = {
        'vis2-materialdesign.0.colors.light.switch.on.val': '#112233',
        'vis2-materialdesign.0.colors.dark.switch.on.val': '#445566',
        'vis2-materialdesign.0.fontSizes.switch.value.val': 17,
    };

    it('replaces theme variables with the light state values, font sizes as the bare number', () => {
        expect(resolveThemeVars(data, values)).toMatchObject({ colorOn: '#112233', valueFontSize: 17, own: 'var(--my-own-variable)', label: 'plain', count: 3 });
    });

    it('takes the dark state once the dark-theme state says dark', () => {
        expect(resolveThemeVars(data, { ...values, [`${DEFAULT_DARK_THEME_OID}.val`]: true }).colorOn).toBe('#445566');
    });

    it('drops a theme variable whose state has no value yet, so the widget default applies', () => {
        const resolved = resolveThemeVars(data, {});
        expect(resolved).not.toHaveProperty('colorOn');
        expect(resolved).not.toHaveProperty('valueFontSize');
        expect(resolved.label).toBe('plain');
    });

    it('drops a theme variable the widget has no theme key for', () => {
        expect(resolveThemeVars({ colorOff: 'var(--materialdesign-widget-theme-color-switch-off)' }, values)).toEqual({});
    });

    it('returns the data unchanged when there is nothing to resolve', () => {
        expect(resolveThemeVars(null, values)).toEqual({});
        expect(resolveThemeVars({ a: 'b' }, undefined)).toEqual({ a: 'b' });
    });
});
