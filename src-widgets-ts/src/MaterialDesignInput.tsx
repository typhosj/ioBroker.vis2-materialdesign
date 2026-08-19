import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { m3ColorExplicit, renderIcon } from './MaterialDesignButtons';
import { cleanColor, num } from './MaterialDesignProgress';
import { squarePreview, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, iconField, setStateValue, sizeCss, stateValue } from './widgetUtils';

interface InputData {
    oid?: string;
    inputType?: 'text' | 'number' | 'date' | 'time' | 'mask';
    inputMask?: string;
    inputMaxLength?: number;
    inputLayout?: string;
    inputAlignment?: 'left' | 'center' | 'right';
    inputLayoutBackgroundColor?: string;
    inputLayoutBackgroundColorHover?: string;
    inputLayoutBackgroundColorSelected?: string;
    inputLayoutBorderColor?: string;
    inputLayoutBorderColorHover?: string;
    inputLayoutBorderColorSelected?: string;
    inputTextFontFamily?: string;
    inputTextFontSize?: number;
    inputTextColor?: string;
    autoFocus?: boolean;
    inputLabelText?: string;
    inputLabelColor?: string;
    inputLabelColorSelected?: string;
    inputLabelFontFamily?: string;
    inputLabelFontSize?: number;
    inputTranslateX?: number;
    inputTranslateY?: number;
    inputPrefix?: string;
    inputSuffix?: string;
    inputAppendixColor?: string;
    inputAppendixFontSize?: number;
    inputAppendixFontFamily?: string;
    showInputMessageAlways?: boolean;
    inputMessage?: string;
    inputMessageFontFamily?: string;
    inputMessageFontSize?: number;
    inputMessageColor?: string;
    showInputCounter?: boolean;
    inputCounterColor?: string;
    inputCounterFontSize?: number;
    inputCounterFontFamily?: string;
    clearIconShow?: boolean;
    clearIcon?: string;
    clearIconSize?: number;
    clearIconColor?: string;
    prepandIcon?: string;
    prepandIconSize?: number;
    prepandIconColor?: string;
    prepandInnerIcon?: string;
    prepandInnerIconSize?: number;
    prepandInnerIconColor?: string;
    appendIcon?: string;
    appendIconSize?: number;
    appendIconColor?: string;
    appendOuterIcon?: string;
    appendOuterIconSize?: number;
    appendOuterIconColor?: string;
}

