import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import { pickerValueName } from './IconFilePicker';
import { boolValue, numberValue, textValue, DEFAULT_DARK_THEME_OID, MAX_DYNAMIC_ITEMS, VisWidget, accessibleText, applyThemeVariables, boundedCount, createInfo, itemCount, darkThemeOid, resolveDarkTheme, editorDialogPalette, formatDurationTokens, formatMoment, humanizeDuration, iconFieldDataKey, parseActionValue, safeWidgetUrl, sanitizeHtml, setStateValue, SliderWriter, stateValue, stringValue } from './widgetUtils';

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
        const fields = (info.visAttrs?.find(group => group.name === 'theme')?.fields || []) as ReadonlyArray<{ name?: string; default?: string }>;
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
