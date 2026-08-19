import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { cleanColor, num, snapToStep } from './MaterialDesignProgress';
import { m3ColorExplicit } from './MaterialDesignButtons';
import { squarePreview, RenderProps, SliderWriter, VisWidget, boundedCount, createInfo, designStyle, designStyleClasses, setStateValue, sizeCss, sliderKeyValue, stateValue, sanitizeHtml } from './widgetUtils';

// The old widget got track/thumb geometry from ambient legacy Vuetify CSS, which is gone.
const SLIDER_CSS = `
.materialdesign-vuetifySlider input{display:none!important}
.materialdesign-vuetifySlider .v-slider__track-container{position:absolute;border-radius:6px;overflow:hidden}
.materialdesign-vuetifySlider .v-slider--horizontal .v-slider__track-container{height:4px;width:100%;top:50%;left:0;transform:translateY(-50%)}
.materialdesign-vuetifySlider .v-slider--vertical .v-slider__track-container{width:4px;height:100%;left:50%;top:0;transform:translateX(-50%)}
.materialdesign-vuetifySlider .v-slider__track-background,.materialdesign-vuetifySlider .v-slider__track-fill{position:absolute}
.materialdesign-vuetifySlider .v-slider--horizontal .v-slider__track-background,.materialdesign-vuetifySlider .v-slider--horizontal .v-slider__track-fill{height:100%;top:0}
.materialdesign-vuetifySlider .v-slider--vertical .v-slider__track-background,.materialdesign-vuetifySlider .v-slider--vertical .v-slider__track-fill{width:100%;left:0}
.materialdesign-vuetifySlider .v-slider__thumb-container{position:absolute}
.materialdesign-vuetifySlider .v-slider--horizontal .v-slider__thumb-container{top:50%}
.materialdesign-vuetifySlider .v-slider--vertical .v-slider__thumb-container{left:50%}
.materialdesign-vuetifySlider .v-slider__thumb{position:absolute;width:14px;height:14px;border-radius:50%;background:currentColor;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.materialdesign-vuetifySlider .v-slider--horizontal .v-slider__thumb{top:50%;left:0;transform:translate(-50%,-50%)}
.materialdesign-vuetifySlider .v-slider--vertical .v-slider__thumb{left:50%;bottom:0;transform:translate(-50%,50%)}
.materialdesign-vuetifySlider .v-slider__thumb.medium-size{width:18px;height:18px}
.materialdesign-vuetifySlider .v-slider__thumb.big-size{width:24px;height:24px}
.materialdesign-vuetifySlider .v-slider__ticks-container{position:absolute;left:0;top:50%;width:100%;height:0}
.materialdesign-vuetifySlider .v-slider__tick{position:absolute;background:rgba(0,0,0,.35);transform:translate(-50%,-50%)}
.materialdesign-vuetifySlider .v-slider__tick-label{position:absolute;top:8px;left:0;transform:translateX(-50%);font-size:11px;white-space:nowrap}
.materialdesign-vuetifySlider .v-slider__thumb-label-container{position:absolute;top:0;left:0}
.materialdesign-vuetifySlider .v-slider__thumb-label{position:absolute;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50% 50% 0;transform:translate(-50%,-140%) rotate(45deg)}
.materialdesign-vuetifySlider .v-slider__thumb-label>div{transform:rotate(-45deg)}
`;

