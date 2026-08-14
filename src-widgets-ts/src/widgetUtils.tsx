import React from 'react';
import '@fontsource/jura/files/jura-latin-400-normal.woff2';
import '@fontsource/roboto-condensed/files/roboto-condensed-latin-400-normal.woff2';

import type { RxRenderWidgetProps, RxWidgetInfo, RxWidgetInfoAttributesField, VisRxWidgetProps, VisRxWidgetState, WidgetData } from '@iobroker/types-vis-2';
import { IconFilePicker, type PickerSocket, type PickerTexts, type PickerTheme } from './IconFilePicker';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';
import colors from '../../admin/lib/colors.json';
import fonts from '../../admin/lib/fonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
// Importing ./translations here would pull its ~500 kB editor chunk into every widget.
import groupLabels from './generated/groupLabels.json';
import '../../fonts.css';
import './mdi-font.css';
import './material-symbols.css';
import './materialdesign-mdc.css';
import './vis2-editor-dialog.css';
import './material3-tokens.css';
import './material3-components.css';

// VIS2 resolves attribute-group headers via the legacy dictionary, which component i18n does not populate.
(function registerGroupLabels(): void {
    const win = window as unknown as { systemDictionary?: Record<string, Record<string, string>> };
    const sd = (win.systemDictionary ||= {});
    (Object.keys(groupLabels) as Array<keyof typeof groupLabels>).forEach(lang => {
        const words = groupLabels[lang] as Record<string, string>;
        Object.keys(words).forEach(key => {
            (sd[key] ||= {})[lang as string] = words[key];
        });
    });
})();

export interface BaseRxData {
    oid: string;
    label: string;
    prefix: string;
    suffix: string;
    color: string;
    size: string;
    icon: string;
    value: string;
}

export interface PressState {
    active?: boolean;
    hovered?: boolean;
}

export interface WidgetState extends VisRxWidgetState {
    active?: boolean;
    hovered?: boolean;
    unlocked?: boolean;
}

export const setColor = '#ffc107';
export const MAX_DYNAMIC_ITEMS = 100;

export function stringValue(value: unknown, fallback = ''): string {
    return typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint'
          ? String(value)
          : fallback;
}

// How many indexed rows a "count" option asks for. VIS 1 stored the LAST INDEX in these options, so
// its "number of data sets = 3" drew four — the label promised one thing and the loop `i <= count`
// did another. Here the number means the number of rows, and the editor hides the row at index
// `count` (vis-2 always expands 0..count, one more than we want).
export function itemCount(value: unknown, fallback = 1): number {
    return Math.max(1, boundedCount(value, fallback, MAX_DYNAMIC_ITEMS));
}

export function boundedCount(value: unknown, fallback = 0, max = MAX_DYNAMIC_ITEMS): number {
    const parsed = Number(value);
    return Math.min(max, Math.max(0, Math.floor(Number.isFinite(parsed) ? parsed : fallback)));
}

const SAFE_WIDGET_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeWidgetUrl(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const url = value.trim();
    // eslint-disable-next-line no-control-regex -- browser URL parsing ignores these obfuscating controls
    if (!url || /[\u0000-\u001f\u007f]/.test(url) || /^[\\/]{2}/.test(url)) return undefined;
    const scheme = url.match(/^([a-z][a-z\d+.-]*):/i)?.[1];
    return !scheme || SAFE_WIDGET_PROTOCOLS.has(`${scheme.toLowerCase()}:`) ? url : undefined;
}

export const commonAttrs = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            {
                name: 'oid',
                label: 'oid',
                type: 'id',
            },
            {
                name: 'label',
                label: 'label',
                type: 'text',
                default: '',
            },
        ],
    },
];

export const valueTextAttrs = [
    ...commonAttrs,
    {
        name: 'text',
        fields: [
            {
                name: 'prefix',
                label: 'prefix',
                type: 'text',
                default: '',
            },
            {
                name: 'suffix',
                label: 'suffix',
                type: 'text',
                default: '',
            },
        ],
    },
];

export function stateValue(state: VisRxWidgetState, oid: string): ioBroker.StateValue | undefined {
    return oid ? state.values?.[`${oid}.val`] : undefined;
}

export function visLocale(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const win = window as unknown as { vis?: { language?: string }; systemLang?: string };
    return win.vis?.language || win.systemLang || window.navigator.language;
}

