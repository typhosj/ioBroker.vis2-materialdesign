import { describe, expect, it } from 'vitest';

import { chartAxis } from './chartAxis';

describe('chartAxis', () => {
    it('keeps chart.js defaults when no option is configured', () => {
        expect(chartAxis({})).toEqual({});
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
            zeroLineColor: '#444',
            zeroLineWidth: 3,
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
                tickMarkLength: 0, zeroLineColor: '#444', zeroLineWidth: 3,
            },
            scaleLabel: {
                display: true, labelString: 'Temperature', fontColor: '#222',
                fontFamily: 'Jura', fontSize: 14,
            },
        });
    });

    it('does not emit empty strings or false numeric shortcuts', () => {
        expect(chartAxis({ id: '', labelFontSize: 0, gridWidth: 0, title: '' })).toEqual({});
    });
});