export interface SliderData {
    oid?: string;
    'oid-working'?: string;
    orientation?: 'horizontal' | 'vertical';
    reverseSlider?: boolean;
    knobSize?: 'knobSmall' | 'knobMedium' | 'knobBig';
    readOnly?: boolean;
    sendValueOnRelease?: boolean;
    min?: number;
    max?: number;
    step?: number;
    vibrateOnMobilDevices?: number;
    clickSoundPlay?: boolean;
    clickSoundVolume?: number;
    showTicks?: 'no' | 'yes' | 'always';
    tickSize?: number;
    tickLabels?: string;
    tickTextColor?: string;
    tickFontFamily?: string;
    tickFontSize?: number;
    tickColorBefore?: string;
    tickColorAfter?: string;
    colorBeforeThumb?: string;
    colorThumb?: string;
    colorAfterThumb?: string;
    prepandText?: string;
    prepandTextWidth?: number;
    prepandTextColor?: string;
    prepandTextFontSize?: number;
    prepandTextFontFamily?: string;
    showValueLabel?: boolean;
    valueLabelStyle?: 'sliderPercent' | 'sliderValue';
    valueLabelUnit?: string;
    valueFontFamily?: string;
    valueFontSize?: number;
    valueLabelColor?: string;
    valueLabelMin?: string;
    valueLabelMax?: string;
    valueLessThan?: number;
    textForValueLessThan?: string;
    valueGreaterThan?: number;
    textForValueGreaterThan?: string;
    valueLabelWidth?: number;
    showThumbLabel?: 'no' | 'yes' | 'always';
    thumbSize?: number;
    thumbBackgroundColor?: string;
    thumbFontColor?: string;
    thumbFontSize?: number;
    thumbFontFamily?: string;
    useLabelRules?: boolean;
}


const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            { name: 'oid-working', label: 'oid-working', type: 'id' },
            { name: 'sendValueOnRelease', label: 'sendValueOnRelease', type: 'checkbox' },
            { name: 'orientation', label: 'orientation', type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' },
            { name: 'reverseSlider', label: 'reverseSlider', type: 'checkbox' },
            { name: 'knobSize', label: 'knobSize', type: 'select', options: ['knobSmall', 'knobMedium', 'knobBig'], default: 'knobSmall' },
            { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
            { name: 'min', label: 'min', type: 'number' },
            { name: 'max', label: 'max', type: 'number' },
            { name: 'step', label: 'step', type: 'number', default: 1 },
            { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 },
            { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' },
            { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 },
        ],
    },
    {
        name: 'tickLayout',
        label: 'group_tickLayout',
        fields: [
            { name: 'showTicks', label: 'showTicks', type: 'select', options: ['no', 'yes', 'always'], default: 'no' },
            { name: 'tickSize', label: 'tickSize', type: 'number' },
            { name: 'tickLabels', label: 'tickLabels', type: 'text' },
            { name: 'tickTextColor', label: 'tickTextColor', type: 'color' },
            { name: 'tickFontFamily', label: 'tickFontFamily', type: 'fontname' },
            { name: 'tickFontSize', label: 'tickFontSize', type: 'number' },
            { name: 'tickColorBefore', label: 'tickColorBefore', type: 'color' },
            { name: 'tickColorAfter', label: 'tickColorAfter', type: 'color' },
        ],
    },
    {
        name: 'color',
        label: 'group_color',
        fields: [
            { name: 'colorBeforeThumb', label: 'colorBeforeThumb', type: 'color' },
            { name: 'colorThumb', label: 'colorThumb', type: 'color' },
            { name: 'colorAfterThumb', label: 'colorAfterThumb', type: 'color' },
        ],
    },
    {
        name: 'label',
        label: 'group_label',
        fields: [
            { name: 'prepandText', label: 'prepandText', type: 'text' },
            { name: 'prepandTextWidth', label: 'prepandTextWidth', type: 'number' },
            { name: 'prepandTextColor', label: 'prepandTextColor', type: 'color' },
            { name: 'prepandTextFontSize', label: 'prepandTextFontSize', type: 'number' },
            { name: 'prepandTextFontFamily', label: 'prepandTextFontFamily', type: 'fontname' },
            { name: 'showValueLabel', label: 'showValueLabel', type: 'checkbox', default: true },
            { name: 'valueLabelStyle', label: 'valueLabelStyle', type: 'select', options: ['sliderPercent', 'sliderValue'], default: 'sliderValue' },
            { name: 'valueLabelUnit', label: 'valueLabelUnit', type: 'text' },
            { name: 'valueFontFamily', label: 'valueFontFamily', type: 'fontname' },
            { name: 'valueFontSize', label: 'valueFontSize', type: 'number' },
            { name: 'valueLabelColor', label: 'valueLabelColor', type: 'color' },
            { name: 'valueLabelMin', label: 'valueLabelMin', type: 'html' },
            { name: 'valueLabelMax', label: 'valueLabelMax', type: 'html' },
            { name: 'valueLessThan', label: 'valueLessThan', type: 'number' },
            { name: 'textForValueLessThan', label: 'textForValueLessThan', type: 'html' },
            { name: 'valueGreaterThan', label: 'valueGreaterThan', type: 'number' },
            { name: 'textForValueGreaterThan', label: 'textForValueGreaterThan', type: 'html' },
            { name: 'valueLabelWidth', label: 'valueLabelWidth', type: 'slider', min: 0, max: 200, step: 1, default: 50 },
        ],
    },
    {
        name: 'thumbLabelLayout',
        label: 'group_thumbLabelLayout',
        fields: [
            { name: 'showThumbLabel', label: 'showThumbLabel', type: 'select', options: ['no', 'yes', 'always'], default: 'no' },
            { name: 'thumbSize', label: 'thumbSize', type: 'number' },
            { name: 'thumbBackgroundColor', label: 'thumbBackgroundColor', type: 'color' },
            { name: 'thumbFontColor', label: 'thumbFontColor', type: 'color' },
            { name: 'thumbFontSize', label: 'thumbFontSize', type: 'number' },
            { name: 'thumbFontFamily', label: 'thumbFontFamily', type: 'fontname' },
            { name: 'useLabelRules', label: 'useLabelRules', type: 'checkbox' },
        ],
    },
];