// Longer tokens must precede shorter ones so YYYY beats YY.
export function formatMoment(date: Date, token: string, locale?: string): string {
    if (!token) return '';
    const pad = (value: number): string => String(value).padStart(2, '0');
    const hours12 = date.getHours() % 12 || 12;
    const map: Record<string, () => string> = {
        YYYY: () => String(date.getFullYear()),
        YY: () => String(date.getFullYear()).slice(-2),
        MMMM: () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(date),
        MMM: () => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', ''),
        MM: () => pad(date.getMonth() + 1),
        M: () => String(date.getMonth() + 1),
        DD: () => pad(date.getDate()),
        D: () => String(date.getDate()),
        dddd: () => new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
        ddd: () => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', ''),
        dd: () => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date),
        HH: () => pad(date.getHours()),
        H: () => String(date.getHours()),
        hh: () => pad(hours12),
        h: () => String(hours12),
        mm: () => pad(date.getMinutes()),
        m: () => String(date.getMinutes()),
        ss: () => pad(date.getSeconds()),
        s: () => String(date.getSeconds()),
        A: () => (date.getHours() < 12 ? 'AM' : 'PM'),
        a: () => (date.getHours() < 12 ? 'am' : 'pm'),
    };
    return token.replace(/YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|dd|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g, match => (map[match] ? map[match]() : match));
}

// The largest unit present accumulates the overflow, matching moment-duration-format.
export function formatDurationTokens(totalSeconds: number, template: string): string {
    const units: Array<[string, number]> = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
    if (!units.some(([letter]) => template.includes(letter))) return String(totalSeconds);
    const sign = totalSeconds < 0 ? '-' : '';
    let remainder = Math.abs(Math.floor(totalSeconds));
    const values: Record<string, number> = {};
    for (const [letter, per] of units) {
        if (!template.includes(letter)) continue;
        values[letter] = Math.floor(remainder / per);
        remainder %= per;
    }
    return sign + template.replace(/dd|hh|mm|ss|d|h|m|s/g, token => {
        const value = values[token[0]];
        if (value === undefined) return token;
        return token.length === 2 ? String(value).padStart(2, '0') : String(value);
    });
}

export function humanizeDuration(totalSeconds: number, locale?: string): string {
    const abs = Math.abs(totalSeconds);
    const table: Array<[Intl.NumberFormatOptions['unit'], number]> = [
        ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400],
        ['hour', 3600], ['minute', 60], ['second', 1],
    ];
    let unit: Intl.NumberFormatOptions['unit'] = 'second';
    let value = Math.round(abs);
    for (const [candidate, per] of table) {
        if (abs >= per) { unit = candidate; value = Math.round(abs / per); break; }
    }
    try {
        return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
    } catch {
        return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }
}

// Route every HTML sink through html() below: on* handlers and javascript: URLs execute when
// inserted via innerHTML, and state values reach these sinks.
const UNSAFE_ELEMENTS = 'script,iframe,object,embed,base,meta,link,form,noscript';
const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'background', 'poster', 'data']);
export function sanitizeHtml(input: unknown): string {
    if (input === null || input === undefined) return '';
    const html = stringValue(input);
    if (!html || typeof document === 'undefined') return html;
    const template = document.createElement('template');
    template.innerHTML = html;
    template.content.querySelectorAll(UNSAFE_ELEMENTS).forEach(element => element.remove());
    template.content.querySelectorAll('*').forEach(element => {
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.name.toLowerCase();
            const value = attribute.value;
            if (name.startsWith('on')) {
                element.removeAttribute(attribute.name);
                // eslint-disable-next-line no-control-regex -- deliberately strip C0 controls/space that obfuscate `java\0script:`
            } else if (URL_ATTRS.has(name) && /^(?:javascript|vbscript|data:text\/html)/i.test(value.replace(/[\x00-\x20]+/g, ''))) {
                element.removeAttribute(attribute.name);
            } else if (name === 'style' && /(?:expression|javascript:|vbscript:|url\s*\(\s*['"]?\s*(?:javascript|vbscript):)/i.test(value)) {
                element.removeAttribute(attribute.name);
            }
        }
    });
    return template.innerHTML;
}

export function html(input: unknown): { dangerouslySetInnerHTML: { __html: string } } {
    return { dangerouslySetInnerHTML: { __html: sanitizeHtml(input) } };
}

export function accessibleText(input: unknown, fallback: string): string {
    const html = sanitizeHtml(input);
    if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.textContent?.trim() || fallback;
}

export function sizeCss(value: unknown, fallbackPx: number): string {
    if (typeof value === 'string') {
        const text = value.trim();
        if (text.startsWith('var(') || /[a-z%)]$/i.test(text)) return text;
    }
    const num = value === '' || value === null || value === undefined ? NaN : Number(value);
    return `${Number.isFinite(num) ? num : fallbackPx}px`;
}

export function setStateValue(props: VisRxWidgetProps, oid: string, value: ioBroker.StateValue): void {
    const context = (props as unknown as { context?: { setValue?: (id: string, value: ioBroker.StateValue) => void } }).context;
    if (oid && context?.setValue) {
        context.setValue(oid, value);
    }
}

export function parseActionValue(value: string): ioBroker.StateValue {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (value !== '' && !Number.isNaN(Number(value))) {
        return Number(value);
    }
    return value;
}

// An overlay (drawer, dialog) can never beat a sibling widget with its own z-index: as soon as the
// user sets "z-index" in the widget's CSS-general settings, the vis-2 wrapper element becomes a
// stacking context and every z-index inside it is only sorted against its own siblings. So the
// wrapper itself has to be lifted while the overlay is open — it is vis-2's element, hence the walk
// up from our own root node.
// ponytail: vis-2 re-rendering the wrapper drops the lift again; re-apply on our next render is
// enough in practice. Move the overlay into a portal if that ever proves too weak.
export function liftWidgetLayer(root: HTMLElement | null, zIndex: number | null): void {
    const wrapper = root?.parentElement;
    if (!wrapper) return;
    // The wrapper usually carries the z-index the user set in the widget's CSS-general settings, so
    // closing has to put that value back — clearing the property would drop the widget's own layer.
    if (zIndex === null) {
        if (wrapper.dataset.mdwLiftedFrom === undefined) return;
        wrapper.style.zIndex = wrapper.dataset.mdwLiftedFrom;
        delete wrapper.dataset.mdwLiftedFrom;
        return;
    }
    if (wrapper.dataset.mdwLiftedFrom === undefined) wrapper.dataset.mdwLiftedFrom = wrapper.style.zIndex;
    wrapper.style.zIndex = String(zIndex);
}

export function card(children: React.ReactNode): React.JSX.Element {
    return <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 8 }}>{children}</div>;
}

