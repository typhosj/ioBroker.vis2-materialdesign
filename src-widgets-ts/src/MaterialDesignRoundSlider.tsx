import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { cleanColor, num, snapToStep } from './MaterialDesignProgress';
import { squarePreview, RenderProps, VisWidget, createInfo, setStateValue, sizeCss, stateValue } from './widgetUtils';

export interface RoundSliderData {
    oid?: string;
    'oid-working'?: string;
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
    startAngle?: number;
    arcLength?: number;
    sliderWidth?: number;
    handleSize?: number;
    handleZoom?: number;
    rtl?: boolean;
    vibrateOnMobilDevices?: number;
    clickSoundPlay?: boolean;
    clickSoundVolume?: number;
    colorSliderBg?: string;
    colorBeforeThumb?: string;
    colorThumb?: string;
    colorAfterThumb?: string;
    valueLabelColor?: string;
    showValueLabel?: boolean;
    valueLabelVerticalPosition?: number;
    valueLabelStyle?: 'sliderPercent' | 'sliderValue';
    valueLabelUnit?: string;
    valueFontFamily?: string;
    valueFontSize?: number;
    valueLabelMin?: string;
    valueLabelMax?: string;
    valueLessThan?: number;
    textForValueLessThan?: string;
    valueGreaterThan?: number;
    textForValueGreaterThan?: string;
    generateHtmlControl?: boolean;
    debug?: boolean;
}


const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            { name: 'oid-working', label: 'oid-working', type: 'id' },
            { name: 'min', label: 'min', type: 'number' },
            { name: 'max', label: 'max', type: 'number' },
            { name: 'step', label: 'step', type: 'number', default: 1 },
            { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
            { name: 'startAngle', label: 'startAngle', type: 'slider', min: 0, max: 360, step: 1, default: 135 },
            { name: 'arcLength', label: 'arcLength', type: 'slider', min: 0, max: 360, step: 1, default: 270 },
            { name: 'sliderWidth', label: 'sliderWidth', type: 'number' },
            { name: 'handleSize', label: 'handleSize', type: 'number' },
            { name: 'handleZoom', label: 'handleZoom', type: 'slider', min: 0, max: 10, step: 0.1, default: 1.5 },
            { name: 'rtl', label: 'rtl', type: 'checkbox' },
            { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 },
            { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' },
            { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 },
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
        ],
    },
    {
        name: 'color',
        label: 'group_color',
        fields: [
            { name: 'colorSliderBg', label: 'colorSliderBg', type: 'color' },
            { name: 'colorBeforeThumb', label: 'colorBeforeThumb', type: 'color' },
            { name: 'colorThumb', label: 'colorThumb', type: 'color' },
            { name: 'colorAfterThumb', label: 'colorAfterThumb', type: 'color' },
            { name: 'valueLabelColor', label: 'valueLabelColor', type: 'color' },
        ],
    },
    {
        name: 'label',
        label: 'group_label',
        fields: [
            { name: 'showValueLabel', label: 'showValueLabel', type: 'checkbox', default: true },
            { name: 'valueLabelVerticalPosition', label: 'valueLabelVerticalPosition', type: 'slider', min: 0, max: 100, step: 1 },
            { name: 'valueLabelStyle', label: 'valueLabelStyle', type: 'select', options: ['sliderPercent', 'sliderValue'], default: 'sliderValue' },
            { name: 'valueLabelUnit', label: 'valueLabelUnit', type: 'text' },
            { name: 'valueFontFamily', label: 'valueFontFamily', type: 'fontname' },
            { name: 'valueFontSize', label: 'valueFontSize', type: 'number' },
            { name: 'valueLabelMin', label: 'valueLabelMin', type: 'html' },
            { name: 'valueLabelMax', label: 'valueLabelMax', type: 'html' },
            { name: 'valueLessThan', label: 'valueLessThan', type: 'number' },
            { name: 'textForValueLessThan', label: 'textForValueLessThan', type: 'html' },
            { name: 'valueGreaterThan', label: 'valueGreaterThan', type: 'number' },
            { name: 'textForValueGreaterThan', label: 'textForValueGreaterThan', type: 'html' },
        ],
    },
];

