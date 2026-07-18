import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { cleanColor, num } from './MaterialDesignProgress';
import { RenderProps, VisWidget, createInfo, setStateValue, sizeCss, stateValue } from './widgetUtils';

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
    generateHtmlControl?: boolean;
    debug?: boolean;
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
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
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
            { name: 'clearIcon', label: 'clearIcon', type: 'icon', default: 'close' },
            { name: 'clearIconSize', label: 'clearIconSize', type: 'number' },
            { name: 'clearIconColor', label: 'clearIconColor', type: 'color' },
            { name: 'prepandIcon', label: 'prepandIcon', type: 'icon' },
            { name: 'prepandIconSize', label: 'prepandIconSize', type: 'number' },
            { name: 'prepandIconColor', label: 'prepandIconColor', type: 'color' },
            { name: 'prepandInnerIcon', label: 'prepandInnerIcon', type: 'icon' },
            { name: 'prepandInnerIconSize', label: 'prepandInnerIconSize', type: 'number' },
            { name: 'prepandInnerIconColor', label: 'prepandInnerIconColor', type: 'color' },
            { name: 'appendIcon', label: 'appendIcon', type: 'icon' },
            { name: 'appendIconSize', label: 'appendIconSize', type: 'number' },
            { name: 'appendIconColor', label: 'appendIconColor', type: 'color' },
            { name: 'appendOuterIcon', label: 'appendOuterIcon', type: 'icon' },
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

// VueTheMask-style tokens (VIS1 used vue-the-mask); any other mask char is a literal separator.
const MASK_TOKENS: Record<string, { pattern: RegExp; transform?: (c: string) => string }> = {
    '#': { pattern: /\d/ },
    S: { pattern: /[a-zA-Z]/ },
    A: { pattern: /[a-zA-Z]/, transform: c => c.toUpperCase() },
    a: { pattern: /[a-zA-Z]/, transform: c => c.toLowerCase() },
    N: { pattern: /[0-9a-zA-Z]/ },
    X: { pattern: /./ },
};

// Effective mask string: strip the stored `['…']` array syntax, take the first mask.
function maskPattern(data: InputData): string {
    if (data.inputType !== 'mask' || !data.inputMask) {
        return '';
    }
    return data.inputMask.replace(/^\[/, '').replace(/\]$/, '').replace(/'/g, '').split(',')[0].trim();
}

// Enforce the mask on raw input: keep only chars matching each token position, auto-insert literals.
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

export function outlinedNotchWidth(label: string, labelFontSize: unknown): number {
    if (!label) {
        return 0;
    }
    const activeFontSize = Math.max(10, num(labelFontSize, 16) * 0.75);
    return Math.max(label.length * activeFontSize * 0.62 + 8, 20);
}

export default class MaterialDesignInput extends VisWidget {
    private focused = false;
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
            ...createInfo('tplVis2-materialdesign-Input', 'Input', attrs),
            visPrev: '<img src="widgets/vis2-materialdesign/img/prev_input.png"></img>',
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
        const state = stateValue(this.state as VisRxWidgetState, data.oid || '');
        if (state !== this.seenStateValue) {
            this.seenStateValue = state;
            this.localValue = undefined;
        }
        const value = this.localValue ?? String(state ?? '');
        const active = this.focused || value !== '';
        const layout = layoutClass(data.inputLayout);
        const inactiveBorderColor = plainColor(
            data.inputLayoutBorderColor,
            layout.includes('outlined') ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.54)',
        );
        const activeBorderColor = themeColor(data.inputLayoutBorderColorSelected, '#44739e');
        const borderColor = this.focused ? activeBorderColor : inactiveBorderColor;
        const bg = this.focused
            ? cleanColor(data.inputLayoutBackgroundColorSelected, 'transparent')
            : cleanColor(data.inputLayoutBackgroundColor, 'transparent');
        const labelColor = this.focused
            ? themeColor(data.inputLabelColorSelected, '#44739e')
            : themeColor(data.inputLabelColor, 'rgba(0, 0, 0, 0.54)');
        const textColor =
            typeof data.inputTextColor === 'string' && data.inputTextColor.startsWith('#mdwTheme:')
                ? '#000000'
                : themeColor(data.inputTextColor, '#000000');
        const appendixColor = themeColor(data.inputAppendixColor, 'rgba(0, 0, 0, 0.6)');
        const enclosed = layout.includes('outlined') || layout.includes('solo');
        const filled = layout.includes('filled');
        const hasDetails = !!data.inputMessage || !!data.showInputCounter;
        const slotMinHeight = enclosed || filled ? 40 : 32;
        const labelTranslateY = activeLabelTranslateY(data.inputTranslateY);

        return (
            <div
                className="materialdesign-widget materialdesign-input"
                ref={this.rootRef}
                style={{ alignItems: 'center', display: 'flex', height: '100%', overflow: 'visible', width: '100%' }}
            >
                <div
                    className="materialdesign-vuetify-textField"
                    style={{ height: '100%', width: '100%' }}
                >
                    <div
                        className={`v-input v-input--dense theme--light materialdesign-text-field ${layout}${this.focused ? ' v-input--is-focused' : ''}${active ? ' v-input--is-label-active v-input--is-dirty' : ''}`}
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
                                '--vue-text-field-appendix-font-size': `${fontSize(data.inputAppendixFontSize, fontSize(data.inputTextFontSize, 16))}px`,
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
                                            backgroundColor: 'transparent',
                                            borderColor,
                                            borderRadius: layout.includes('rounded') ? 28 : 4,
                                            borderStyle: 'solid',
                                            borderWidth: this.focused ? 2 : 1,
                                            margin: 0,
                                            padding: '0 8px',
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
                                    <div className="v-input__prepend-inner">
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
                                                    ? `translateX(${num(data.inputTranslateX, 0)}px) translateY(${labelTranslateY}px) scale(0.75)`
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
                                            // Mask type enforces the pattern as you type (VIS1 vue-the-mask parity).
                                            this.localValue =
                                                data.inputType === 'mask'
                                                    ? applyMask(event.target.value, maskPattern(data))
                                                    : event.target.value;
                                            // Native date/time pickers (esp. Android) fire only `change`,
                                            // often without a blur — commit their atomic value immediately.
                                            // Text/number/mask keep committing on blur/Enter to avoid per-keystroke writes.
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
                                            boxSizing: 'border-box',
                                            color: textColor,
                                            fontFamily: data.inputTextFontFamily || undefined,
                                            fontSize: fontSize(data.inputTextFontSize, 16),
                                            flex: '1 1 auto',
                                            height: enclosed ? 20 : undefined,
                                            lineHeight: '20px',
                                            marginTop: !enclosed && !filled && data.inputLabelText ? 14 : undefined,
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
                                                setStateValue(props as VisRxWidgetProps, data.oid || '', '');
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
                                                plainColor(data.clearIconColor, '#44739e'),
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
                                    {data.inputMessage ? (
                                        <div
                                            style={{
                                                color: themeColor(data.inputMessageColor, 'rgba(0, 0, 0, 0.54)'),
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
                                                color: plainColor(data.inputCounterColor, 'rgba(0, 0, 0, 0.54)'),
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