export function squarePreview(glyph: string): string {
    return (
        '<style>@font-face{font-family:"Material Design Icons";src:url("widgets/vis2-materialdesign/img/materialdesignicons-webfont.woff2") format("woff2");}' +
        '.mdw-prev-icon{font-family:"Material Design Icons";font-weight:normal;font-style:normal;line-height:1;display:inline-block;}</style>' +
        '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:0;">' +
        '<div style="width:100%;max-width:44px;aspect-ratio:1;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);box-sizing:border-box;">' +
        `<span class="mdw-prev-icon" style="font-size:22px;color:#44739e;">&#x${glyph};</span></div></div>`
    );
}

// A field counts as "set" only when it deviates from what a fresh insert would have written, so a
// checkbox VIS2 materialises as `false` without a default does not count as the user's doing.
function fieldIsSet(field: RxWidgetInfoAttributesField, data: WidgetData): boolean {
    const { name, default: def } = field as { name?: string; default?: string | number | boolean };
    if (!name) {
        return false;
    }
    const value = data[name];
    const fallback = def ?? (typeof value === 'boolean' ? false : undefined);
    // Compared as text: VIS2 hands a number field back as the string "4" against a numeric default 4,
    // and a strict comparison would read every such widget as touched.
    return value !== undefined && value !== null && value !== '' && String(value) !== String(fallback);
}

export function createInfo(id: string, name: string, attrs: RxWidgetInfo['visAttrs'], advancedGroups: readonly string[] = []): RxWidgetInfo {
    const shared: RxWidgetInfoAttributesField[] = [
        { name: 'designStyle', type: 'select', label: 'designStyle', options: [{ value: 'default', label: 'designStyle_default' }, { value: 'legacy', label: 'legacy' }, { value: 'material3', label: 'material3' }], default: 'default' },
        ...themeFields(name),
    ];
    const advanced = new Set(advancedGroups);
    const advancedFields = attrs.filter(group => advanced.has(group.name)).flatMap(group => [...group.fields]);
    if (advancedFields.length) {
        // Right behind designStyle, ahead of the theme block — a master switch buried under ~40 theme
        // selectors is one nobody finds.
        shared.splice(1, 0, { name: 'showAdvanced', type: 'checkbox', label: 'showAdvanced' });
    }
    // Three-state on purpose. Untouched, the switch has no key at all and the answer is derived: a
    // widget carried over from an upstream project already holds advanced values, and hiding those
    // would lose them from view. Once the user has actually flipped it, their choice wins in BOTH
    // directions — deriving "on" over an explicit `false` makes turning it off a no-op, which is what
    // every List does (they all carry `listItemHeight`).
    const showAdvanced = (data: WidgetData): boolean =>
        data.showAdvanced === undefined || data.showAdvanced === null || data.showAdvanced === ''
            ? advancedFields.some(field => fieldIsSet(field, data))
            : !!data.showAdvanced;
    const common = attrs.find(group => group.name === 'common');
    const groups = attrs.map(group => {
        const withShared = group === common ? { ...group, fields: [...shared, ...group.fields] } : group;
        if (!advanced.has(group.name)) {
            return withShared;
        }
        const own = typeof group.hidden === 'function' ? group.hidden : undefined;
        return {
            ...withShared,
            hidden: (data: WidgetData, index: number): boolean => !showAdvanced(data) || (own ? own(data, index) : false),
        };
    });
    return {
        id,
        visSet: 'vis2-materialdesign',
        visSetLabel: 'Material Design',
        visSetColor: setColor,
        visName: name,
        visPrev: '',
        visAttrs: common ? groups : [{ name: 'common', fields: shared }, ...groups],
    };
}

