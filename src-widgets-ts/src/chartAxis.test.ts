import { describe, expect, it } from 'vitest';

import { chartAxis } from './chartAxis';

describe('chartAxis', () => {
    it('keeps chart.js defaults when no option is configured', () => {
        expect(chartAxis({})).toEqual({ ticks: { fontColor: '#44739e' } });
    });

    it('maps configured axis, tick, grid and title options', () => {
        expect(chartAxis({
            id: 'temperature',
            type: 'linear',
            position: 'right',
            display: false,
            stacked: true,
            labelsDisplay: false,
            labelColor: '#111',
            labelFontFamily: 'Roboto',
            labelFontSize: 12,
            labelPadding: 0,
            min: 0,
            max: 100,
            stepSize: 5,
            title: 'Temperature',
            titleColor: '#222',
            titleFontFamily: 'Jura',
            titleFontSize: 14,
            gridDisplay: false,
            gridColor: '#333',
            gridWidth: 2,
            drawTicks: false,
            tickLength: 0,
            time: { tooltipFormat: 'lll' },
        })).toEqual({
            id: 'temperature', type: 'linear', position: 'right', display: false, stacked: true,
            time: { tooltipFormat: 'lll' },
            ticks: {
                display: false, fontColor: '#111', fontFamily: 'Roboto', fontSize: 12,
                padding: 0, min: 0, max: 100, stepSize: 5,
            },
            gridLines: {
                display: false, color: '#333', lineWidth: 2, drawTicks: false,
                tickMarkLength: 0,
            },
            scaleLabel: {
                display: true, labelString: 'Temperature', fontColor: '#222',
                fontFamily: 'Jura', fontSize: 14,
            },
        });
    });

    it('does not emit empty strings or false numeric shortcuts', () => {
        // The tick color is always emitted: it replaces the chart.js default that used to be set globally.
        expect(chartAxis({ id: '', labelFontSize: 0, gridWidth: 0, title: '' })).toEqual({ ticks: { fontColor: '#44739e' } });
    });

    it('carries label skipping, rotation, tick limit and the bar thickness', () => {
        const callback = (value: unknown): string => `${String(value)} kWh`;
        expect(chartAxis({
            autoSkip: true,
            minRotation: 30,
            maxRotation: 60,
            maxTicksLimit: 8,
            tickCallback: callback,
            offset: true,
            offsetGridLines: false,
            barPercentage: 0.8,
        })).toEqual({
            offset: true,
            barPercentage: 0.8,
            ticks: { fontColor: '#44739e', autoSkip: true, minRotation: 30, maxRotation: 60, maxTicksLimit: 8, callback },
            gridLines: { offsetGridLines: false },
        });
    });
});