function range(data: RoundSliderData): { min: number; max: number; step: number } {
    const min = num(data.min, 0);
    const max = num(data.max, 100);
    return { min, max: max === min ? min + 100 : max, step: num(data.step, 1) || 1 };
}

function current(value: ioBroker.StateValue | undefined, data: RoundSliderData): { raw: number; percent: number } {
    const { min, max } = range(data);
    const raw = Math.min(max, Math.max(min, num(value, min)));
    return { raw, percent: ((raw - min) * 100) / (max - min) };
}

function label(raw: number, percent: number, data: RoundSliderData): string {
    const { min, max } = range(data);
    if (raw <= min && data.valueLabelMin) {
        return data.valueLabelMin;
    }
    if (data.valueLessThan !== undefined && raw > min && raw <= num(data.valueLessThan, min) && data.textForValueLessThan) {
        return data.textForValueLessThan;
    }
    if (data.valueGreaterThan !== undefined && raw >= num(data.valueGreaterThan, max) && raw < max && data.textForValueGreaterThan) {
        return data.textForValueGreaterThan;
    }
    if (raw >= max && data.valueLabelMax) {
        return data.valueLabelMax;
    }
    return data.valueLabelStyle === 'sliderPercent' ? `${Math.floor(percent)} %` : `${raw} ${data.valueLabelUnit || ''}`;
}

function working(value: ioBroker.StateValue | undefined): boolean {
    return !(value === undefined || value === null || value === '' || value === false || value === 'false');
}