export type DesignStyle = 'legacy' | 'material3';

// Module-level: designStyle() is called synchronously from ~30 widgets and cannot await a socket.
export const DEFAULT_DESIGN_STYLE_OID = 'vis2-materialdesign.0.designStyle';
let projectDesignStyle: DesignStyle = 'legacy';

export function setProjectDesignStyle(value: ioBroker.StateValue | undefined): void {
    projectDesignStyle = value === 'material3' ? 'material3' : 'legacy';
}

export function designStyle(data: Record<string, unknown> | null | undefined): DesignStyle {
    const value = data?.designStyle;
    return value === 'material3' || value === 'legacy' ? value : projectDesignStyle;
}

export function designStyleClasses(data: Record<string, unknown> | null | undefined, isDark: boolean): string {
    if (designStyle(data) !== 'material3') return 'mdw-style-legacy';
    return isDark ? 'mdw-style-material3 mdw-dark' : 'mdw-style-material3';
}

// The caller's <input> is stretched over the whole control, which is what keeps the target >= 24 px (WCAG 2.5.8).
export function m3Switch(options: {
    on: boolean;
    input: React.ReactNode;
    trackOn?: string;
    trackOff?: string;
    thumbOn?: string;
    thumbOff?: string;
    disabled?: boolean;
    filter?: string;
    /** M3 "switch with icons": a check mark inside the selected handle. Off by default. */
    icon?: boolean;
    margin?: number;
    rootProps?: React.HTMLAttributes<HTMLDivElement>;
}): React.JSX.Element {
    const { on, input, trackOn, trackOff, thumbOn, thumbOff, disabled, filter, icon, margin, rootProps } = options;
    const motion = 'var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-decelerate)';
    return (
        <div
            aria-checked={on}
            className="materialdesign-md3-switch"
            role="switch"
            {...rootProps}
            style={{
                filter,
                flex: '0 0 auto',
                height: 32,
                marginLeft: margin,
                marginRight: margin,
                opacity: disabled ? 0.38 : undefined,
                overflow: 'visible',
                position: 'relative',
                width: 52,
                ...rootProps?.style,
            }}
        >
            <div
                style={{
                    background: on ? trackOn || 'var(--md-sys-color-primary)' : trackOff || 'var(--md-sys-color-surface-container-high)',
                    border: on ? undefined : '2px solid var(--md-sys-color-outline)',
                    borderRadius: 16,
                    boxSizing: 'border-box',
                    inset: 0,
                    position: 'absolute',
                }}
            />
            <div
                className="mdw-state-layer"
                style={{
                    borderRadius: '50%',
                    color: on ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)',
                    height: 40,
                    left: on ? 16 : -4,
                    position: 'absolute',
                    top: -4,
                    width: 40,
                }}
            />
            <div
                className="mdw-md3-switch-handle"
                style={{
                    alignItems: 'center',
                    background: on ? thumbOn || 'var(--md-sys-color-on-primary)' : thumbOff || 'var(--md-sys-color-outline)',
                    borderRadius: '50%',
                    display: 'flex',
                    height: on ? 24 : 16,
                    justifyContent: 'center',
                    left: on ? 24 : 8,
                    position: 'absolute',
                    top: on ? 4 : 8,
                    transition: `left ${motion}, width ${motion}, height ${motion}, transform ${motion}`,
                    width: on ? 24 : 16,
                    // Scaling keeps the circle on the position the inline left/top already computed.
                    ['--mdw-switch-pressed-scale' as string]: on ? 28 / 24 : 28 / 16,
                }}
            >
                {icon && on ? (
                    <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
                        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="var(--md-sys-color-primary)" />
                    </svg>
                ) : null}
            </div>
            <span style={{ inset: 0, position: 'absolute' }}>{input}</span>
        </div>
    );
}

