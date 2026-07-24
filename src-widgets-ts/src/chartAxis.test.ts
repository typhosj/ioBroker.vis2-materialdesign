import { describe, expect, it } from 'vitest';

import { chartAxis } from './chartAxis';

describe('chartAxis', () => {
    it('keeps chart.js defaults when no option is configured', () => {
        expect(chartAxis({})).toEqual({});
    });

    it('maps configured axis, tick, grid and title options to the v4 scale shape', () => {
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
            // id is not emitted in v4 (the scales object key carries it); min/max moved to scale level.
            type: 'linear', position: 'right', display: false, stacked: true, min: 0, max: 100,
            time: { tooltipFormat: 'lll' },
            ticks: {
                display: false, color: '#111', font: { family: 'Roboto', size: 12 },
                padding: 0, stepSize: 5,
            },
            grid: {
                display: false, color: '#333', lineWidth: 2, drawTicks: false, tickLength: 0,
            },
            title: {
                display: true, text: 'Temperature', color: '#222', font: { family: 'Jura', size: 14 },
            },
        });
    });

    it('does not emit empty strings or false numeric shortcuts', () => {
        expect(chartAxis({ id: '', labelFontSize: 0, gridWidth: 0, title: '' })).toEqual({});
    });
});