const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            {
                name: 'inputType',
                label: 'inputType',
                type: 'select',
                options: ['text', 'number', 'date', 'time', 'mask'],
                default: 'text',
            },
            { name: 'inputMask', label: 'inputMask', type: 'text' },
            { name: 'inputMaxLength', label: 'inputMaxLength', type: 'number' },
        ],
    },
    {
        name: 'inputLayout',
        label: 'group_inputLayout',
        fields: [
            {
                name: 'inputLayout',
                label: 'inputLayout',
                type: 'select',
                options: [
                    'regular',
                    'solo',
                    'solo-rounded',
                    'solo-shaped',
                    'filled',
                    'filled-rounded',
                    'filled-shaped',
                    'outlined',
                    'outlined-rounded',
                    'outlined-shaped',
                ],
                default: 'regular',
            },
            {
                name: 'inputAlignment',
                label: 'inputAlignment',
                type: 'select',
                options: ['left', 'center', 'right'],
                default: 'left',
            },
            { name: 'inputLayoutBackgroundColor', label: 'inputLayoutBackgroundColor', type: 'color' },
            { name: 'inputLayoutBackgroundColorHover', label: 'inputLayoutBackgroundColorHover', type: 'color' },
            { name: 'inputLayoutBackgroundColorSelected', label: 'inputLayoutBackgroundColorSelected', type: 'color' },
            {
                name: 'inputLayoutBorderColor',
                label: 'inputLayoutBorderColor',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.border',
            },
            {
                name: 'inputLayoutBorderColorHover',
                label: 'inputLayoutBorderColorHover',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.border_hover',
            },
            {
                name: 'inputLayoutBorderColorSelected',
                label: 'inputLayoutBorderColorSelected',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.border_selected',
            },
            { name: 'inputTextFontFamily', label: 'inputTextFontFamily', type: 'fontname' },
            { name: 'inputTextFontSize', label: 'inputTextFontSize', type: 'number', default: 16 },
            { name: 'inputTextColor', label: 'inputTextColor', type: 'color', default: '#000000' },
            { name: 'autoFocus', label: 'autoFocus', type: 'checkbox' },
        ],
    },
    {
        name: 'inputLabel',
        label: 'group_inputLabel',
        fields: [
            { name: 'inputLabelText', label: 'inputLabelText', type: 'text' },
            {
                name: 'inputLabelColor',
                label: 'inputLabelColor',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.label',
            },
            {
                name: 'inputLabelColorSelected',
                label: 'inputLabelColorSelected',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.label_selected',
            },
            { name: 'inputLabelFontFamily', label: 'inputLabelFontFamily', type: 'fontname' },
            {
                name: 'inputLabelFontSize',
                label: 'inputLabelFontSize',
                type: 'slider',
                min: 0,
                max: 24,
                step: 1,
                default: 16,
            },
            { name: 'inputTranslateX', label: 'inputTranslateX', type: 'number' },
            { name: 'inputTranslateY', label: 'inputTranslateY', type: 'number' },
        ],
    },
    {
        name: 'inputAppendix',
        label: 'group_inputAppendix',
        fields: [
            { name: 'inputPrefix', label: 'inputPrefix', type: 'text' },
            { name: 'inputSuffix', label: 'inputSuffix', type: 'text' },
            {
                name: 'inputAppendixColor',
                label: 'inputAppendixColor',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.appendix',
            },
            { name: 'inputAppendixFontSize', label: 'inputAppendixFontSize', type: 'number', default: 14 },
            { name: 'inputAppendixFontFamily', label: 'inputAppendixFontFamily', type: 'fontname' },
        ],
    },
    {
        name: 'inputSubText',
        label: 'group_inputSubText',
        fields: [
            { name: 'showInputMessageAlways', label: 'showInputMessageAlways', type: 'checkbox', default: true },
            { name: 'inputMessage', label: 'inputMessage', type: 'text' },
            { name: 'inputMessageFontFamily', label: 'inputMessageFontFamily', type: 'fontname' },
            { name: 'inputMessageFontSize', label: 'inputMessageFontSize', type: 'number', default: 14 },
            {
                name: 'inputMessageColor',
                label: 'inputMessageColor',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.message',
            },
        ],
    },
    {
        name: 'counter',
        label: 'group_counter',
        fields: [
            { name: 'showInputCounter', label: 'showInputCounter', type: 'checkbox', default: true },
            {
                name: 'inputCounterColor',
                label: 'inputCounterColor',
                type: 'color',
                default: '#mdwTheme:vis-materialdesign.0.colors.input.counter',
            },
            { name: 'inputCounterFontSize', label: 'inputCounterFontSize', type: 'number', default: 14 },
            { name: 'inputCounterFontFamily', label: 'inputCounterFontFamily', type: 'fontname' },
        ],
    },
    {
        name: 'icons',
        label: 'group_icons',
        fields: [
            { name: 'clearIconShow', label: 'clearIconShow', type: 'checkbox', default: true },
            iconField('clearIcon', 'clearIcon', 'close'),
            { name: 'clearIconSize', label: 'clearIconSize', type: 'number' },
            { name: 'clearIconColor', label: 'clearIconColor', type: 'color' },
            iconField('prepandIcon', 'prepandIcon'),
            { name: 'prepandIconSize', label: 'prepandIconSize', type: 'number' },
            { name: 'prepandIconColor', label: 'prepandIconColor', type: 'color' },
            iconField('prepandInnerIcon', 'prepandInnerIcon'),
            { name: 'prepandInnerIconSize', label: 'prepandInnerIconSize', type: 'number' },
            { name: 'prepandInnerIconColor', label: 'prepandInnerIconColor', type: 'color' },
            iconField('appendIcon', 'appendIcon'),
            { name: 'appendIconSize', label: 'appendIconSize', type: 'number' },
            { name: 'appendIconColor', label: 'appendIconColor', type: 'color' },
            iconField('appendOuterIcon', 'appendOuterIcon'),
            { name: 'appendOuterIconSize', label: 'appendOuterIconSize', type: 'number' },
            { name: 'appendOuterIconColor', label: 'appendOuterIconColor', type: 'color' },
        ],
    },
];

