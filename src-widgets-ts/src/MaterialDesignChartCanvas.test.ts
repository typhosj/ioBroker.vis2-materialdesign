import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chart } from 'chart.js';
import { describe, expect, it } from 'vitest';

import { ChartLegend, datalabelsConfig, labelColorFor, layoutConfig, tooltipConfig, tooltipNumber } from './MaterialDesignChartCanvas';

// Handing the plugin to a chart through `config.plugins` alone never merges its defaults, so the
// color default below spread over undefined and wiped the plugin's whole default set.
describe('datalabels registration', () => {
    it('keeps the plugin defaults and layers our color on top', () => {
        const defaults = Chart.defaults.plugins.datalabels as Record<string, unknown>;
        expect(defaults).toBeDefined();
        for (const key of ['display', 'formatter', 'labels', 'padding', 'clamp', 'opacity']) {
            expect(Object.keys(defaults)).toContain(key);
        }
        expect(defaults.color).toBe(labelColorFor);
    });
});

describe('datalabelsConfig', () => {
    const label = (index: number) => ({ text: `v${index}` });

    it('shows every value by default and honors the off switch', () => {
        const on = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect((on.display as (context: { dataIndex: number }) => unknown)({ dataIndex: 3 })).toBe(true);
        expect((on.formatter as (value: unknown, context: { dataIndex: number }) => string)(0, { dataIndex: 2 })).toBe('v2');
        expect(datalabelsConfig({ showValues: 'showValuesOff' }, label, { align: 'top', anchor: 'end' })).toMatchObject({ display: false });
    });

    // The contrast pick belongs to a label sitting ON the bar/slice; the bar default puts it above.
    it('only takes the element contrast color while the label sits on the element', () => {
        const context = { dataIndex: 0, dataset: { backgroundColor: ['#1b5e20'] } };
        const onBar = datalabelsConfig({}, label, { align: 'center', anchor: 'center' }) as Record<string, unknown>;
        expect((onBar.color as (context: unknown) => string)(context)).toBe('#ffffff');
        const onSlice = datalabelsConfig({}, label, { align: 'end', anchor: 'center' }) as Record<string, unknown>;
        expect((onSlice.color as (context: unknown) => string)(context)).toBe('#ffffff');
        const aboveBar = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect((aboveBar.color as (context: unknown) => string)(context)).toBe('#44739e');
        const saved = datalabelsConfig({}, () => ({ text: 'x', color: '#00696d' }), { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect((saved.color as (context: unknown) => string)(context)).toBe('#00696d');
    });

    // Upstream #68: the box behind the value. Unset must leave the plugin drawing nothing at all.
    it('passes the label box through and stays invisible while unset', () => {
        expect(datalabelsConfig({}, label, { align: 'top', anchor: 'end' })).toMatchObject({ backgroundColor: null, borderColor: null, borderRadius: 0, borderWidth: 0 });
        expect(datalabelsConfig({ valuesBackgroundColor: '#eeeeee', valuesBorderColor: '#111111', valuesBorderRadius: 4, valuesBorderWidth: 2 }, label, { align: 'top', anchor: 'end' }))
            .toMatchObject({ backgroundColor: '#eeeeee', borderColor: '#111111', borderRadius: 4, borderWidth: 2 });
    });

    it('thins the labels out with valuesSteps', () => {
        const every2 = datalabelsConfig({ valuesSteps: 2 }, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        const display = every2.display as (context: { dataIndex: number }) => unknown;
        expect(display({ dataIndex: 0 })).toBe(true);
        expect(display({ dataIndex: 1 })).toBe(false);
        expect(display({ dataIndex: 2 })).toBe(true);
    });
});

describe('layoutConfig', () => {
    it('emits only the sides the editor filled in', () => {
        expect(layoutConfig({ chartPaddingTop: 10, chartPaddingLeft: '', chartPaddingBottom: '4' })).toEqual({
            padding: { top: 10, bottom: 4 },
        });
    });

    it('stays undefined when no padding is set, so chart.js keeps its own', () => {
        expect(layoutConfig({ chartPaddingTop: '', chartPaddingLeft: null })).toBeUndefined();
    });
});

describe('tooltipConfig geometry', () => {
    it('passes the box geometry through under the chart.js v4 names', () => {
        const config = tooltipConfig({
            tooltipArrowSize: 8,
            tooltipDistanceToBar: 6,
            tooltipBoxRadius: 3,
            tooltipXpadding: 12,
            tooltipYpadding: 9,
            tooltipTitleMarginBottom: 2,
            tooltipShowColorBox: false,
        }) as Record<string, unknown>;
        // v4 folded xPadding/yPadding into one `padding`.
        expect(config).toMatchObject({
            caretSize: 8, caretPadding: 6, cornerRadius: 3, titleMarginBottom: 2,
            padding: { x: 12, y: 9 }, displayColors: false,
        });
    });

    it('leaves unset geometry out instead of overwriting the chart.js defaults', () => {
        const config = tooltipConfig({ tooltipArrowSize: '', tooltipShowColorBox: '' }) as Record<string, unknown>;
        expect('caretSize' in config).toBe(false);
        expect('padding' in config).toBe(false);
        expect('displayColors' in config).toBe(false);
    });
});

describe('tooltipNumber', () => {
    it('formats with the configured decimals, and stays out of the way without them', () => {
        expect(tooltipNumber({ tooltipValueMinDecimals: 2, tooltipValueMaxDecimals: 2 }, 3.14159))
            .toBe((3.14159).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        expect(tooltipNumber({}, 3.14159)).toBeUndefined();
        expect(tooltipNumber({ tooltipValueMaxDecimals: 1 }, 'not a number')).toBeUndefined();
    });
});

describe('ChartLegend', () => {
    const entries = [{ label: 'Kitchen', color: '#f00' }, { label: 'Hall', color: '#0f0' }];
    const html = (data: Record<string, unknown>, defaultShown?: boolean): string =>
        renderToStaticMarkup(React.createElement(ChartLegend, { data, entries, defaultShown }) as React.ReactElement);

    it('stays away unless switched on, and follows the default the chart passes', () => {
        expect(html({})).toContain('Kitchen');
        expect(html({}, false)).toBe('');
        expect(html({ showLegend: true }, false)).toContain('Kitchen');
        expect(html({ showLegend: false })).toBe('');
    });

    it('lays out along the position and takes box shape and size from the fields', () => {
        expect(html({ legendPosition: 'top' })).toContain('flex-direction:row');
        expect(html({ legendPosition: 'right' })).toContain('flex-direction:column');
        expect(html({ legendPointStyle: false })).toContain('border-radius:0');
        expect(html({ legendBoxWidth: 20 })).toContain('height:20px');
    });

    it('reads the label color from the M3 token when nothing is set', () => {
        expect(html({ designStyle: 'material3' })).toContain('var(--md-sys-color-on-surface)');
        expect(html({ designStyle: 'material3', legendFontColor: '#123456' })).toContain('#123456');
    });
});
