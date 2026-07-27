import { Chart } from 'chart.js';
import { describe, expect, it } from 'vitest';

import { datalabelsConfig, labelColorFor } from './MaterialDesignChartCanvas';

// The plugin used to be handed to each chart through `config.plugins` only, which never merges its
// defaults into `Chart.defaults.plugins.datalabels` — so the color default below spread over an
// undefined object and wiped the plugin's whole default set. No chart drew a value label.
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

    // The contrast pick belongs to a label that sits ON the bar/slice. The bar chart's default align
    // ("top") puts it above the bar, where "readable on the bar" meant white on the white chart.
    it('only takes the element contrast color while the label sits on the element', () => {
        const context = { dataIndex: 0, dataset: { backgroundColor: ['#1b5e20'] } };
        const onBar = datalabelsConfig({}, label, { align: 'center', anchor: 'center' }) as Record<string, unknown>;
        expect((onBar.color as (context: unknown) => string)(context)).toBe('#ffffff');
        // Pie's default: anchored in the middle of the slice, align only pushes it along the radius.
        const onSlice = datalabelsConfig({}, label, { align: 'end', anchor: 'center' }) as Record<string, unknown>;
        expect((onSlice.color as (context: unknown) => string)(context)).toBe('#ffffff');
        // Bar's default: above the bar, on the chart background.
        const aboveBar = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect((aboveBar.color as (context: unknown) => string)(context)).toBe('#44739e');
        // A saved per-item color still wins in both places.
        const saved = datalabelsConfig({}, () => ({ text: 'x', color: '#00696d' }), { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect((saved.color as (context: unknown) => string)(context)).toBe('#00696d');
    });

    it('thins the labels out with valuesSteps', () => {
        const every2 = datalabelsConfig({ valuesSteps: 2 }, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        const display = every2.display as (context: { dataIndex: number }) => unknown;
        expect(display({ dataIndex: 0 })).toBe(true);
        expect(display({ dataIndex: 1 })).toBe(false);
        expect(display({ dataIndex: 2 })).toBe(true);
    });
});