// Returns null when the key is not a slider key or the value would not change; the caller then
// leaves the event alone.
export function sliderKeyValue(key: string, value: number, min: number, max: number, step: number): number | null {
    const unit = Number.isFinite(step) && step > 0 ? step : 1;
    const target = key === 'ArrowRight' || key === 'ArrowUp' ? value + unit
        : key === 'ArrowLeft' || key === 'ArrowDown' ? value - unit
            : key === 'PageUp' ? value + unit * 10
                : key === 'PageDown' ? value - unit * 10
                    : key === 'Home' ? min
                        : key === 'End' ? max
                            : null;
    if (target === null) return null;
    // Snap to the step grid measured from `min`, then round away binary-float noise.
    const snapped = key === 'Home' || key === 'End' ? target : min + Math.round((target - min) / unit) * unit;
    const next = Math.round(Math.min(max, Math.max(min, snapped)) * 1e6) / 1e6;
    return next === value ? null : next;
}

// Older editor builds keep the base name and expose the row as `field.index`; support both shapes.
export function iconFieldDataKey(name: string, field: { name?: string; index?: number }): string {
    const fieldName = field.name ?? name;
    return field.index === undefined || fieldName !== name ? fieldName : `${fieldName}${field.index}`;
}

export function iconField(name: string, label: string, def?: string): RxWidgetInfoAttributesField {
    return {
        type: 'custom',
        name,
        label,
        default: def,
        component: (field, data, onDataChange, props) => {
            const pickerTexts: PickerTexts = {
                adapter: VisWidget.t('iconPickerAdapter'),
                cancel: VisWidget.t('iconPickerCancel'),
                choose: VisWidget.t('iconPickerChoose'),
                chooseEllipsis: VisWidget.t('iconPickerChooseEllipsis'),
                clear: VisWidget.t('iconPickerClear'),
                empty: VisWidget.t('iconPickerEmpty'),
                file: VisWidget.t('iconPickerFile'),
                icon: VisWidget.t('iconPickerIcon'),
                loading: VisWidget.t('iconPickerLoading'),
                preview: VisWidget.t('iconPickerPreview'),
                search: VisWidget.t('iconPickerSearch'),
                up: VisWidget.t('iconPickerUp'),
            };
            const indexedField = field as { name?: string; index?: number };
            const key = iconFieldDataKey(name, indexedField);
            const rec = data as Record<string, unknown>;
            const ctx = (props as { context?: { socket?: PickerSocket; theme?: PickerTheme } })?.context;
            return (
                <IconFilePicker
                    label={VisWidget.t(label)}
                    onChange={value => onDataChange({ [key]: value })}
                    socket={ctx?.socket}
                    texts={pickerTexts}
                    theme={ctx?.theme}
                    value={stringValue(rec[key])}
                />
            );
        },
    };
}

type ThemeEntry = { id: string; desc: string; widget: string };
type ThemeType = 'colors' | 'fonts' | 'fontSizes';

const themeLists: Record<ThemeType, ThemeEntry[]> = { colors, fonts, fontSizes };
const themeNameAliases: Record<string, string> = {
    Button: 'Buttons',
    'HTML Card': 'HTML Card',
    'Preview Color Schemes': 'Color Scheme Preview',
};

function themeEntries(widgetName: string): Array<{ type: ThemeType; entry: ThemeEntry }> {
    const name = themeNameAliases[widgetName] || widgetName;
    return (Object.keys(themeLists) as ThemeType[]).flatMap(type => themeLists[type]
        .filter(entry => entry.widget.split(', ').includes(name))
        .map(entry => ({ type, entry })));
}

function cssVariable(type: ThemeType, id: string): string {
    const normalized = id.replace(/^light\.|^dark\./, '').replace(/\./g, '-').replace(/_/g, '-');
    if (type === 'colors') return `--materialdesign-widget-theme-color-${normalized}`;
    if (type === 'fonts') return `--materialdesign-widget-theme-font-${normalized}`;
    return `--materialdesign-widget-theme-font-size-${normalized}`;
}

function themeStateId(type: ThemeType, id: string, dark = false): string {
    if (type === 'colors') return `vis2-materialdesign.0.colors.${dark ? id.replace(/^light\./, 'dark.') : id}`;
    return `vis2-materialdesign.0.${type}.${id}`;
}