export function range(data: SliderData): { min: number; max: number; step: number } {
    const min = num(data.min, 0);
    const max = num(data.max, 100);
    return { min, max: max === min ? min + 100 : max, step: num(data.step, 1) || 1 };
}

export function sliderValue(value: ioBroker.StateValue | undefined, data: SliderData): { raw: number; percent: number } {
    const { min, max } = range(data);
    const raw = Math.min(max, Math.max(min, num(value, min)));
    return { raw, percent: ((raw - min) * 100) / (max - min) };
}

export function labelFor(raw: number, percent: number, data: SliderData, applyRules: boolean): string {
    const { min, max } = range(data);
    if (applyRules) {
        if (raw === min && data.valueLabelMin) {
            return data.valueLabelMin;
        }
        if (raw === max && data.valueLabelMax) {
            return data.valueLabelMax;
        }
        if (data.valueLessThan !== undefined && raw < num(data.valueLessThan, 0) && data.textForValueLessThan) {
            return data.textForValueLessThan;
        }
        if (data.valueGreaterThan !== undefined && raw > num(data.valueGreaterThan, 0) && data.textForValueGreaterThan) {
            return data.textForValueGreaterThan;
        }
    }
    if (data.valueLabelStyle === 'sliderPercent') {
        return `${Math.round(percent)} %`;
    }
    return `${raw}${data.valueLabelUnit || ''}`;
}

function feedback(data: SliderData): void {
    const vibrate = num(data.vibrateOnMobilDevices, 50);
    if (vibrate > 0 && navigator.vibrate) {
        navigator.vibrate(vibrate);
    }
    if (data.clickSoundPlay) {
        const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3');
        audio.volume = Math.max(0, Math.min(1, num(data.clickSoundVolume, 0.5)));
        void audio.play().catch(() => undefined);
    }
}