function layoutClass(layoutValue: string | undefined): string {
    const layout = layoutValue || 'regular';
    const base = layout.includes('outlined')
        ? 'v-text-field--outlined'
        : layout.includes('filled')
          ? 'v-text-field--filled'
          : layout.includes('solo')
            ? 'v-text-field--solo'
            : '';
    return [
        base,
        layout.includes('rounded') ? 'v-text-field--rounded' : '',
        layout.includes('shaped') ? 'v-text-field--shaped' : '',
    ]
        .filter(Boolean)
        .join(' ');
}

function inputType(data: InputData): string {
    return data.inputType === 'mask' ? 'text' : data.inputType || 'text';
}

// VueTheMask-style tokens; any other mask char is a literal separator.
const MASK_TOKENS: Record<string, { pattern: RegExp; transform?: (c: string) => string }> = {
    '#': { pattern: /\d/ },
    S: { pattern: /[a-zA-Z]/ },
    A: { pattern: /[a-zA-Z]/, transform: c => c.toUpperCase() },
    a: { pattern: /[a-zA-Z]/, transform: c => c.toLowerCase() },
    N: { pattern: /[0-9a-zA-Z]/ },
    X: { pattern: /./ },
};

function maskPattern(data: InputData): string {
    if (data.inputType !== 'mask' || !data.inputMask) {
        return '';
    }
    return data.inputMask.replace(/^\[/, '').replace(/\]$/, '').replace(/'/g, '').split(',')[0].trim();
}

export function applyMask(raw: string, mask: string): string {
    if (!mask) {
        return raw;
    }
    let out = '';
    let pending = ''; // buffered literals, flushed only before the next real token char (no trailing separator)
    let ri = 0;
    for (let mi = 0; mi < mask.length && ri < raw.length; mi++) {
        const token = MASK_TOKENS[mask[mi]];
        if (token) {
            while (ri < raw.length && !token.pattern.test(raw[ri])) {
                ri++;
            }
            if (ri >= raw.length) {
                break;
            }
            out += pending;
            pending = '';
            out += token.transform ? token.transform(raw[ri]) : raw[ri];
            ri++;
        } else {
            pending += mask[mi];
            if (raw[ri] === mask[mi]) {
                ri++;
            }
        }
    }
    return out;
}

function placeholder(data: InputData): string {
    return maskPattern(data);
}

function icon(name: string | undefined, color: string | undefined, size: number): React.JSX.Element | null {
    return name ? renderIcon(name, themeColor(color, '#44739e'), size, !!color) : null;
}

function themeColor(value: unknown, fallback: string): string {
    const raw = typeof value === 'string' ? value : '';
    if (!raw) {
        return fallback;
    }
    if (!raw.startsWith('#mdwTheme:')) {
        return raw;
    }
    const id = raw
        .slice('#mdwTheme:'.length)
        .replace('vis-materialdesign.0.colors.', '')
        .replace(/^(light|dark)\./, '')
        .replace(/[._]/g, '-');
    return `var(--materialdesign-widget-theme-color-${id}, ${fallback})`;
}

function plainColor(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.startsWith('#mdwTheme:') ? fallback : themeColor(value, fallback);
}

function fontSize(value: unknown, fallback: number): string {
    return sizeCss(value, fallback);
}

export function activeLabelTranslateY(value: unknown): number {
    return value === undefined || value === '' || Number(value) === 0 ? -16 : num(value, -16);
}

let notchCanvas: HTMLCanvasElement | null | undefined;

// A per-character heuristic wildly overestimates proportional text, so the notch width is measured
// via canvas where available.
export function outlinedNotchWidth(label: string, labelFontSize: unknown, labelFontFamily?: unknown): number {
    if (!label) {
        return 0;
    }
    const activeFontSize = Math.max(10, num(labelFontSize, 16) * 0.75);
    const family = (typeof labelFontFamily === 'string' && labelFontFamily) || 'sans-serif';
    if (typeof document !== 'undefined') {
        try {
            if (notchCanvas === undefined) {
                notchCanvas = document.createElement('canvas');
            }
            const ctx = notchCanvas ? notchCanvas.getContext('2d') : null;
            if (ctx) {
                ctx.font = `${activeFontSize}px ${family}`;
                return Math.round(ctx.measureText(label).width) + 8;
            }
        } catch {
            /* fall through to heuristic */
        }
    }
    return Math.max(Math.round(label.length * activeFontSize * 0.5 + activeFontSize * 0.7), 20);
}

export default class MaterialDesignInput extends VisWidget {
    private focused = false;
    private fieldHovered = false;
    private localValue: string | undefined;
    private seenStateValue: ioBroker.StateValue | undefined;
    private readonly rootRef = React.createRef<HTMLDivElement>();

    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.widDiv?.style.setProperty('overflow', 'visible', 'important');
        this.rootRef.current?.parentElement?.style.setProperty('overflow', 'visible', 'important');
        this.rootRef.current?.parentElement?.parentElement?.style.setProperty('overflow', 'visible', 'important');
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Input', 'Input', attrs, ['inputLayout', 'inputAppendix', 'inputSubText', 'counter', 'icons']),
            visPrev: squarePreview('F060E'),
            visDefaultStyle: { width: 150, height: 38 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignInput.getWidgetInfo();
    }

    private commit(data: InputData, value: string): void {
        if (data.inputType === 'number' && value === '') {
            this.localValue = undefined;
            this.forceUpdate();
            return;
        }
        setStateValue(this.props, data.oid || '', data.inputType === 'number' ? Number(value) : value);
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as InputData;
        const state = stateValue(this.state, data.oid || '');
        if (state !== this.seenStateValue) {
            this.seenStateValue = state;
            this.localValue = undefined;
        }
        const value = this.localValue ?? String(state ?? '');
        const active = this.focused || value !== '';
        const layout = layoutClass(data.inputLayout);
        // An explicit saved color wins (m3ColorExplicit); the legacy `#000000` default and `#mdwTheme:`
        // tokens count as unset so the M3 token applies, which dark mode needs.
        const isM3 = designStyle(data as Record<string, unknown>) === 'material3';
        const textDefault =
            data.inputTextColor === undefined ||
            data.inputTextColor === '' ||
            data.inputTextColor === '#000000' ||
            (typeof data.inputTextColor === 'string' && data.inputTextColor.startsWith('#mdwTheme:'));
        const inactiveBorderColor =
            isM3 && !m3ColorExplicit(data.inputLayoutBorderColor)
                ? 'var(--md-sys-color-outline)'
                : plainColor(
                      data.inputLayoutBorderColor,
                      layout.includes('outlined') ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.54)',
                  );
        const activeBorderColor =
            isM3 && !m3ColorExplicit(data.inputLayoutBorderColorSelected)
                ? 'var(--md-sys-color-primary)'
                : themeColor(data.inputLayoutBorderColorSelected, '#44739e');
        const borderColor = this.focused ? activeBorderColor : inactiveBorderColor;
        const m3FilledBg = layout.includes('filled') ? 'var(--md-sys-color-surface-container-high)' : 'transparent';
        // Resting -> hover -> focused. The hover stage only applies when a color was set for it.
        const bg = this.focused
            ? isM3 && !m3ColorExplicit(data.inputLayoutBackgroundColorSelected)
                ? m3FilledBg
                : cleanColor(data.inputLayoutBackgroundColorSelected, 'transparent')
            : this.fieldHovered && m3ColorExplicit(data.inputLayoutBackgroundColorHover)
              ? cleanColor(data.inputLayoutBackgroundColorHover, 'transparent')
              : isM3 && !m3ColorExplicit(data.inputLayoutBackgroundColor)
                ? m3FilledBg
                : cleanColor(data.inputLayoutBackgroundColor, 'transparent');
        const labelColor = this.focused
            ? isM3 && !m3ColorExplicit(data.inputLabelColorSelected)
                ? 'var(--md-sys-color-primary)'
                : themeColor(data.inputLabelColorSelected, '#44739e')
            : isM3 && !m3ColorExplicit(data.inputLabelColor)
              ? 'var(--md-sys-color-on-surface-variant)'
              : themeColor(data.inputLabelColor, 'rgba(0, 0, 0, 0.54)');
        const textColor =
            isM3 && textDefault
                ? 'var(--md-sys-color-on-surface)'
                : typeof data.inputTextColor === 'string' && data.inputTextColor.startsWith('#mdwTheme:')
                  ? '#000000'
                  : themeColor(data.inputTextColor, '#000000');
        const appendixColor =
            isM3 && !m3ColorExplicit(data.inputAppendixColor)
                ? 'var(--md-sys-color-on-surface-variant)'
                : themeColor(data.inputAppendixColor, 'rgba(0, 0, 0, 0.6)');
        const enclosed = layout.includes('outlined') || layout.includes('solo');
        const filled = layout.includes('filled');
        // `showInputMessageAlways` follows Vuetify's persistent-hint: off, the hint only shows while
        // the field is focused.
        const showMessage = !!data.inputMessage && (data.showInputMessageAlways !== false || this.focused);
        const hasDetails = showMessage || !!data.showInputCounter;
        const slotMinHeight = enclosed || filled ? 40 : 32;
        const labelTranslateY = activeLabelTranslateY(data.inputTranslateY);
        // A prepend-inner icon shifts the text slot right; the floating label has to be shifted back by
        // the icon column width so it sits in the notch at the field's front.
        const innerIconShift = icon(
            data.prepandInnerIcon,
            data.prepandInnerIconColor,
            num(data.prepandInnerIconSize, 16),
        )
            ? 10 + num(data.prepandInnerIconSize, 16)
            : 0;

        return (
            <div
                className={`materialdesign-widget materialdesign-input${isM3 ? ` ${designStyleClasses(data as Record<string, unknown>, this.isDarkTheme())}` : ''}`}
                ref={this.rootRef}
                style={{ alignItems: 'center', display: 'flex', height: '100%', overflow: 'visible', width: '100%' }}
            >
                <div
                    className="materialdesign-vuetify-textField"
                    style={{ height: '100%', width: '100%' }}
                >
                    <div
                        className={`v-input v-input--dense theme--light materialdesign-text-field ${layout}${this.focused ? ' v-input--is-focused' : ''}${active ? ' v-input--is-label-active v-input--is-dirty' : ''}`}
                        onMouseEnter={() => { this.fieldHovered = true; this.forceUpdate(); }}
                        onMouseLeave={() => { this.fieldHovered = false; this.forceUpdate(); }}
                        style={
                            {
                                '--vue-text-field-input-text-color': textColor,
                                '--vue-text-field-input-text-font-family': data.inputTextFontFamily || undefined,
                                '--vue-text-field-input-text-font-size': `${fontSize(data.inputTextFontSize, 16)}px`,
                                '--vue-text-field-before-color': inactiveBorderColor,
                                '--vue-text-field-hover-color': themeColor(
                                    data.inputLayoutBorderColorHover,
                                    borderColor,
                                ),
                                '--vue-text-field-after-color': activeBorderColor,
                                '--vue-text-field-label-before-color': themeColor(
                                    data.inputLabelColor,
                                    'rgba(0, 0, 0, 0.54)',
                                ),
                                '--vue-text-field-label-after-color': themeColor(
                                    data.inputLabelColorSelected,
                                    '#44739e',
                                ),
                                '--vue-text-field-label-font-family': data.inputLabelFontFamily || undefined,
                                '--vue-text-field-label-font-size': `${fontSize(data.inputLabelFontSize, 16)}px`,
                                '--vue-text-field-appendix-color': appendixColor,
                                '--vue-text-field-appendix-font-family':
                                    data.inputAppendixFontFamily || data.inputTextFontFamily || undefined,
                                '--vue-text-field-appendix-font-size': `${fontSize(data.inputAppendixFontSize ?? data.inputTextFontSize, 16)}px`,
                                boxSizing: 'border-box',
                                color: textColor,
                                display: 'flex',
                                margin: 0,
                                paddingTop: 0,
                                width: '100%',
                            } as React.CSSProperties
                        }
                    >
                        {icon(data.prepandIcon, data.prepandIconColor, num(data.prepandIconSize, 16)) ? (
                            <div className="v-input__prepend-outer">
                                {icon(data.prepandIcon, data.prepandIconColor, num(data.prepandIconSize, 16))}
                            </div>
                        ) : null}
                        <div
                            className="v-input__control"
                            style={{
                                display: 'flex',
                                flex: '1 1 auto',
                                flexDirection: 'column',
                                minHeight: 0,
                                minWidth: 0,
                                width: '100%',
                            }}
                        >
                            <div
                                className="v-input__slot"
                                style={{
                                    alignItems: 'stretch',
                                    background: bg,
                                    borderBottom: enclosed
                                        ? undefined
                                        : `${this.focused ? 2 : 1}px solid ${this.focused ? activeBorderColor : inactiveBorderColor}`,
                                    borderRadius: layout.includes('rounded') ? 28 : enclosed ? 4 : undefined,
                                    boxSizing: 'border-box',
                                    cursor: 'text',
                                    display: 'flex',
                                    flex: '0 0 auto',
                                    overflow: 'visible',
                                    minHeight: slotMinHeight,
                                    position: 'relative',
                                    width: '100%',
                                }}
                            >
                                {layout.includes('outlined') ? (
                                    <fieldset
                                        aria-hidden="true"
                                        style={{
                                            // Inside the flex `v-input__slot` an in-flow fieldset collapses to the legend width, so it is
                                            // positioned absolutely to span the slot.
                                            backgroundColor: 'transparent',
                                            borderColor,
                                            borderRadius: layout.includes('rounded') ? 28 : 4,
                                            borderStyle: 'solid',
                                            borderWidth: this.focused ? 2 : 1,
                                            bottom: 0,
                                            left: 0,
                                            margin: 0,
                                            padding: '0 8px',
                                            pointerEvents: 'none',
                                            position: 'absolute',
                                            right: 0,
                                            top: -5,
                                        }}
                                    >
                                        <legend
                                            style={{
                                                height: 11,
                                                lineHeight: '11px',
                                                width: active
                                                    ? outlinedNotchWidth(
                                                          data.inputLabelText || '',
                                                          data.inputLabelFontSize,
                                                          data.inputLabelFontFamily,
                                                      )
                                                    : 0,
                                            }}
                                        />
                                    </fieldset>
                                ) : null}
                                {icon(
                                    data.prepandInnerIcon,
                                    data.prepandInnerIconColor,
                                    num(data.prepandInnerIconSize, 16),
                                ) ? (
                                    <div
                                        className="v-input__prepend-inner"
                                        style={{
                                            // Ambient legacy CSS used to center the inner icon in the flex slot.
                                            alignItems: 'center',
                                            alignSelf: 'center',
                                            display: 'flex',
                                            paddingLeft: 10,
                                        }}
                                    >
                                        {icon(
                                            data.prepandInnerIcon,
                                            data.prepandInnerIconColor,
                                            num(data.prepandInnerIconSize, 16),
                                        )}
                                    </div>
                                ) : null}
                                <div
                                    className="v-text-field__slot"
                                    style={{
                                        alignItems: 'center',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flex: '1 1 auto',
                                        minHeight: slotMinHeight,
                                        minWidth: 0,
                                        padding: '0 10px',
                                        position: 'relative',
                                        width: '100%',
                                    }}
                                >
                                    {data.inputPrefix ? (
                                        <div
                                            className="v-text-field__prefix"
                                            style={{
                                                alignItems: 'center',
                                                display: 'flex',
                                                flex: '0 0 auto',
                                                lineHeight: '20px',
                                            }}
                                        >
                                            {data.inputPrefix}
                                        </div>
                                    ) : null}
                                    {data.inputLabelText ? (
                                        <label
                                            className={`v-label${active ? ' v-label--active' : ''}`}
                                            style={{
                                                color: labelColor,
                                                fontFamily: data.inputLabelFontFamily || undefined,
                                                fontSize: fontSize(data.inputLabelFontSize, 16),
                                                left: 12,
                                                lineHeight: '20px',
                                                maxWidth: '90%',
                                                overflow: 'hidden',
                                                paddingLeft: 0,
                                                position: 'absolute',
                                                top: filled ? 17 : 8,
                                                transform: active
                                                    ? `translateX(${num(data.inputTranslateX, 0) - innerIconShift}px) translateY(${labelTranslateY}px) scale(0.75)`
                                                    : undefined,
                                                transformOrigin: 'top left',
                                                whiteSpace: 'nowrap',
                                                zIndex: 2,
                                            }}
                                        >
                                            {data.inputLabelText}
                                        </label>
                                    ) : null}
                                    <input
                                        autoFocus={!!data.autoFocus}
                                        maxLength={data.inputMaxLength ? num(data.inputMaxLength, 0) : undefined}
                                        onBlur={event => {
                                            this.focused = false;
                                            this.commit(data, event.target.value);
                                            this.forceUpdate();
                                        }}
                                        onChange={event => {
                                            this.localValue =
                                                data.inputType === 'mask'
                                                    ? applyMask(event.target.value, maskPattern(data))
                                                    : event.target.value;
                                            // Native date/time pickers (esp. Android) fire only `change`, often without a blur — commit
                                            // immediately. Text/number/mask commit on blur/Enter to avoid per-keystroke writes.
                                            if (data.inputType === 'date' || data.inputType === 'time') {
                                                this.commit(data, event.target.value);
                                            }
                                            this.forceUpdate();
                                        }}
                                        onFocus={() => {
                                            this.focused = true;
                                            this.forceUpdate();
                                        }}
                                        onKeyDown={event => {
                                            if (event.key === 'Enter') {
                                                this.commit(data, event.currentTarget.value);
                                            }
                                        }}
                                        placeholder={placeholder(data)}
                                        style={{
                                            // Reset the native input chrome; the old widget relied on ambient legacy Vuetify CSS.
                                            appearance: 'none',
                                            background: 'transparent',
                                            border: 0,
                                            borderRadius: 0,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            color: textColor,
                                            fontFamily: data.inputTextFontFamily || undefined,
                                            fontSize: fontSize(data.inputTextFontSize, 16),
                                            flex: '1 1 auto',
                                            height: enclosed ? 20 : undefined,
                                            lineHeight: '20px',
                                            // Push the text down so the floating label does not overlap the value.
                                            marginTop: !enclosed && data.inputLabelText ? 14 : undefined,
                                            maxWidth: '100%',
                                            minWidth: 0,
                                            padding: enclosed ? 0 : '4px 0 8px 0',
                                            position: 'relative',
                                            textAlign: data.inputAlignment || 'left',
                                            width: '100%',
                                            zIndex: 1,
                                        }}
                                        type={inputType(data)}
                                        value={value}
                                    />
                                    {data.inputSuffix ? (
                                        <div
                                            className="v-text-field__suffix"
                                            style={{
                                                alignItems: 'center',
                                                display: 'flex',
                                                flex: '0 0 auto',
                                                lineHeight: '20px',
                                            }}
                                        >
                                            {data.inputSuffix}
                                        </div>
                                    ) : null}
                                    {data.clearIconShow !== false && value !== '' ? (
                                        <button
                                            aria-label="clear"
                                            onClick={() => {
                                                this.localValue = '';
                                                setStateValue(this.props, data.oid || '', '');
                                                this.forceUpdate();
                                            }}
                                            style={{
                                                alignItems: 'center',
                                                background: 'transparent',
                                                border: 0,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flex: '0 0 auto',
                                                height: 24,
                                                justifyContent: 'center',
                                                marginLeft: 4,
                                                padding: 0,
                                                position: 'relative',
                                                width: 24,
                                                zIndex: 10,
                                            }}
                                            type="button"
                                        >
                                            {renderIcon(
                                                data.clearIcon || 'close',
                                                isM3 && !m3ColorExplicit(data.clearIconColor)
                                                    ? 'var(--md-sys-color-on-surface-variant)'
                                                    : plainColor(data.clearIconColor, '#44739e'),
                                                num(data.clearIconSize, 16),
                                                !!data.clearIconColor,
                                            )}
                                        </button>
                                    ) : null}
                                </div>
                                {icon(data.appendIcon, data.appendIconColor, num(data.appendIconSize, 16)) ? (
                                    <div className="v-input__append-inner">
                                        {icon(data.appendIcon, data.appendIconColor, num(data.appendIconSize, 16))}
                                    </div>
                                ) : null}
                            </div>
                            {hasDetails ? (
                                <div
                                    className="v-text-field__details"
                                    style={{
                                        alignItems: 'center',
                                        display: 'flex',
                                        flex: '0 0 auto',
                                        justifyContent: 'flex-end',
                                        maxWidth: '100%',
                                        minHeight: 14,
                                        overflow: 'visible',
                                        padding: '0 10px',
                                    }}
                                >
                                    {showMessage ? (
                                        <div
                                            style={{
                                                color:
                                                    isM3 && !m3ColorExplicit(data.inputMessageColor)
                                                        ? 'var(--md-sys-color-on-surface-variant)'
                                                        : themeColor(data.inputMessageColor, 'rgba(0, 0, 0, 0.54)'),
                                                flex: 1,
                                                fontFamily: data.inputMessageFontFamily || undefined,
                                                fontSize: fontSize(data.inputMessageFontSize, 14),
                                            }}
                                        >
                                            {data.inputMessage}
                                        </div>
                                    ) : null}
                                    {data.showInputCounter ? (
                                        <div
                                            className="v-counter"
                                            style={{
                                                color:
                                                    isM3 && !m3ColorExplicit(data.inputCounterColor)
                                                        ? 'var(--md-sys-color-on-surface-variant)'
                                                        : plainColor(data.inputCounterColor, 'rgba(0, 0, 0, 0.54)'),
                                                flex: '0 1 auto',
                                                fontFamily: data.inputCounterFontFamily || undefined,
                                                fontSize: fontSize(data.inputCounterFontSize, 14),
                                                lineHeight: 1,
                                                marginLeft: 8,
                                                marginTop: 5,
                                                minHeight: 12,
                                                position: 'relative',
                                                whiteSpace: 'nowrap',
                                                zIndex: 5,
                                            }}
                                        >
                                            {value.length}
                                            {data.inputMaxLength ? ` / ${num(data.inputMaxLength, 0)}` : ''}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                        {icon(data.appendOuterIcon, data.appendOuterIconColor, num(data.appendOuterIconSize, 16)) ? (
                            <div className="v-input__append-outer">
                                {icon(
                                    data.appendOuterIcon,
                                    data.appendOuterIconColor,
                                    num(data.appendOuterIconSize, 16),
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}
