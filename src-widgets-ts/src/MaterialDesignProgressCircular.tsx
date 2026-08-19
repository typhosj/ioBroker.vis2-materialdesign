import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { squarePreview, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, sizeCss, stateValue, sanitizeHtml } from './widgetUtils';
import { ProgressData, cleanColor, num, progressState } from './MaterialDesignProgress';


const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            { name: 'min', label: 'min', type: 'number' },
            { name: 'max', label: 'max', type: 'number' },
            { name: 'progressIndeterminate', label: 'progressIndeterminate', type: 'checkbox' },
        ],
    },
    {
        name: 'layout',
        fields: [
            { name: 'progressCircularSize', label: 'progressCircularSize', type: 'number' },
            { name: 'progressCircularWidth', label: 'progressCircularWidth', type: 'number' },
            { name: 'progressCircularRotate', label: 'progressCircularRotate', type: 'number' },
        ],
    },
    {
        name: 'color',
        fields: [
            { name: 'colorProgressBackground', label: 'colorProgressBackground', type: 'color' },
            { name: 'colorProgress', label: 'colorProgress', type: 'color' },
            { name: 'innerColor', label: 'innerColor', type: 'color' },
            { name: 'colorOneCondition', label: 'colorOneCondition', type: 'number' },
            { name: 'colorOne', label: 'colorOne', type: 'color' },
            { name: 'colorTwoCondition', label: 'colorTwoCondition', type: 'number' },
            { name: 'colorTwo', label: 'colorTwo', type: 'color' },
        ],
    },
    {
        name: 'label',
        fields: [
            { name: 'showValueLabel', label: 'showValueLabel', type: 'checkbox', default: true },
            { name: 'valueLabelStyle', label: 'valueLabelStyle', type: 'select', options: ['progressPercent', 'progressValue', 'progressCustom'], default: 'progressPercent' },
            { name: 'valueLabelUnit', label: 'valueLabelUnit', type: 'text' },
            { name: 'valueMaxDecimals', label: 'valueMaxDecimals', type: 'number' },
            { name: 'valueLabelCustom', label: 'valueLabelCustom', type: 'html' },
            { name: 'textColor', label: 'textColor', type: 'color' },
            { name: 'textFontSize', label: 'textFontSize', type: 'number' },
            { name: 'textFontFamily', label: 'textFontFamily', type: 'fontname' },
        ],
    },
];

export function circularGeometry(
    data: Pick<ProgressData, 'progressCircularSize' | 'progressCircularWidth' | 'progressIndeterminate'>,
    percent: number,
    fallbackSize: { width?: number; height?: number },
): { size: number; stroke: number; radius: number; circumference: number; dashOffset: number } {
    const size = num(data.progressCircularSize, 0) || Math.min(num(fallbackSize.width, 70), num(fallbackSize.height, 70));
    const stroke = num(data.progressCircularWidth, 4);
    const radius = Math.max(1, size / 2 - stroke / 2);
    const circumference = 2 * Math.PI * radius;
    const dashOffset = data.progressIndeterminate ? circumference * 0.25 : circumference * (1 - percent / 100);
    return { size, stroke, radius, circumference, dashOffset };
}

export default class MaterialDesignProgressCircular extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Progress-Circular', 'Progress Circular', attrs, ['color']),
            visPrev: squarePreview('F07AF'),
            visDefaultStyle: { width: 70, height: 70 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignProgressCircular.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as ProgressData;
        const isM3 = designStyle(data as unknown as Record<string, unknown>) === 'material3';
        const value = stateValue(this.state, data.oid);
        const progress = progressState(value, data, isM3);
        const { style } = this.props as unknown as { style?: { width?: number; height?: number } };
        const { size, stroke, radius, circumference, dashOffset } = circularGeometry(data, progress.percent, style || {});

        return (
            <div className={`materialdesign-widget materialdesign-progress${isM3 ? ` ${designStyleClasses(data as unknown as Record<string, unknown>, this.isDarkTheme())}` : ''}`} style={{ height: '100%', padding: 0, width: '100%' }}>
                <div className="materialdesign-vuetify-progress-circular" style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', width: '100%' }}>
                    <div
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={progress.percent}
                        className="v-progress-circular"
                        role="progressbar"
                        style={{ height: size, position: 'relative', width: size }}
                    >
                        <svg viewBox={`0 0 ${size} ${size}`} style={{ height: '100%', transform: `rotate(${num(data.progressCircularRotate, 0)}deg)`, width: '100%' }}>
                            {/* stroke/fill via inline style, not SVG attrs: ambient legacy vuetify CSS
                                (.v-progress-circular__underlay/__overlay{stroke:...}) overrides the attribute otherwise */}
                            <circle className="v-progress-circular__underlay" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} style={{ fill: cleanColor(data.innerColor, 'transparent'), stroke: cleanColor(data.colorProgressBackground, isM3 ? 'var(--md-sys-color-surface-container-high)' : 'rgba(161, 161, 161, 0.26)') }} />
                            <circle
                                className="v-progress-circular__overlay"
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeWidth={stroke}
                                style={{ fill: 'transparent', stroke: progress.color }}
                            />
                        </svg>
                        {data.showValueLabel !== false ? (
                            <div
                                className="v-progress-circular__info"
                                style={{
                                    alignItems: 'center',
                                    color: cleanColor(data.textColor, isM3 ? 'var(--md-sys-color-on-surface)' : '#44739e'),
                                    display: 'flex',
                                    fontFamily: data.textFontFamily || undefined,
                                    fontSize: data.textFontSize ? sizeCss(data.textFontSize, 12) : 12,
                                    inset: 0,
                                    justifyContent: 'center',
                                    position: 'absolute',
                                }}
                            >
                                <div className="materialdesign-vuetify-progress-circular-value-label" dangerouslySetInnerHTML={{ __html: sanitizeHtml(progress.label) }} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }
}
