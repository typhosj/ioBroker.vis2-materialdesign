import { describe, expect, it } from 'vitest';
import MaterialDesignChartJson, { chartJsonInput, distinctAxisGraphs, graphAxisId, jsonChartValue } from './MaterialDesignChartJson';
import { chartConfig } from './MaterialDesignChartCanvas';

describe('MaterialDesignChartJson gaps', () => {
    it('keeps missing values distinct from numeric zero', () => {
        expect([null, undefined, '', 0, '0', 2.5, { y: null }, { y: 3 }].map(jsonChartValue))
            .toEqual([null, null, null, 0, 0, 2.5, null, 3]);
    });
});

describe('chartJsonInput', () => {
    it('treats a missing or empty state as empty data, not as an error', () => {
        expect(chartJsonInput(undefined)).toEqual({});
        expect(chartJsonInput(null)).toEqual({});
        expect(chartJsonInput('')).toEqual({});
    });

    it('returns null only for a string that really is broken', () => {
        expect(chartJsonInput('{broken')).toBeNull();
    });

    it('parses a chart payload', () => {
        expect(chartJsonInput('{"axisLabels":["a"],"graphs":[{"data":[1]}]}'))
            .toEqual({ axisLabels: ['a'], graphs: [{ data: [1] }] });
    });
});

describe('graphAxisId', () => {
    it('defaults to yAxis_id 0 when unset', () => {
        expect(graphAxisId({})).toBe('yAxis_id_0');
    });
    it('uses the graph-specific yAxis_id when set', () => {
        expect(graphAxisId({ yAxis_id: 2 } as Record<string, unknown>)).toBe('yAxis_id_2');
    });
});

describe('distinctAxisGraphs', () => {
    it('keeps only the first graph per distinct axis id', () => {
        const graphs = [{ yAxis_id: 0 }, { yAxis_id: 1 }, { yAxis_id: 0 }] as Record<string, unknown>[];
        expect(distinctAxisGraphs(graphs)).toEqual([graphs[0], graphs[1]]);
    });
    it('collapses graphs with no explicit yAxis_id onto the shared default axis', () => {
        const graphs = [{}, {}, {}];
        expect(distinctAxisGraphs(graphs)).toHaveLength(1); // all default to yAxis_id_0
    });
});

const fixture = <T>(value: unknown): T => value as T;
const spec = (data: Record<string, unknown>, payload: unknown) =>
    new MaterialDesignChartJson(fixture<ConstructorParameters<typeof MaterialDesignChartJson>[0]>({ context: {} })).chartSpec({ oid: 'j', ...data }, oid => (oid === 'j' ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined));
const config = (data: Record<string, unknown>, payload: unknown, isM3 = false) => chartConfig(spec(data, payload), { oid: 'j', ...data }, { isM3, isDark: false });
const dot = (text: string): string => text.replace(',', '.');
type Labels = { display: unknown; formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string };

describe('json chartSpec', () => {
    const payload = { axisLabels: ['a', 'b'], graphs: [{ legendText: 'first', data: [1, 2], color: '#ff0000' }, { legendText: 'second', data: [10, { y: 20 }], type: 'line', yAxis_id: 1 }] };

    it('turns each graph into one dataset with its explicit colour', () => {
        const result = spec({}, payload);
        expect(result.colorBy).toBe('dataset');
        expect(result.labels).toEqual(['a', 'b']);
        expect(result.datasets.map(d => [d.label, d.values, d.colors])).toEqual([['first', [1, 2], ['#ff0000']], ['second', [10, 20], [undefined]]]);
    });

    it('reports a broken payload as an error and treats an empty one as no data', () => {
        expect(spec({}, '{broken').error).toBe('Error in JSON string');
        expect(spec({}, '').error).toBeUndefined();
        expect(spec({}, '').datasets).toEqual([]);
    });

    it('builds one y axis per distinct axis id and puts each dataset on it', () => {
        const result = config({}, payload);
        expect(Object.keys(result.options.scales)).toEqual(['x', 'yAxis_id_0', 'yAxis_id_1']);
        expect(result.data.datasets.map(d => d.yAxisID)).toEqual(['yAxis_id_0', 'yAxis_id_1']);
        expect(result.data.datasets[1].type).toBe('line');
    });

    // Regression: the legend took the graph colour without the M3 default its dataset used.
    it('draws the legend in the dataset colour in M3', () => {
        const result = config({}, { graphs: [{ legendText: 'only', data: [1] }] }, true);
        expect(result.data.datasets[0].borderColor).toBe('#6750a4');
        expect(result.legend).toEqual([{ label: 'only', color: '#6750a4' }]);
    });

    it('fills a line graph with its fill colour or a tint of its line colour', () => {
        const tinted = config({}, { graphs: [{ data: [1], color: '#00aa00', line_UseFillColor: true }] });
        expect(tinted.data.datasets[0]).toMatchObject({ borderColor: '#00aa00', backgroundColor: '#00aa0033', fill: true });
        const own = config({}, { graphs: [{ data: [1], line_UseFillColor: true, line_FillColor: '#111111' }] });
        expect(own.data.datasets[0].backgroundColor).toBe('#111111');
    });

    it('keeps value labels off until the option is set, and labels nothing for a gap', () => {
        expect((config({}, payload).options.plugins.datalabels as Labels).display).toBe(false);
        const labels = config({ showValues: 'showValuesOn', valuesMinDecimals: 2, valuesAppendText: ' kWh' }, { graphs: [{ data: [null, 1] }] }).options.plugins.datalabels as Labels;
        expect(labels.formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('');
        expect(dot(labels.formatter(0, { datasetIndex: 0, dataIndex: 1 }))).toBe('1.00 kWh');
    });

    it('prints "<graph>: <value>" in the tooltip with at most two decimals', () => {
        const callbacks = config({}, { graphs: [{ legendText: 'first', data: [1.23456] }] }).options.plugins.tooltip.callbacks as { label: (item: object) => unknown };
        expect(dot(String(callbacks.label({ datasetIndex: 0, dataIndex: 0 })))).toBe('first: 1.23');
    });
});