function polar(angle: number, radius: number): { x: number; y: number } {
    // Angle measured clockwise from 3 o'clock (positive x), matching the old round-slider webcomponent
    // (`_angle2xy = {x: cos, y: sin}`) so startAngle/arcLength orient identically (default 135/270 → gap at bottom).
    const rad = (angle * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

function arcPath(start: number, length: number, radius: number): string {
    const end = start + length;
    const from = polar(start, radius);
    const to = polar(end, radius);
    const large = Math.abs(length) > 180 ? 1 : 0;
    const sweep = length >= 0 ? 1 : 0;
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} ${sweep} ${to.x} ${to.y}`;
}

function feedback(data: RoundSliderData): void {
    const vibrate = num(data.vibrateOnMobilDevices, 0);
    if (vibrate > 0 && navigator.vibrate) {
        navigator.vibrate(vibrate);
    }
    if (data.clickSoundPlay) {
        const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3');
        audio.volume = Math.max(0, Math.min(1, num(data.clickSoundVolume, 0.5)));
        void audio.play().catch(() => undefined);
    }
}

export default class MaterialDesignRoundSlider extends VisWidget {
    private optimisticValue: number | undefined;
    private seenStateValue: ioBroker.StateValue | undefined;

    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Slider-Round', 'Slider Round', attrs),
            visPrev: squarePreview('F04C5'),
            visDefaultStyle: { width: 100, height: 100 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignRoundSlider.getWidgetInfo();
    }

    private pointerValue(event: React.PointerEvent<SVGSVGElement>, data: RoundSliderData): number {
        const box = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - box.left - box.width / 2;
        const y = event.clientY - box.top - box.height / 2;
        const start = num(data.startAngle, 135);
        const arc = Math.max(1, num(data.arcLength, 270));
        // atan2 is clockwise from 3 o'clock (positive x, y down) — same frame as polar() above.
        let angle = (Math.atan2(y, x) * 180) / Math.PI;
        if (angle < 0) {
            angle += 360;
        }
        let delta = (angle - start + 360) % 360;
        delta = Math.min(arc, Math.max(0, delta));
        const pct = data.rtl ? 1 - delta / arc : delta / arc;
        const { min, max, step } = range(data);
        const stepped = snapToStep(min + pct * (max - min), step);
        return Math.min(max, Math.max(min, stepped));
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as RoundSliderData;
        const { min, max } = range(data);
        const rawState = stateValue(this.state as VisRxWidgetState, data.oid || '');
        if (rawState !== this.seenStateValue) {
            this.seenStateValue = rawState;
            this.optimisticValue = undefined;
        }
        const value = current(this.optimisticValue ?? rawState, data);
        const disabled = !!data.readOnly || working(stateValue(this.state as VisRxWidgetState, data['oid-working'] || ''));
        const start = num(data.startAngle, 135);
        const arc = num(data.arcLength, 270);
        const sliderWidth = num(data.sliderWidth, 3);
        const handleSize = num(data.handleSize, 6) * num(data.handleZoom, 1.5);
        const radius = 50 - Math.max(sliderWidth, handleSize) / 2;
        const progress = (data.rtl ? 100 - value.percent : value.percent) / 100;
        const progressArc = arc * progress;
        const handle = polar(start + progressArc, radius);
        const pathColor = cleanColor(data.colorAfterThumb, 'rgba(161, 161, 161, 0.26)');
        const barColor = cleanColor(data.colorBeforeThumb, '#44739e');
        const handleColor = cleanColor(data.colorThumb, barColor);

        const write = (event: React.PointerEvent<SVGSVGElement>): void => {
            if (!disabled) {
                event.preventDefault();
                event.stopPropagation();
                const next = this.pointerValue(event, data);
                this.optimisticValue = next;
                setStateValue(this.props, data.oid || '', next);
                this.forceUpdate();
            }
        };

        return (
            <div className="materialdesign-widget materialdesign-slider-round" style={{ height: '100%', position: 'relative', width: '100%' }}>
                <svg
                    className="materialdesign-round-slider-element"
                    max={max}
                    min={min}
                    onPointerDown={event => {
                        feedback(data);
                        event.currentTarget.setPointerCapture(event.pointerId);
                        write(event);
                    }}
                    onPointerMove={event => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            write(event);
                        }
                    }}
                    onPointerUp={event => {
                        event.stopPropagation();
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                    }}
                    onPointerCancel={event => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                    }}
                    style={
                        {
                            '--round-slider-bar-color': barColor,
                            '--round-slider-handle-color': handleColor,
                            '--round-slider-path-color': pathColor,
                            '--round-slider-path-width': sliderWidth,
                            background: cleanColor(data.colorSliderBg, 'transparent'),
                            cursor: disabled ? 'default' : 'pointer',
                            height: '100%',
                            touchAction: 'none',
                            width: '100%',
                        } as React.CSSProperties
                    }
                    value={value.raw}
                    viewBox="0 0 100 100"
                >
                    <path d={arcPath(start, arc, radius)} fill="none" stroke={pathColor} strokeLinecap="butt" strokeWidth={sliderWidth} />
                    {progressArc ? <path d={arcPath(start, progressArc, radius)} fill="none" stroke={barColor} strokeLinecap="butt" strokeWidth={sliderWidth} /> : null}
                    <circle cx={handle.x} cy={handle.y} fill={handleColor} r={handleSize / 2} />
                </svg>
                {data.showValueLabel !== false ? (
                    <label
                        className="labelValue"
                        dangerouslySetInnerHTML={{ __html: label(value.raw, value.percent, data) }}
                        style={{
                            color: cleanColor(data.valueLabelColor, '#44739e'),
                            display: 'flex',
                            fontFamily: data.valueFontFamily || undefined,
                            fontSize: data.valueFontSize ? sizeCss(data.valueFontSize, 16) : 16,
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            position: 'absolute',
                            textAlign: 'center',
                            top: `${num(data.valueLabelVerticalPosition, 45)}%`,
                            width: '100%',
                        }}
                    />
                ) : null}
            </div>
        );
    }
}
