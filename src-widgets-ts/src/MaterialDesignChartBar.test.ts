import { describe, expect, it } from 'vitest';
import MaterialDesignChartBar, { barAxisRange, json } from './MaterialDesignChartBar';
import { chartConfig } from './MaterialDesignChartCanvas';

const fixture = <T>(value: unknown): T => value as T;
const spec = (data: Record<string, unknown>, values: Record<string, unknown> = {}) =>
    new MaterialDesignChartBar(fixture<ConstructorParameters<typeof MaterialDesignChartBar>[0]>({ context: {} })).chartSpec(data, oid => values[String(oid)] as ioBroker.StateValue);
const config = (data: Record<string, unknown>, values: Record<string, unknown> = {}, isM3 = false) => chartConfig(spec(data, values), data, { isM3, isDark: false });
const dot = (text: string): string => text.replace(',', '.');
type Labels = { formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string };
type Callbacks = { title: (items: object[]) => unknown; label: (item: object) => unknown };

describe('json', () => {
    it('parses a JSON array and rejects everything else', () => {
        expect(json('[{"a":1}]')).toEqual([{ a: 1 }]);
        expect(json('{"a":1}')).toBeNull();
        expect(json('not json')).toBeNull();
        expect(json(undefined)).toBeNull();
    });
});

describe('bar chartSpec', () => {
    it('reads value, label and explicit colour from the editor rows', () => {
        const result = spec({ dataCount: 2, oid0: 'a', label0: 'Room A', dataColor0: '#ff0000', oid1: 'b' }, { a: 42, b: 7 });
        expect(result.labels).toEqual(['Room A', '']);
        expect(result.datasets[0].values).toEqual([42, 7]);
        expect(result.datasets[0].colors).toEqual(['#ff0000', undefined]);
    });

    it('prefers JSON source rows and caps their number', () => {
        const source = JSON.stringify(Array.from({ length: 999 }, (_v, i) => ({ label: `r${i}`, value: i })));
        const result = spec({ chartDataMethod: 'jsonStringObject', oid: 'j', label0: 'ignored' }, { j: source });
        expect(result.labels?.[0]).toBe('r0');
        expect(result.labels!.length).toBeLessThan(999);
    });

    it('lays the bars horizontally on request', () => {
        expect(spec({ chartType: 'horizontal' }).options).toMatchObject({ indexAxis: 'y' });
        expect(spec({}).options).toMatchObject({ indexAxis: 'x' });
    });

    it('scales the value axis from the data unless min/max are set', () => {
        const scales = spec({ dataCount: 2, oid0: 'a', oid1: 'b' }, { a: -5, b: 10 }).scales as Record<string, { min: number; max: number }>;
        expect(scales.y).toMatchObject({ min: -5, max: 10 });
    });
});

describe('barAxisRange', () => {
    it('derives min/max from the values when axisValueMin/Max are unset', () => {
        expect(barAxisRange({}, [-5, 10])).toEqual({ min: -5, max: 10 });
    });
    it('never lets the auto max drop below 1', () => {
        expect(barAxisRange({}, [0]).max).toBe(1);
    });
    it('prefers explicit axisValueMin/Max over the computed range', () => {
        expect(barAxisRange({ axisValueMin: -100, axisValueMax: 100 }, [50])).toEqual({ min: -100, max: 100 });
    });
    it('treats a null or empty axisValueMax as unset (auto-scale), not as 1', () => {
        expect(barAxisRange({ axisValueMin: null, axisValueMax: null }, [5, 30])).toEqual({ min: 0, max: 30 });
        expect(barAxisRange({ axisValueMin: '', axisValueMax: '' }, [5, 30])).toEqual({ min: 0, max: 30 });
    });
});

describe('bar labels and tooltip', () => {
    it.each([
        [{}, '3'],
        [{ valuesMinDecimals: 2, valuesMaxDecimals: 2 }, '3.00'],
        [{ valuesMinDecimals: 2 }, '3.00'],
    ])('formats value labels with %o as %s', (decimals, expected) => {
        const labels = config({ dataCount: 1, oid0: 'a', ...decimals }, { a: 3 }).options.plugins.datalabels as Labels;
        expect(dot(labels.formatter(0, { datasetIndex: 0, dataIndex: 0 }))).toBe(expected);
    });

    it('lets an explicit value text win in label and tooltip', () => {
        const result = config({ dataCount: 1, oid0: 'a', valueText0: 'high', labelValueAppend0: '!' }, { a: 3 });
        expect((result.options.plugins.datalabels as Labels).formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('high!');
        expect((result.options.plugins.tooltip.callbacks as Callbacks).label({ datasetIndex: 0, dataIndex: 0 })).toBe('high!');
    });

    it('titles the tooltip with the bar label and prints the number with at most two decimals', () => {
        const callbacks = config({ dataCount: 1, oid0: 'a', label0: 'Room A', tooltipBodyAppend: ' W' }, { a: 3.14159 }).options.plugins.tooltip.callbacks as Callbacks;
        expect(callbacks.title([{ datasetIndex: 0, dataIndex: 0 }])).toBe('Room A');
        expect(dot(String(callbacks.label({ datasetIndex: 0, dataIndex: 0 })))).toBe('3.14 W');
    });

    it('fills the bars and the legend from the same colours in M3', () => {
        const result = config({ dataCount: 1, oid0: 'a', showLegend: true }, { a: 3 }, true);
        expect(result.data.datasets[0].backgroundColor).toEqual(['#6750a4']);
        expect(result.legend[0].color).toBe('#6750a4');
    });
});

describe('bar tooltip line breaks', () => {
    it('splits on the typed backslash-n sequence, not on a real newline', () => {
        const callbacks = config({ dataCount: 1, oid0: 'a', tooltipTitle0: 'a\\nb', tooltipText0: 'x\\ny' }, { a: 3 }).options.plugins.tooltip.callbacks as Callbacks;
        expect(callbacks.title([{ datasetIndex: 0, dataIndex: 0 }])).toEqual(['a', 'b']);
        expect(callbacks.label({ datasetIndex: 0, dataIndex: 0 })).toEqual(['x', 'y']);
    });
});
