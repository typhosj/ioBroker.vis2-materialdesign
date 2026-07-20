import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { squarePreview, RenderProps, VisWidget, createInfo, sizeCss, stateValue, sanitizeHtml } from './widgetUtils';
import { ProgressData, cleanColor, num, progressState } from './MaterialDesignProgress';


const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            { name: 'min', label: 'min', type: 'number' },
            { name: 'max', label: 'max', type: 'number' },
            { name: 'progressIndeterminate', label: 'progressIndeterminate', type: 'checkbox' },
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
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

export default class MaterialDesignProgressCircular extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Progress-Circular', 'Progress Circular', attrs),
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
        const value = stateValue(this.state as VisRxWidgetState, data.oid);
        const progress = progressState(value, data);
        const size = num(data.progressCircularSize, 0) || Math.min(num((this.props as unknown as { style?: { width?: number; height?: number } }).style?.width, 70), num((this.props as unknown as { style?: { width?: number; height?: number } }).style?.height, 70));
        const stroke = num(data.progressCircularWidth, 4);
        const radius = Math.max(1, size / 2 - stroke / 2);
        const circumference = 2 * Math.PI * radius;
        const dashOffset = data.progressIndeterminate ? circumference * 0.25 : circumference * (1 - progress.percent / 100);

        return (
            <div className="materialdesign-widget materialdesign-progress" style={{ height: '100%', padding: 0, width: '100%' }}>
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
                            <circle className="v-progress-circular__underlay" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} style={{ fill: cleanColor(data.innerColor, 'transparent'), stroke: cleanColor(data.colorProgressBackground, 'rgba(161, 161, 161, 0.26)') }} />
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
                                    color: cleanColor(data.textColor, '#44739e'),
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
