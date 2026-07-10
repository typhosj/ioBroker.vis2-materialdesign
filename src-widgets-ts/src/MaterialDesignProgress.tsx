import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { BaseRxData, RenderProps, VisWidget, createInfo, stateValue } from './widgetUtils';

export interface ProgressData extends BaseRxData {
    min?: number;
    max?: number;
    reverse?: boolean;
    invertValue?: boolean;
    progressRounded?: boolean;
    progressIndeterminate?: boolean;
    progressRotate?: 'noRotate' | 'yesRotate';
    progressStriped?: boolean;
    progressStripedColor?: string;
    stripAngle?: number;
    stipWidth1?: number;
    stipWidth2?: number;
    stipWidth3?: number;
    stripDistance?: number;
    colorProgressBackground?: string;
    colorProgress?: string;
    colorOneCondition?: number;
    colorOne?: string;
    colorTwoCondition?: number;
    colorTwo?: string;
    innerColor?: string;
    showValueLabel?: boolean;
    valueLabelStyle?: 'progressPercent' | 'progressValue' | 'progressCustom';
    valueLabelUnit?: string;
    valueMaxDecimals?: number;
    valueLabelCustom?: string;
    textColor?: string;
    textFontSize?: number;
    textFontFamily?: string;
    textAlign?: 'start' | 'center' | 'end';
    progressCircularSize?: number;
    progressCircularWidth?: number;
    progressCircularRotate?: number;
}

export const linearPreview =
    '<div id="prev_tplVis-materialdesign-Progress" style="position: relative; text-align: initial; display: flex; justify-content:center;"><div class="vis-widget_prev materialdesign-widget materialdesign-progress vis-tpl-materialdesign-Progress " style="width: 100px; height: 30px; left: 105px; top: 68px; position: absolute; --vue-progress-progress-color:#44739e; --vue-progress-progress-color-background:rgba(161, 161, 161, 0.26); --vue-progress-progress-color-text:#44739e; --vue-progress-progress-color-text-size:12px; --vue-progress-progress-color-text-font-family:RobotoCondensed-Light; --vue-progress-progress-color-text-align:end; z-index: 4;" data-tmodified="true" data-zmodified="true"> <div class="materialdesign-vuetify-progress" style="width: 100%; height: 100%; display: flex; justify-content: center;"><div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="41" class="v-progress-linear v-progress-linear--rounded theme--light" style="height: 30px;"><div class="v-progress-linear__background primary" style="opacity: 0.3; left: 41%; width: 59%;"></div><div class="v-progress-linear__buffer"></div><div class="v-progress-linear__determinate primary" style="width: 41%;"></div><div class="v-progress-linear__content"><div class="materialdesign-vuetify-progress-value-label" style="width: 100%; margin-left: 10px; margin-right: 10px;">41 %</div></div></div></div><div class="ui-resizable-handle ui-resizable-n" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-w" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-nw" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-ne" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-sw" style="z-index: 90;"></div></div></div>';

const commonFields: Record<string, unknown>[] = [
    { name: 'oid', label: 'oid', type: 'id' },
    { name: 'min', label: 'min', type: 'number' },
    { name: 'max', label: 'max', type: 'number' },
];

const colorFields: Record<string, unknown>[] = [
    { name: 'colorProgressBackground', label: 'colorProgressBackground', type: 'color' },
    { name: 'colorProgress', label: 'colorProgress', type: 'color' },
    { name: 'colorOneCondition', label: 'colorOneCondition', type: 'number' },
    { name: 'colorOne', label: 'colorOne', type: 'color' },
    { name: 'colorTwoCondition', label: 'colorTwoCondition', type: 'number' },
    { name: 'colorTwo', label: 'colorTwo', type: 'color' },
];

const labelFields: Record<string, unknown>[] = [
    { name: 'showValueLabel', label: 'showValueLabel', type: 'checkbox', default: true },
    { name: 'valueLabelStyle', label: 'valueLabelStyle', type: 'select', options: ['progressPercent', 'progressValue', 'progressCustom'], default: 'progressPercent' },
    { name: 'valueLabelUnit', label: 'valueLabelUnit', type: 'text' },
    { name: 'valueMaxDecimals', label: 'valueMaxDecimals', type: 'number' },
    { name: 'valueLabelCustom', label: 'valueLabelCustom', type: 'html' },
    { name: 'textColor', label: 'textColor', type: 'color' },
    { name: 'textFontSize', label: 'textFontSize', type: 'number' },
    { name: 'textFontFamily', label: 'textFontFamily', type: 'fontname' },
];

export const linearAttrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            ...commonFields,
            { name: 'reverse', label: 'reverse', type: 'checkbox' },
            { name: 'invertValue', label: 'invertValue', type: 'checkbox' },
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
        ],
    },
    {
        name: 'layout',
        fields: [
            { name: 'progressRounded', label: 'progressRounded', type: 'checkbox', default: true },
            { name: 'progressIndeterminate', label: 'progressIndeterminate', type: 'checkbox' },
            { name: 'progressRotate', label: 'progressRotate', type: 'select', options: ['noRotate', 'yesRotate'], default: 'noRotate' },
        ],
    },
    {
        name: 'layoutStriped',
        fields: [
            { name: 'progressStriped', label: 'progressStriped', type: 'checkbox' },
            { name: 'progressStripedColor', label: 'progressStripedColor', type: 'color' },
            { name: 'stripAngle', label: 'stripAngle', type: 'slider', min: 0, max: 360, step: 1, default: 135 },
            { name: 'stipWidth1', label: 'stipWidth1', type: 'number', default: 25 },
            { name: 'stipWidth2', label: 'stipWidth2', type: 'number', default: 50 },
            { name: 'stipWidth3', label: 'stipWidth3', type: 'number', default: 75 },
            { name: 'stripDistance', label: 'stripDistance', type: 'number' },
        ],
    },
    { name: 'color', fields: colorFields },
    { name: 'label', fields: [...labelFields, { name: 'textAlign', label: 'textAlign', type: 'select', options: ['start', 'center', 'end'], default: 'end' }] },
];

