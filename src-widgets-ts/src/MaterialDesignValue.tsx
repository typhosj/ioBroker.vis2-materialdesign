import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { squarePreview, BaseRxData, RenderProps, VisWidget, createInfo, iconField, sizeCss, stateValue, formatMoment, formatDurationTokens, humanizeDuration, visLocale, sanitizeHtml } from './widgetUtils';
import { renderIcon } from './MaterialDesignButtons';

interface ValueData extends BaseRxData {
    targetType?: 'auto' | 'number' | 'string' | 'boolean' | 'linked';
    overrideText?: string;
    textAlign?: 'start' | 'center' | 'end';
    valueLabelWidth?: number;
    valuesFontColor?: string;
    valuesFontFamily?: string;
    valuesFontSize?: number;
    prepandText?: string;
    prepandTextColor?: string;
    prepandTextFontFamily?: string;
    prepandTextFontSize?: number;
    appendText?: string;
    appendTextColor?: string;
    appendTextFontFamily?: string;
    appendTextFontSize?: number;
    valueLabelUnit?: string;
    minDecimals?: number;
    maxDecimals?: number;
    calculate?: string;
    convertToDuration?: string;
    convertToTimestamp?: string;
    textOnTrue?: string;
    textOnFalse?: string;
    condition?: string;
    image?: string;
    imageColor?: string;
    iconPosition?: 'left' | 'right';
    iconHeight?: number;
    changeEffectEnabled?: boolean;
    effectFontColor?: string;
    effectFontSize?: number;
    effectDuration?: number;
}


const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            { name: 'targetType', label: 'targetType', type: 'select', options: ['auto', 'number', 'string', 'boolean', 'linked'], default: 'auto' },
            { name: 'overrideText', label: 'overrideText', type: 'html' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
        ],
    },
    {
        name: 'layout',
        fields: [
            { name: 'textAlign', label: 'textAlign', type: 'select', options: ['start', 'center', 'end'], default: 'start' },
            { name: 'valueLabelWidth', label: 'valueLabelWidth', type: 'number', default: 4 },
            { name: 'valuesFontColor', label: 'valuesFontColor', type: 'color' },
            { name: 'valuesFontFamily', label: 'valuesFontFamily', type: 'fontname' },
            { name: 'valuesFontSize', label: 'valuesFontSize', type: 'number' },
            { name: 'prepandText', label: 'prepandText', type: 'html' },
            { name: 'prepandTextColor', label: 'prepandTextColor', type: 'color' },
            { name: 'prepandTextFontFamily', label: 'prepandTextFontFamily', type: 'fontname' },
            { name: 'prepandTextFontSize', label: 'prepandTextFontSize', type: 'number' },
            { name: 'appendText', label: 'appendText', type: 'html' },
            { name: 'appendTextColor', label: 'appendTextColor', type: 'color' },
            { name: 'appendTextFontFamily', label: 'appendTextFontFamily', type: 'fontname' },
            { name: 'appendTextFontSize', label: 'appendTextFontSize', type: 'number' },
        ],
    },
    {
        name: 'formatNumber',
        fields: [
            { name: 'valueLabelUnit', label: 'valueLabelUnit', type: 'html' },
            { name: 'minDecimals', label: 'minDecimals', type: 'number' },
            { name: 'maxDecimals', label: 'maxDecimals', type: 'number' },
            { name: 'calculate', label: 'calculate', type: 'html' },
            { name: 'convertToDuration', label: 'convertToDuration', type: 'text' },
            { name: 'convertToTimestamp', label: 'convertToTimestamp', type: 'text' },
        ],
    },
    {
        name: 'formatBoolean',
        fields: [
            { name: 'textOnTrue', label: 'textOnTrue', type: 'html' },
            { name: 'textOnFalse', label: 'textOnFalse', type: 'html' },
            { name: 'condition', label: 'condition', type: 'html' },
        ],
    },
    {
        name: 'formatLinked',
        fields: [{ name: 'isHiddenOnLoad', label: 'isHiddenOnLoad', type: 'checkbox' }],
    },
    {
        name: 'icon',
        fields: [
            iconField('image', 'image', 'information'),
            { name: 'imageColor', label: 'imageColor', type: 'color' },
            { name: 'iconPosition', label: 'iconPosition', type: 'select', options: ['left', 'right'], default: 'left' },
            { name: 'iconHeight', label: 'iconHeight', type: 'slider', min: 0, max: 200, step: 1 },
        ],
    },
    {
        name: 'changeEffect',
        fields: [
            { name: 'changeEffectEnabled', label: 'changeEffectEnabled', type: 'checkbox' },
            { name: 'effectFontColor', label: 'effectFontColor', type: 'color' },
            { name: 'effectFontSize', label: 'effectFontSize', type: 'number' },
            { name: 'effectDuration', label: 'effectDuration', type: 'number', default: 750 },
        ],
    },
];

function number(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: unknown, fallback = ''): string {
    return value === undefined || value === null ? fallback : String(value);
}

function color(value: unknown, fallback = ''): string {
    const raw = text(value);
    return raw.startsWith('#mdwTheme:') ? fallback : raw || fallback;
}