export function editorDialogPalette(start: Element | null): { surface: string; text: string; secondaryText: string } {
    let current = start;
    while (current) {
        const style = window.getComputedStyle(current);
        if (style.backgroundColor && style.backgroundColor !== 'transparent' && !/rgba\([^)]*,\s*0(?:\.0+)?\)/.test(style.backgroundColor)) {
            const channels = style.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number);
            const dark = !!channels && (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 < 128;
            return {
                surface: style.backgroundColor,
                text: style.color || (dark ? '#fff' : 'rgba(0, 0, 0, 0.87)'),
                secondaryText: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            };
        }
        current = current.parentElement;
    }
    return { surface: '#fff', text: 'rgba(0, 0, 0, 0.87)', secondaryText: 'rgba(0, 0, 0, 0.6)' };
}

function UseThemeButton(props: { entries: Array<{ type: ThemeType; entry: ThemeEntry }>; data: Record<string, unknown>; onDataChange: (data: Record<string, unknown>) => void }): React.JSX.Element {
    const dialogRef = React.useRef<HTMLDialogElement>(null);
    const titleId = React.useId();
    const descriptionId = React.useId();
    const close = (): void => dialogRef.current?.close();
    const open = (event: React.MouseEvent<HTMLButtonElement>): void => {
        const dialog = dialogRef.current;
        if (!dialog || dialog.open) return;
        const palette = editorDialogPalette(event.currentTarget.parentElement);
        dialog.style.setProperty('--mdw-editor-dialog-surface', palette.surface);
        dialog.style.setProperty('--mdw-editor-dialog-text', palette.text);
        dialog.style.setProperty('--mdw-editor-dialog-secondary-text', palette.secondaryText);
        dialog.showModal();
    };
    const apply = (): void => {
        const next = { ...props.data };
        props.entries.forEach(({ type, entry }) => {
            const value = `var(${cssVariable(type, entry.id)})`;
            next[entry.desc] = value;
            Object.keys(next).filter(key => new RegExp(`^${entry.desc}\\d+$`).test(key)).forEach(key => { next[key] = value; });
        });
        props.onDataChange(next);
        close();
    };
    return <>
        <button className="mdw-editor-button mdw-editor-button--outlined" onClick={open} type="button">{VisWidget.t('useTheme')}</button>
        <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className="mdw-editor-dialog" onClick={event => { if (event.target === event.currentTarget) close(); }} ref={dialogRef}>
            <div className="mdw-editor-dialog__paper">
                <h2 className="mdw-editor-dialog__title" id={titleId}>{VisWidget.t('useTheme')}</h2>
                <div className="mdw-editor-dialog__content"><p id={descriptionId}>{VisWidget.t('all colors, fonts and font sizes of the widget will be overridden - do you want to continue?')}</p></div>
                <div className="mdw-editor-dialog__actions">
                    <button className="mdw-editor-button mdw-editor-button--text" onClick={close} type="button">{VisWidget.t('cancel')}</button>
                    <button autoFocus className="mdw-editor-button mdw-editor-button--contained" onClick={apply} type="button">{VisWidget.t('ok')}</button>
                </div>
            </div>
        </dialog>
    </>;
}

function encodeThemeId(id: string): string {
    return id.replace(/_/g, '_u_').replace(/\./g, '_d_');
}

function decodeThemeId(id: string): string {
    return id.replace(/_d_/g, '.').replace(/_u_/g, '_');
}

function themeFields(widgetName: string): RxWidgetInfo['visAttrs'][number]['fields'] {
    const entries = themeEntries(widgetName);
    return [
        {
            type: 'custom',
            name: 'useTheme',
            label: 'useTheme',
            component: (_field, data, onDataChange) => <UseThemeButton entries={entries} data={data} onDataChange={onDataChange} />,
        },
        {
            name: '__mdwThemeDark',
            type: 'id',
            default: 'vis2-materialdesign.0.colors.darkTheme',
            hidden: () => true,
        },
        ...entries.flatMap(({ type, entry }, index) => {
            const name = `__mdwTheme_${type}_${encodeThemeId(entry.id)}_${index}`;
            return type === 'colors'
                ? [{ name, type: 'id' as const, default: themeStateId(type, entry.id), hidden: () => true }, { name: `${name}_dark`, type: 'id' as const, default: themeStateId(type, entry.id, true), hidden: () => true }]
                : [{ name, type: 'id' as const, default: themeStateId(type, entry.id), hidden: () => true }];
        }),
    ];
}

export const DEFAULT_DARK_THEME_OID = 'vis2-materialdesign.0.colors.darkTheme';