export function num(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function cleanColor(value: unknown, fallback: string): string {
    const raw = typeof value === 'string' ? value : '';
    return raw && !raw.startsWith('#mdwTheme:') && !raw.startsWith('var(') ? raw : fallback;
}

export function progressState(value: ioBroker.StateValue | undefined, data: ProgressData): { percent: number; raw: number; color: string; label: string } {
    const min = num(data.min, 0);
    const max = num(data.max, 100);
    let raw = value === true || value === 'true' ? max : value === false || value === 'false' ? min : num(value, min);
    raw = Math.min(max, Math.max(min, raw));
    const range = max - min || 1;
    const percent = Math.floor(((raw - min) * 100) / range);
    const oneCondition = num(data.colorOneCondition, 1000);
    const twoCondition = num(data.colorTwoCondition, 1000);
    const baseColor = cleanColor(data.colorProgress, '#44739e');
    const color =
        percent > oneCondition && percent <= twoCondition
            ? cleanColor(data.colorOne, baseColor)
            : percent > twoCondition
              ? cleanColor(data.colorTwo, baseColor)
              : baseColor;
    const decimals = num(data.valueMaxDecimals, 0);
    const fmt = (input: number): string => new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(input);
    const style = data.valueLabelStyle || 'progressPercent';
    const label =
        style === 'progressValue'
            ? `${fmt(raw)}${data.valueLabelUnit || ''}`
            : style === 'progressCustom'
              ? (data.valueLabelCustom || '').replace('[#value]', fmt(raw)).replace('[#percent]', fmt(percent))
              : `${fmt(percent)} %`;
    return { percent: data.invertValue ? 100 - percent : percent, raw, color, label };
}

export default class MaterialDesignProgress extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Progress', 'Progress', linearAttrs),
            visPrev: linearPreview,
            visDefaultStyle: { width: 100, height: 30 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignProgress.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as ProgressData;
        const value = stateValue(this.state as VisRxWidgetState, data.oid);
        const progress = progressState(value, data);
        const background = cleanColor(data.colorProgressBackground, 'rgba(161, 161, 161, 0.26)');
        const striped = data.progressStriped;
        const stripeColor = cleanColor(data.progressStripedColor, 'rgba(255, 255, 255, 0.25)');
        const displayedPercent = data.progressIndeterminate ? 100 : progress.percent;
        const reverse = data.reverse && !data.progressIndeterminate;

        return (
            <div className="materialdesign-widget materialdesign-progress" style={{ height: '100%', padding: 0, width: '100%' }}>
                <div className="materialdesign-vuetify-progress" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>
                    <div
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={displayedPercent}
                        className={`v-progress-linear${data.progressRounded !== false ? ' v-progress-linear--rounded' : ''} theme--light`}
                        role="progressbar"
                        style={{
                            background,
                            borderRadius: data.progressRounded !== false ? 4 : 0,
                            height: '100%',
                            overflow: 'hidden',
                            position: 'relative',
                            transform: data.progressRotate === 'yesRotate' ? 'rotate(90deg)' : undefined,
                            width: '100%',
                        }}
                    >
                        <div
                            className="v-progress-linear__determinate primary"
                            style={{
                                background: striped
                                    ? `repeating-linear-gradient(${num(data.stripAngle, 135)}deg, ${progress.color} 0 ${num(data.stipWidth1, 25)}%, ${stripeColor} ${num(data.stipWidth1, 25)}% ${num(data.stipWidth2, 50)}%, ${progress.color} ${num(data.stipWidth2, 50)}% ${num(data.stipWidth3, 75)}%)`
                                    : progress.color,
                                height: '100%',
                                insetInlineStart: reverse ? `${100 - displayedPercent}%` : 0,
                                position: 'absolute',
                                width: `${displayedPercent}%`,
                            }}
                        />
                        {data.showValueLabel !== false ? (
                            <div
                                className="v-progress-linear__content"
                                style={{
                                    alignItems: 'center',
                                    color: cleanColor(data.textColor, '#44739e'),
                                    display: 'flex',
                                    fontFamily: data.textFontFamily || undefined,
                                    fontSize: data.textFontSize ? num(data.textFontSize, 12) : 12,
                                    height: '100%',
                                    justifyContent: data.textAlign === 'center' ? 'center' : data.textAlign === 'start' ? 'flex-start' : 'flex-end',
                                    position: 'relative',
                                    width: '100%',
                                }}
                            >
                                <div className="materialdesign-vuetify-progress-value-label" dangerouslySetInnerHTML={{ __html: progress.label }} style={{ marginLeft: 10, marginRight: 10 }} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}
