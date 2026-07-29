import { Chart } from 'chart.js';
import { describe, expect, it } from 'vitest';

import { datalabelsConfig, labelColorFor } from './MaterialDesignChartCanvas';

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
