import { describe, expect, it } from 'vitest';
import { chartJsonInput, distinctAxisGraphs, graphAxisId, graphColor, jsonChartSegments, jsonChartValue, jsonDatalabels, jsonLabelText } from './MaterialDesignChartJson';

describe('MaterialDesignChartJson gaps', () => {
    it('keeps missing values distinct from numeric zero', () => {
        expect([null, undefined, '', 0, '0', 2.5, { y: null }, { y: 3 }].map(jsonChartValue))
            .toEqual([null, null, null, 0, 0, 2.5, null, 3]);
    });

    it('splits at null only when spanGaps is disabled', () => {
        const points = ['a', null, 'b', 'c', null, 'd'];
        expect(jsonChartSegments(points, false)).toEqual([['a'], ['b', 'c'], ['d']]);
        expect(jsonChartSegments(points, true)).toEqual([['a', 'b', 'c', 'd']]);
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

describe('graphColor', () => {
    it('prefers the graph explicit color', () => {
        expect(graphColor({ color: '#ff0000' }, 0, ['#123456'], undefined)).toBe('#ff0000');
    });
    it('falls back to the palette entry for the graph index', () => {
        expect(graphColor({}, 1, ['#111111', '#222222'], undefined)).toBe('#222222');
    });
    it('falls back to globalColor, then the default blue, when no palette entry exists', () => {
        expect(graphColor({}, 0, [], '#abcdef')).toBe('#abcdef');
        expect(graphColor({}, 0, [], undefined)).toBe('#44739e');
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

describe('jsonLabelText', () => {
    it('leaves a missing value unlabelled instead of printing a zero', () => {
        expect(jsonLabelText({}, null)).toBe('');
    });

    // The decimal separator comes from the runtime locale; the test must not pin it.
    const dot = (text: string): string => text.replace(',', '.');

    it('appends the unit and honours the decimal options', () => {
        expect(dot(jsonLabelText({ valuesMaxDecimals: 1, valuesAppendText: ' kWh' }, 13.5))).toBe('13.5 kWh');
        expect(dot(jsonLabelText({ valuesMaxDecimals: 2 }, 0.09))).toBe('0.09');
        expect(jsonLabelText({}, 13.5)).toBe('14'); // without options Intl rounds to whole numbers
    });

    // Intl throws when min > max, and the editor stores a min without a max readily enough.
    it('survives a minimum without a maximum', () => {
        expect(() => jsonLabelText({ valuesMinDecimals: 2 }, 1)).not.toThrow();
        expect(dot(jsonLabelText({ valuesMinDecimals: 2 }, 1))).toBe('1.00');
    });
});

describe('jsonDatalabels', () => {
    const graphs = [{ data: [1, 2] }, { data: [10, 20] }];

    it('draws no label until the option is set', () => {
        expect(jsonDatalabels({}, graphs)).toMatchObject({ display: false });
        expect(jsonDatalabels({ showValues: 'showValuesOn' }, graphs)).not.toMatchObject({ display: false });
    });

    it('reads the value off the dataset the label belongs to', () => {
        const config = jsonDatalabels({ showValues: 'showValuesOn' }, graphs) as {
            formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string;
        };
        expect(config.formatter(0, { datasetIndex: 1, dataIndex: 1 })).toBe('20');
        expect(config.formatter(0, { datasetIndex: 0, dataIndex: 1 })).toBe('2');
    });
});