function cssVars(data: SliderData): React.CSSProperties {
    return {
        '--vue-slider-thumb-label-font-color': cleanColor(data.thumbFontColor, '#FFFFFF'),
        '--vue-slider-thumb-label-font-family': data.thumbFontFamily || undefined,
        '--vue-slider-thumb-label-font-size': `${num(data.thumbFontSize, 12)}px`,
        '--vue-slider-tick-before-color': cleanColor(data.tickColorBefore, '#44739e'),
        '--vue-slider-tick-after-color': cleanColor(data.tickColorAfter, '#44739e'),
        '--vue-slider-tick-color': cleanColor(data.tickTextColor, '#808080'),
        '--vue-slider-tick-font-family': data.tickFontFamily || undefined,
        '--vue-slider-tick-font-size': `${num(data.tickFontSize, 14)}px`,
    } as React.CSSProperties;
}

export function isWorking(value: ioBroker.StateValue | undefined): boolean {
    return !(value === undefined || value === null || value === '' || value === false || value === 'false');
}

export default class MaterialDesignSlider extends VisWidget {
    private optimisticValue: number | undefined;
    private seenStateValue: ioBroker.StateValue | undefined;

    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Slider', 'Slider', attrs, ['tickLayout', 'color', 'thumbLabelLayout']),
            visPrev: squarePreview('F1542'),
            visDefaultStyle: { width: 200, height: 100 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignSlider.getWidgetInfo();
    }

    private readonly writer = new SliderWriter();

    componentWillUnmount(): void {
        this.writer.cancel();
        super.componentWillUnmount();
    }

    private pointerValue(event: React.PointerEvent<HTMLElement>, data: SliderData): number {
        const box = event.currentTarget.getBoundingClientRect();
        const { min, max, step } = range(data);
        const rawRatio =
            (data.orientation || 'horizontal') === 'vertical'
                ? 1 - (event.clientY - box.top) / box.height
                : (event.clientX - box.left) / box.width;
        const ratio = data.reverseSlider ? 1 - rawRatio : rawRatio;
        const value = min + Math.max(0, Math.min(1, ratio)) * (max - min);
        const stepped = snapToStep(value, step);
        return Math.min(max, Math.max(min, stepped));
    }

    private writeFromPointer(event: React.PointerEvent<HTMLElement>, data: SliderData, disabled: boolean): void {
        if (disabled) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const value = this.pointerValue(event, data);
        this.optimisticValue = value;
        // The thumb follows the finger either way; only the writing differs.
        if (!data.sendValueOnRelease) {
            this.writer.write(this.props, data.oid || '', value);
        }
        this.forceUpdate();
    }

    // Same optimistic write path as the pointer. Non-slider keys are left untouched so Tab still moves focus.
    private writeFromKey(event: React.KeyboardEvent<HTMLElement>, data: SliderData, disabled: boolean): void {
        if (disabled) {
            return;
        }
        const { min, max, step } = range(data);
        const value = sliderValue(this.optimisticValue ?? stateValue(this.state, data.oid || ''), data).raw;
        const next = sliderKeyValue(event.key, value, min, max, step);
        if (next === null) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        feedback(data);
        this.optimisticValue = next;
        setStateValue(this.props, data.oid || '', next);
        this.forceUpdate();
    }