// visAttrs defaults are schema-only: VIS2 subscribes from keys present in SAVED data, and the
// hidden-only `theme` group never gets written, so this default has to be applied by our reader.
export function darkThemeOid(data: Record<string, unknown> | null | undefined): string {
    return stringValue(data?.__mdwThemeDark, DEFAULT_DARK_THEME_OID);
}

export function applyThemeVariables(data: Record<string, unknown>, values: Record<string, ioBroker.StateValue> | undefined): void {
    // No document during the vis-2 server-side prerender, and the widget data may be null.
    if (typeof document === 'undefined' || !data || !values) return;
    const dark = darkThemeOid(data);
    const isDark = values[`${dark}.val`] === true || values[`${dark}.val`] === 'true';
    Object.keys(data).filter(key => key.startsWith('__mdwTheme_') && !key.endsWith('_dark')).forEach(key => {
        const stateId = data[isDark && data[`${key}_dark`] ? `${key}_dark` : key];
        const value = typeof stateId === 'string' ? values[`${stateId}.val`] : undefined;
        const parts = key.match(/^__mdwTheme_(colors|fonts|fontSizes)_(.+)_\d+$/);
        if (!parts) return;
        const variable = cssVariable(parts[1] as ThemeType, decodeThemeId(parts[2]));
        // Font sizes carry no unit in the theme state; without 'px' a var() resolves to a unitless number and is ignored.
        if (value !== undefined && value !== null) document.documentElement.style.setProperty(variable, parts[1] === 'fontSizes' ? `${value}px` : String(value));
    });
}

export const M3_SCHEME_OID = 'vis2-materialdesign.0.colors.md3Scheme';

// Kept in sync by hand with `M3_ROLES` in src-admin/src/m3scheme.ts; `m3scheme.test.ts` asserts they agree.
export const M3_TOKEN_ROLES = ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'secondary', 'secondary-container', 'on-secondary-container',
    'tertiary', 'error', 'surface', 'surface-container-low', 'surface-container', 'surface-container-high', 'on-surface', 'on-surface-variant',
    'outline', 'outline-variant', 'scrim'] as const;

export const M3_FONT_OID = 'vis2-materialdesign.0.fonts.md3Font';

export function m3SeedOids(): string[] {
    return [M3_SCHEME_OID, M3_FONT_OID];
}

export function parseColor(color: string): [number, number, number] | undefined {
    const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (hex) {
        const full = hex.length === 3 ? hex.replace(/./g, char => char + char) : hex;
        return [0, 2, 4].map(index => parseInt(full.substr(index, 2), 16)) as [number, number, number];
    }
    const rgb = color.trim().match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined;
}

export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
    const luminance = (rgb: [number, number, number]): number => {
        const [r, g, blue] = rgb.map(part => { const value = part / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * blue;
    };
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
}

// For an arbitrary user-picked colour (calendar event, chart data label), which no palette pairs.
const ON_LIGHT = '#ffffff';
const ON_DARK = '#1d1b20'; // = --md-sys-color-on-surface, M3's darkest baseline on-color

export function m3OnColor(color: string): string | undefined {
    const rgb = parseColor(color);
    if (!rgb) return undefined; // named colors / gradients: leave the caller's fallback alone rather than guess
    return contrastRatio(rgb, parseColor(ON_LIGHT)!) >= contrastRatio(rgb, parseColor(ON_DARK)!) ? ON_LIGHT : ON_DARK;
}

// A role name is written into a CSS custom property name and the JSON comes from a writable state.
const ROLE_NAME = /^[a-z][a-z-]*$/;
const HEX_COLOR = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;

/** One `{ light, dark }` pair of role→color maps, or `undefined` if the state does not hold one. */
export function parseM3Scheme(raw: ioBroker.StateValue | undefined): { light: Record<string, string>; dark: Record<string, string> } | undefined {
    if (typeof raw !== 'string' || !raw) return undefined;
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return undefined; }
    if (!parsed || typeof parsed !== 'object') return undefined;
    const side = (value: unknown): Record<string, string> => value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([role, color]) => ROLE_NAME.test(role) && typeof color === 'string' && HEX_COLOR.test(color)) as [string, string][])
        : {};
    return { light: side((parsed as Record<string, unknown>).light), dark: side((parsed as Record<string, unknown>).dark) };
}

