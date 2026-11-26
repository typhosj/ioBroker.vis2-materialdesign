import React from 'react';

import type { RxWidgetInfo, RxWidgetInfoAttributesField, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { fill, withAutoFill } from './deviceFill';
import { accessibleText, ariaLabelField, ariaName, squarePreview, BaseRxData, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, inkOn, legacyInk, numberValue, setStateValue, sizeCss, sliderKeyValue, stateValue, sanitizeHtml } from './widgetUtils';

export interface ProgressData extends BaseRxData {
    min?: number;
    max?: number;
    reverse?: boolean;
    invertValue?: boolean;
    progressWritable?: boolean;
    ariaLabel?: string;
    step?: number;
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

// Issue #15: picking the datapoint fills what the object's own metadata already says.
export const progressFillMap = {
    oid: [fill.name('ariaLabel'), fill.unit('valueLabelUnit'), fill.min('min'), fill.max('max'), fill.decimals('valueMaxDecimals')],
};

const commonFields: RxWidgetInfoAttributesField[] = [
    { name: 'oid', label: 'oid', type: 'id' },
    { name: 'min', label: 'min', type: 'number' },
    { name: 'max', label: 'max', type: 'number' },
];

const colorFields: RxWidgetInfoAttributesField[] = [
    { name: 'colorProgressBackground', label: 'colorProgressBackground', type: 'color' },
    { name: 'colorProgress', label: 'colorProgress', type: 'color' },
    { name: 'colorOneCondition', label: 'colorOneCondition', type: 'number' },
    { name: 'colorOne', label: 'colorOne', type: 'color' },
    { name: 'colorTwoCondition', label: 'colorTwoCondition', type: 'number' },
    { name: 'colorTwo', label: 'colorTwo', type: 'color' },
];

const labelFields: RxWidgetInfoAttributesField[] = [
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
            { name: 'progressWritable', label: 'progressWritable', type: 'checkbox' },
            { name: 'step', label: 'step', type: 'number', default: 1 },
            ariaLabelField,
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

// The shared coercion, not a local `Number()`: VIS2 stores a cleared number field as '' or null, and
// `Number('')` is a finite 0 that silently beat the declared default — a Progress whose `max` had
// been emptied got min = max = 0 and sat at 0 % forever. Slider/RoundSlider/ProgressCircular import
// this same `num`, so the guard has to live here.
export const num = numberValue;

// Strips binary-float noise (step 0.1 -> 0.1*3 = 0.30000000000000004).
export function snapToStep(value: number, step: number): number {
    if (!Number.isFinite(step) || step <= 0) {
        return value;
    }
    const stepped = Math.round(value / step) * step;
    const decimals = (String(step).split('.')[1] || '').length;
    return decimals ? Number(stepped.toFixed(decimals)) : stepped;
}

// Transform only, and it stops under `prefers-reduced-motion`.
const INDETERMINATE_CSS =
    '@keyframes materialdesign-progress-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}'
    + '.materialdesign-progress--indeterminate{animation:materialdesign-progress-indeterminate 1.8s cubic-bezier(.4,0,.2,1) infinite}'
    + '@media (prefers-reduced-motion: reduce){.materialdesign-progress--indeterminate{animation:none;transform:translateX(75%)}}';

export function cleanColor(value: unknown, fallback: string): string {
    const raw = typeof value === 'string' ? value : '';
    return raw && !raw.startsWith('#mdwTheme:') ? raw : fallback;
}

// Default isM3=false keeps the exported behavior — and its unit tests — unchanged.
export function progressState(value: ioBroker.StateValue | undefined, data: ProgressData, isM3 = false): { percent: number; raw: number; color: string; label: string } {
    const min = num(data.min, 0);
    const max = num(data.max, 100);
    let raw = value === true || value === 'true' ? max : value === false || value === 'false' ? min : num(value, min);
    raw = Math.min(max, Math.max(min, raw));
    const range = max - min || 1;
    const percent = Math.floor(((raw - min) * 100) / range);
    const oneCondition = num(data.colorOneCondition, 1000);
    const twoCondition = num(data.colorTwoCondition, 1000);
    const baseColor = cleanColor(data.colorProgress, isM3 ? 'var(--md-sys-color-primary)' : '#44739e');
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

// The rotated bar turns clockwise, so its fill grows downwards, against ArrowUp. Reverse and invert
// each turn the direction once more.
export function progressKeysFlipped(data: ProgressData): boolean {
    return (data.progressRotate === 'yesRotate') !== !!data.reverse !== !!data.invertValue;
}

export function progressPointerValue(fraction: number, data: ProgressData): number {
    const min = num(data.min, 0);
    const max = num(data.max, 100);
    let along = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
    if (data.reverse) along = 1 - along;
    if (data.invertValue) along = 1 - along;
    const step = num(data.step, 1);
    const unit = step > 0 ? step : 1;
    const value = min + Math.round((along * (max - min)) / unit) * unit;
    return Math.round(Math.min(Math.max(min, max), Math.max(Math.min(min, max), value)) * 1e6) / 1e6;
}

export default class MaterialDesignProgress extends VisWidget {
    private dragValue: number | undefined;

    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Progress', 'Progress', withAutoFill(linearAttrs, progressFillMap), ['layoutStriped', 'color']),
            visPrev: squarePreview('F03F0'),
            visDefaultStyle: { width: 100, height: 30 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignProgress.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as ProgressData;
        const isM3 = designStyle(data as unknown as Record<string, unknown>) === 'material3';
        const stored = stateValue(this.state, data.oid);
        const progress = progressState(this.dragValue ?? stored, data, isM3);
        const background = cleanColor(data.colorProgressBackground, isM3 ? 'var(--md-sys-color-surface-container-high)' : 'rgba(161, 161, 161, 0.26)');
        const striped = data.progressStriped;
        const stripeColor = cleanColor(data.progressStripedColor, 'rgba(255, 255, 255, 0.25)');
        // `progressIndeterminate` only widened the bar to 100%, indistinguishable from a finished one.
        const indeterminate = !!data.progressIndeterminate;
        const displayedPercent = indeterminate ? 100 : progress.percent;
        const reverse = data.reverse && !indeterminate;
        const writable = !!data.progressWritable && !indeterminate && !this.props.editMode && !!data.oid;
        const pointerValue = (event: React.PointerEvent<HTMLDivElement>): number => {
            const box = event.currentTarget.getBoundingClientRect();
            const fraction = data.progressRotate === 'yesRotate' ? (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width;
            return progressPointerValue(fraction, data);
        };
        const write = (next: number): void => { setStateValue(this.props, data.oid || '', next); };
        // The copy inside the bar must span the full track, or its text no longer covers the track text.
        // Known limit: a translucent bar color lets the track text show through under the copy.
        const showLabel = data.showValueLabel !== false && !indeterminate;
        const barStart = reverse ? 100 - displayedPercent : 0;
        const ownTextColor = cleanColor(data.textColor, '');
        const trackInk = ownTextColor || (isM3 ? 'var(--md-sys-color-on-surface)' : legacyInk(this.isDarkTheme()));
        const barInk = ownTextColor || inkOn(progress.color) || trackInk;
        const labelBox = (color: string, place?: React.CSSProperties, copy = false): React.JSX.Element => (
            <div
                aria-hidden={copy ? 'true' : undefined}
                className="v-progress-linear__content"
                style={{
                    alignItems: 'center',
                    color,
                    display: 'flex',
                    fontFamily: data.textFontFamily || undefined,
                    fontSize: data.textFontSize ? sizeCss(data.textFontSize, 12) : 12,
                    height: '100%',
                    justifyContent: data.textAlign === 'center' ? 'center' : data.textAlign === 'start' ? 'flex-start' : 'flex-end',
                    position: 'relative',
                    width: '100%',
                    ...place,
                }}
            >
                <div className="materialdesign-vuetify-progress-value-label" dangerouslySetInnerHTML={{ __html: sanitizeHtml(progress.label) }} style={{ color: 'inherit', marginLeft: 10, marginRight: 10 }} />
            </div>
        );
        const interaction: React.HTMLAttributes<HTMLDivElement> = writable
            ? {
                  role: 'slider',
                  'aria-orientation': data.progressRotate === 'yesRotate' ? 'vertical' : 'horizontal',
                  tabIndex: 0,
                  onPointerDown: event => {
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                      this.dragValue = pointerValue(event);
                      this.forceUpdate();
                  },
                  onPointerMove: event => {
                      if (this.dragValue === undefined) return;
                      this.dragValue = pointerValue(event);
                      this.forceUpdate();
                  },
                  onPointerUp: () => {
                      if (this.dragValue === undefined) return;
                      write(this.dragValue);
                      this.dragValue = undefined;
                      // A write the state never echoes (read-only target, rejected) would leave the drag drawn.
                      this.forceUpdate();
                  },
                  onPointerCancel: () => {
                      this.dragValue = undefined;
                      this.forceUpdate();
                  },
                  onKeyDown: event => {
                      const next = sliderKeyValue(event.key, progress.raw, num(data.min, 0), num(data.max, 100), num(data.step, 1), progressKeysFlipped(data));
                      if (next === null) return;
                      event.preventDefault();
                      write(next);
                  },
              }
            : { role: 'progressbar' };

        return (
            <div className={`materialdesign-widget materialdesign-progress${isM3 ? ` ${designStyleClasses(data as unknown as Record<string, unknown>, this.isDarkTheme())}` : ''}`} style={{ height: '100%', padding: 0, width: '100%' }}>
                <div className="materialdesign-vuetify-progress" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>
                    <div
                        {...interaction}
                        aria-label={ariaName(data.ariaLabel, 'ariaProgress')}
                        aria-valuetext={data.showValueLabel !== false && !indeterminate ? accessibleText(progress.label, '') || undefined : undefined}
                        aria-valuemax={writable ? num(data.max, 100) : 100}
                        aria-valuemin={writable ? num(data.min, 0) : 0}
                        aria-valuenow={writable ? progress.raw : displayedPercent}
                        className={`v-progress-linear${data.progressRounded !== false ? ' v-progress-linear--rounded' : ''} theme--light`}
                        style={{
                            background,
                            borderRadius: data.progressRounded !== false ? 4 : 0,
                            cursor: writable ? 'pointer' : undefined,
                            height: '100%',
                            overflow: 'hidden',
                            position: 'relative',
                            transform: data.progressRotate === 'yesRotate' ? 'rotate(90deg)' : undefined,
                            touchAction: writable ? 'none' : undefined,
                            width: '100%',
                        }}
                    >
                        {indeterminate ? <style>{INDETERMINATE_CSS}</style> : null}
                        {showLabel ? labelBox(trackInk) : null}
                        <div
                            className={`v-progress-linear__determinate primary${indeterminate ? ' materialdesign-progress--indeterminate' : ''}`}
                            style={{
                                overflow: 'hidden',
                                background: striped
                                    ? `repeating-linear-gradient(${num(data.stripAngle, 135)}deg, ${progress.color} 0 ${num(data.stipWidth1, 25)}%, ${stripeColor} ${num(data.stipWidth1, 25)}% ${num(data.stipWidth2, 50)}%, ${progress.color} ${num(data.stipWidth2, 50)}% ${num(data.stipWidth3, 75)}%)`
                                    : progress.color,
                                // `stripDistance` gives the repeating pattern a fixed width instead of letting the
                                // percentage stops stretch with the bar.
                                backgroundSize: striped && num(data.stripDistance) ? `${num(data.stripDistance)}px 100%` : undefined,
                                height: '100%',
                                insetInlineStart: reverse ? `${100 - displayedPercent}%` : 0,
                                position: 'absolute',
                                top: 0,
                                width: indeterminate ? '40%' : `${displayedPercent}%`,
                            }}
                        >
                            {showLabel && displayedPercent > 0
                                ? labelBox(barInk, { insetInlineStart: `${(-barStart * 100) / displayedPercent}%`, position: 'absolute', top: 0, width: `${10000 / displayedPercent}%` }, true)
                                : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