    private releasePointer(data: SliderData): void {
        if (data.sendValueOnRelease) {
            if (this.optimisticValue !== undefined) {
                setStateValue(this.props, data.oid || '', this.optimisticValue);
            }
            return;
        }
        this.writer.flush(this.props);
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as SliderData;
        const { min, max, step } = range(data);
        const rawState = stateValue(this.state, data.oid || '');
        if (rawState !== this.seenStateValue) {
            this.seenStateValue = rawState;
            this.optimisticValue = undefined;
        }
        const current = sliderValue(this.optimisticValue ?? rawState, data);
        const orientation = data.orientation || 'horizontal';
        const visualPercent = data.reverseSlider ? 100 - current.percent : current.percent;
        const isM3 = designStyle(data as Record<string, unknown>) === 'material3';
        const before = isM3 && !m3ColorExplicit(data.colorBeforeThumb) ? 'var(--md-sys-color-primary)' : cleanColor(data.colorBeforeThumb, '#44739e');
        const thumb = isM3 && !m3ColorExplicit(data.colorThumb) ? 'var(--md-sys-color-primary)' : cleanColor(data.colorThumb, before);
        const after = isM3 && !m3ColorExplicit(data.colorAfterThumb) ? 'var(--md-sys-color-surface-container-high)' : cleanColor(data.colorAfterThumb, 'rgba(161, 161, 161, 0.26)');
        const disabled = !!data.readOnly || isWorking(stateValue(this.state, data['oid-working'] || ''));
        const showThumbLabel = data.showThumbLabel === 'yes' || data.showThumbLabel === 'always';
        // A saved project can hold a non-string here, and `.split` on it threw — which blanks the whole
        // VIS2 view, since a view renders its widgets in one tree without an error boundary.
        const tickLabels = String(data.tickLabels ?? '').split(',').map(label => label.trim());
        const tickCount = Math.max(2, boundedCount(tickLabels.filter(Boolean).length || Math.floor((max - min) / step) + 1, 2));
        const showTicks = data.showTicks === 'yes' || data.showTicks === 'always';
        const thumbClass = data.knobSize === 'knobMedium' ? ' medium-size' : data.knobSize === 'knobBig' ? ' big-size' : '';
        const valueLabel = labelFor(current.raw, current.percent, data, true);
        const thumbLabel = labelFor(current.raw, current.percent, data, !!data.useLabelRules);

        return (
            <div className={`materialdesign-widget materialdesign-slider-vertical${isM3 ? ` ${designStyleClasses(data as Record<string, unknown>, this.isDarkTheme())}` : ''}`} style={{ alignItems: 'center', display: 'flex', height: '100%', overflow: 'visible', width: '100%', ...cssVars(data) }}>
                <style>{SLIDER_CSS}</style>
                <div className="materialdesign-vuetifySlider" style={{ height: '100%', width: '100%' }}>
                    <div className="v-row" style={{ alignItems: 'center', display: 'flex', height: '100%', width: '100%' }}>
                        {data.prepandText ? (
                            <div
                                style={{
                                    color: isM3 && !m3ColorExplicit(data.prepandTextColor) ? 'var(--md-sys-color-on-surface)' : cleanColor(data.prepandTextColor, '#44739e'),
                                    flex: data.prepandTextWidth ? `0 0 ${num(data.prepandTextWidth, 0)}px` : '0 0 auto',
                                    fontFamily: data.prepandTextFontFamily || undefined,
                                    fontSize: sizeCss(data.prepandTextFontSize, 16),
                                }}
                            >
                                {data.prepandText}
                            </div>
                        ) : null}
                        <div className="v-input v-input--hide-details v-input--is-label-active v-input--is-dirty theme--light v-input__slider" style={{ flex: '1 1 auto', height: '100%', position: 'relative' }}>
                            <div className="v-input__control" style={{ height: '100%', width: '100%' }}>
                                <div className="v-input__slot" style={{ height: '100%', width: '100%' }}>
                                    <div className={`v-slider v-slider--${orientation}${disabled ? ' v-slider--disabled' : ''} theme--light`} style={{ height: '100%', position: 'relative', width: '100%' }}>
                                        <input value={current.raw} readOnly tabIndex={-1} />
                                        <div className="v-slider__track-container">
                                            <div
                                                className="v-slider__track-background"
                                                style={
                                                    orientation === 'horizontal'
                                                        ? { backgroundColor: after, borderColor: after, right: 0, width: `${100 - visualPercent}%` }
                                                        : { backgroundColor: after, borderColor: after, height: `${100 - visualPercent}%`, top: 0 }
                                                }
                                            />
                                            <div
                                                className="v-slider__track-fill"
                                                style={
                                                    orientation === 'horizontal'
                                                        ? { backgroundColor: before, borderColor: before, left: 0, right: 'auto', width: `${visualPercent}%` }
                                                        : { backgroundColor: before, borderColor: before, bottom: 0, height: `${visualPercent}%` }
                                                }
                                            />
                                        </div>
                                        {showTicks ? (
                                            <div className="v-slider__ticks-container">
                                                {Array.from({ length: tickCount }, (_, index) => {
                                                    const pos = (index * 100) / (tickCount - 1);
                                                    const filled = data.reverseSlider ? pos >= visualPercent : pos <= visualPercent;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`v-slider__tick${filled ? ' v-slider__tick--filled' : ''}`}
                                                            style={
                                                                orientation === 'horizontal'
                                                                    ? { height: num(data.tickSize, 2), left: `${pos}%`, top: 0, width: 2 }
                                                                    : { height: 2, left: 0, top: `${100 - pos}%`, width: num(data.tickSize, 2) }
                                                            }
                                                        >
                                                            {tickLabels[index] ? <span className="v-slider__tick-label">{tickLabels[index]}</span> : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                        <div
                                            aria-orientation={orientation}
                                            aria-readonly={disabled}
                                            aria-valuemax={max}
                                            aria-valuemin={min}
                                            aria-valuenow={current.raw}
                                            className={`v-slider__thumb-container${showThumbLabel ? ' v-slider__thumb-container--show-label' : ''}`}
                                            onKeyDown={event => this.writeFromKey(event, data, disabled)}
                                            role="slider"
                                            style={orientation === 'horizontal' ? { color: thumb, left: `${visualPercent}%` } : { bottom: `${visualPercent}%`, color: thumb }}
                                            tabIndex={disabled ? -1 : 0}
                                        >
                                            <div className={`v-slider__thumb${thumbClass}`} style={{ backgroundColor: thumb, borderColor: thumb }} />
                                            {showThumbLabel ? (
                                                <div className="v-slider__thumb-label-container">
                                                    <div
                                                        className="v-slider__thumb-label"
                                                        style={{
                                                            backgroundColor: cleanColor(data.thumbBackgroundColor, thumb),
                                                            borderColor: cleanColor(data.thumbBackgroundColor, thumb),
                                                            height: num(data.thumbSize, 32),
                                                            width: num(data.thumbSize, 32),
                                                        }}
                                                    >
                                                        <div>
                                                            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(thumbLabel) }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div
                                            onPointerDown={event => {
                                                feedback(data);
                                                event.currentTarget.setPointerCapture(event.pointerId);
                                                this.writeFromPointer(event, data, disabled);
                                            }}
                                            onPointerMove={event => {
                                                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                                    this.writeFromPointer(event, data, disabled);
                                                }
                                            }}
                                            onPointerUp={event => {
                                                event.stopPropagation();
                                                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                                    event.currentTarget.releasePointerCapture(event.pointerId);
                                                }
                                                this.releasePointer(data);
                                            }}
                                            onPointerCancel={event => {
                                                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                                    event.currentTarget.releasePointerCapture(event.pointerId);
                                                }
                                            }}
                                            style={{ cursor: disabled ? 'default' : 'pointer', height: '100%', inset: 0, position: 'absolute', touchAction: 'none', width: '100%', zIndex: 2 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {data.showValueLabel !== false ? (
                            <div
                                className="materialdesign-vuetifySlider-value-label"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(valueLabel) }}
                                style={{
                                    color: isM3 && !m3ColorExplicit(data.valueLabelColor) ? 'var(--md-sys-color-on-surface)' : cleanColor(data.valueLabelColor, '#44739e'),
                                    flex: `0 0 ${num(data.valueLabelWidth, 50)}px`,
                                    fontFamily: data.valueFontFamily || undefined,
                                    fontSize: sizeCss(data.valueFontSize, 16),
                                    textAlign: 'right',
                                }}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}