// Deliberately not the `--md-sys-*` tokens: those are declared ON the widget root, where an
// element-level declaration beats anything inherited from `html`.
export function applyM3SeedVariables(values: Record<string, ioBroker.StateValue | undefined> | undefined): void {
    if (typeof document === 'undefined' || !values) return;
    const set = (variable: string, value: string | undefined): void => {
        if (value) document.documentElement.style.setProperty(variable, value);
        else document.documentElement.style.removeProperty(variable);
    };
    const scheme = parseM3Scheme(values[`${M3_SCHEME_OID}.val`]);
    // Both blocks are rewritten together; a partial scheme leaves dark on the baseline while light follows the seed.
    M3_TOKEN_ROLES.forEach(role => {
        set(`--mdw-seed-${role}`, scheme?.light[role]);
        set(`--mdw-seed-${role}-dark`, scheme?.dark[role]);
    });
    const font = values[`${M3_FONT_OID}.val`];
    set('--mdw-seed-font', typeof font === 'string' && font ? font : undefined);
}

const BaseVisWidget: typeof VisRxWidget<BaseRxData, WidgetState> = window.visRxWidget;

export class VisWidget extends BaseVisWidget {
    // VIS2's own subscription discovery only looks at keys present in saved data (see darkThemeOid).
    private darkThemeSubscribedOid?: string;
    private darkThemeValue = false;

    private m3SeedSubscribed = false;
    private m3SeedValues: Record<string, ioBroker.StateValue | undefined> = {};

    private resolvedStyle: DesignStyle = 'legacy';
    private projectStyleSubscribed = false;

    private subscribeM3Seeds(): void {
        this.m3SeedSubscribed = true;
        m3SeedOids().forEach(seedOid => {
            this.props.context.socket.subscribeState(seedOid, this.onM3SeedChanged).catch((e: unknown) => console.error(`Cannot subscribe on ${seedOid}: ${String(e)}`));
        });
    }

    private onProjectDesignStyleChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        // Every mounted widget gets this callback, so the module-level value is set unconditionally.
        setProjectDesignStyle(state?.val);
        const resolved = designStyle(this.state?.rxData as unknown as Record<string, unknown> | undefined);
        if (resolved === this.resolvedStyle) return;
        this.resolvedStyle = resolved;
        if (resolved === 'material3' && !this.m3SeedSubscribed) this.subscribeM3Seeds();
        this.forceUpdate();
    };

    private onDarkThemeChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const next = state?.val === true || state?.val === 'true';
        if (next !== this.darkThemeValue) {
            this.darkThemeValue = next;
            this.forceUpdate();
        }
    };

    private onM3SeedChanged = (id: string, state: ioBroker.State | null | undefined): void => {
        const key = `${id}.val`;
        if (this.m3SeedValues[key] !== state?.val) {
            this.m3SeedValues = { ...this.m3SeedValues, [key]: state?.val };
            this.forceUpdate();
        }
    };

    componentDidMount(): void {
        super.componentDidMount();
        const rxData = this.state?.rxData as unknown as Record<string, unknown> | undefined;
        const oid = darkThemeOid(rxData);
        if (oid) {
            this.darkThemeSubscribedOid = oid;
            this.props.context.socket.subscribeState(oid, this.onDarkThemeChanged).catch((e: unknown) => console.error(`Cannot subscribe on ${oid}: ${String(e)}`));
        }
        this.projectStyleSubscribed = true;
        this.props.context.socket.subscribeState(DEFAULT_DESIGN_STYLE_OID, this.onProjectDesignStyleChanged).catch((e: unknown) => console.error(`Cannot subscribe on ${DEFAULT_DESIGN_STYLE_OID}: ${String(e)}`));
        this.resolvedStyle = designStyle(rxData);
        if (this.resolvedStyle === 'material3') {
            this.subscribeM3Seeds();
        }
    }

    componentWillUnmount(): void {
        // A widget can be unmounted without ever having reached componentDidMount.
        if (this.projectStyleSubscribed) {
            this.props.context.socket.unsubscribeState(DEFAULT_DESIGN_STYLE_OID, this.onProjectDesignStyleChanged);
        }
        if (this.darkThemeSubscribedOid) {
            this.props.context.socket.unsubscribeState(this.darkThemeSubscribedOid, this.onDarkThemeChanged);
        }
        if (this.m3SeedSubscribed) {
            m3SeedOids().forEach(seedOid => this.props.context.socket.unsubscribeState(seedOid, this.onM3SeedChanged));
        }
        super.componentWillUnmount?.();
    }

    protected isDarkTheme(): boolean {
        return this.darkThemeValue;
    }

    render(): React.JSX.Element | null {
        const rxData = { ...this.state.rxData };
        applyThemeVariables(rxData, { ...this.state.values, [`${darkThemeOid(rxData)}.val`]: this.darkThemeValue });
        if (this.m3SeedSubscribed && designStyle(rxData) === 'material3') applyM3SeedVariables(this.m3SeedValues);
        return super.render();
    }
}

export type RenderProps = RxRenderWidgetProps;