function replaceValue(expression: string, value: unknown): string {
    const parsed = Number(value);
    return expression.replace(/#value/g, Number.isFinite(parsed) ? String(parsed) : text(value));
}

function evalMaybe(expression: string | undefined, value: unknown): unknown {
    if (!expression?.includes('#value')) {
        return expression;
    }
    const replaced = replaceValue(expression, value);
    const math = (window as unknown as { math?: { evaluate?: (value: string) => unknown } }).math;
    if (math?.evaluate) {
        return math.evaluate(replaced);
    }
    return Function(`"use strict";return (${replaced});`)() as unknown;
}

// Native (moment-free) duration/timestamp formatting. VIS1 used moment tokens here; the shared
// widgetUtils helpers reproduce them via Intl + arithmetic, so the runtime no longer needs moment.
function formatDuration(seconds: number, template: string): string {
    if (template === 'humanize') {
        return humanizeDuration(seconds, visLocale());
    }
    return formatDurationTokens(seconds, template);
}

function formatTimestamp(seconds: number, template: string): string {
    const date = new Date(seconds * 1000);
    return template ? formatMoment(date, template, visLocale()) : date.toLocaleString();
}

function formatNumber(value: unknown, data: ValueData): string {
    let current = value;
    if (data.calculate?.includes('#value')) {
        current = evalMaybe(data.calculate, current);
    }
    const numeric = Number(current);
    if (data.convertToDuration && Number.isFinite(numeric)) {
        return formatDuration(numeric, data.convertToDuration);
    }
    if (data.convertToTimestamp && Number.isFinite(numeric)) {
        return formatTimestamp(numeric, data.convertToTimestamp);
    }
    if (!Number.isFinite(numeric)) {
        return text(current);
    }
    const min = data.minDecimals === undefined ? undefined : number(data.minDecimals);
    const max = data.maxDecimals === undefined ? undefined : number(data.maxDecimals);
    const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: min,
        maximumFractionDigits: max,
    }).format(numeric);
    return `${formatted}${data.valueLabelUnit ? ` ${data.valueLabelUnit}` : ''}`;
}

function formatBoolean(value: unknown, data: ValueData): string {
    let current = value;
    if (data.condition?.includes('#value')) {
        current = evalMaybe(data.condition, current);
    }
    const on = current === true || current === 'true' || current === 1 || current === '1';
    return on ? text(data.textOnTrue, text(current)) : text(data.textOnFalse, text(current));
}

function formattedValue(value: unknown, data: ValueData): string {
    if (value === undefined || value === null) {
        return '';
    }
    const type = data.targetType === 'auto' || !data.targetType ? typeof value : data.targetType;
    const result = type === 'number' ? formatNumber(value, data) : type === 'boolean' ? formatBoolean(value, data) : text(value);
    if (!data.overrideText) {
        return result;
    }
    if (result.includes('|')) {
        return result.split('|').reduce((acc, part, index) => acc.replaceAll(`#value[${index}]`, part), data.overrideText);
    }
    return data.overrideText.replace(/#value/g, result);
}

export default class MaterialDesignValue extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-value', 'Value', attrs),
            visPrev: squarePreview('F0199'),
            visDefaultStyle: {
                width: 100,
                height: 30,
            },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignValue.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as ValueData;
        const value = stateValue(this.state as VisRxWidgetState, data.oid);
        const icon = renderIcon(text(data.image, 'information'), color(evalMaybe(data.imageColor, value), '#44739e'), number(data.iconHeight, 24));
        const iconFirst = data.iconPosition !== 'right';
        const gap = number(data.valueLabelWidth, 4);
        const valueStyle: React.CSSProperties = {
            color: color(evalMaybe(data.valuesFontColor, value)),
            flex: 1,
            fontFamily: text(data.valuesFontFamily) || undefined,
            fontSize: data.valuesFontSize ? sizeCss(data.valuesFontSize, 14) : undefined,
            margin: `0 ${gap}px`,
            textAlign: data.textAlign || 'start',
        };
        const prependStyle: React.CSSProperties = {
            color: color(evalMaybe(data.prepandTextColor, value)),
            fontFamily: text(data.prepandTextFontFamily) || undefined,
            fontSize: data.prepandTextFontSize ? sizeCss(data.prepandTextFontSize, 14) : undefined,
        };
        const appendStyle: React.CSSProperties = {
            color: color(evalMaybe(data.appendTextColor, value)),
            fontFamily: text(data.appendTextFontFamily) || undefined,
            fontSize: data.appendTextFontSize ? sizeCss(data.appendTextFontSize, 14) : undefined,
        };

        return (
            <div
                className="materialdesign-widget materialdesign-value"
                style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', height: '100%', padding: 0, width: '100%' }}
            >
                {iconFirst ? <div className="materialdesign-value-icon">{icon}</div> : null}
                <div className="materialdesign-value prepand-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text(data.prepandText)) }} style={prependStyle} />
                <div className="materialdesign-value value-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedValue(value, data)) }} style={valueStyle} />
                <div className="materialdesign-value append-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text(data.appendText)) }} style={appendStyle} />
                {!iconFirst ? <div className="materialdesign-value-icon">{icon}</div> : null}
            </div>
        );
    }
}
