import { describe, expect, it } from 'vitest';
import MaterialDesignChartPie, { readJson } from './MaterialDesignChartPie';
import { chartConfig, datalabelsConfig, labelColorFor } from './MaterialDesignChartCanvas';

const fixture = <T>(value: unknown): T => value as T;
const pie = (): MaterialDesignChartPie => new MaterialDesignChartPie(fixture<ConstructorParameters<typeof MaterialDesignChartPie>[0]>({ context: {} }));
const spec = (data: Record<string, unknown>, values: Record<string, unknown> = {}) => pie().chartSpec(data, oid => values[String(oid)] as ioBroker.StateValue);
const config = (data: Record<string, unknown>, values: Record<string, unknown> = {}) => chartConfig(spec(data, values), data, { isM3: false, isDark: false });

describe('readJson', () => {
    it('parses a JSON array', () => {
        expect(readJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    });
    it('returns null for a JSON object (not an array)', () => {
        expect(readJson('{"a":1}')).toBeNull();
    });
    it('returns null for invalid JSON', () => {
        expect(readJson('not json')).toBeNull();
        expect(readJson(undefined)).toBeNull();
    });
});

describe('pie chartSpec', () => {
    it('reads value, label and explicit colour from the editor rows', () => {
        const result = spec({ dataCount: 2, oid0: 'a', label0: 'Living Room', dataColor0: '#ff0000', oid1: 'b', label1: 'Kitchen' }, { a: 5, b: 3 });
        expect(result.labels).toEqual(['Living Room', 'Kitchen']);
        expect(result.datasets[0].values).toEqual([5, 3]);
        expect(result.datasets[0].colors).toEqual(['#ff0000', undefined]);
        expect(result.colorBy).toBe('item');
    });

    it('prefers the JSON source and caps negative slices at zero', () => {
        const source = JSON.stringify([{ label: 'From JSON', value: -10, dataColor: '#00ff00' }]);
        const result = spec({ chartDataMethod: 'jsonStringObject', oid: 'j', label0: 'ignored' }, { j: source });
        expect(result.labels).toEqual(['From JSON']);
        expect(result.datasets[0].values).toEqual([0]);
        expect(result.datasets[0].colors).toEqual(['#00ff00']);
    });

    it('takes one row when nothing is configured', () => {
        expect(spec({}).labels).toHaveLength(1);
    });

    it('centres doughnut labels in the ring and cuts the hole', () => {
        const doughnut = spec({ chartType: 'doughnut', doughnutCutOut: 60 });
        expect(doughnut.type).toBe('doughnut');
        expect(doughnut.options).toEqual({ cutout: '60%' });
        expect(doughnut.valueLabels).toMatchObject({ align: 'center', anchor: 'center' });
        expect(spec({}).valueLabels).toMatchObject({ align: 'end', anchor: 'center' });
    });

    it('keeps its legend off unless the user turned it on', () => {
        expect(spec({}).legendShown).toBe(false);
    });
});

describe('pie labels and tooltip', () => {
    type Labels = { formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string; color: (context: object) => string };
    const dot = (text: string): string => text.replace(',', '.');

    // Regression: the pie formatted its value labels inline, without the guard Bar and JSON had, so
    // a min without a max threw a RangeError out of chart.js and took the view down.
    it.each([
        [{ valuesMinDecimals: 2 }, '21.50'],
        [{ valuesMinDecimals: 3, valuesMaxDecimals: 1 }, '21.500'],
        [{ valuesMinDecimals: -1, valuesMaxDecimals: '' }, '22'],
    ])('formats value labels with %o as %s', (decimals, expected) => {
        const labels = config({ dataCount: 1, oid0: 'a', ...decimals }, { a: 21.5 }).options.plugins.datalabels as Labels;
        expect(dot(labels.formatter(0, { datasetIndex: 0, dataIndex: 0 }))).toBe(expected);
    });

    it('appends the per-slice unit to the value label', () => {
        const labels = config({ dataCount: 1, oid0: 'a', labelValueAppend0: ' kWh' }, { a: 3 }).options.plugins.datalabels as Labels;
        expect(labels.formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('3 kWh');
    });

    it('prints "label: value" with at most two decimals in the tooltip, or the slice text', () => {
        const callbacks = config({ dataCount: 2, oid0: 'a', label0: 'Living Room', tooltipBodyAppend: ' W', oid1: 'b', tooltipText1: 'line1\\nline2' }, { a: 21.567, b: 1 }).options.plugins.tooltip.callbacks as { label: (item: object) => unknown };
        expect(dot(String(callbacks.label({ datasetIndex: 0, dataIndex: 0 })))).toBe('Living Room: 21.57 W');
        expect(callbacks.label({ datasetIndex: 0, dataIndex: 1 })).toEqual(['line1', 'line2']);
    });
});

describe('labelColorFor', () => {
    const context = (background: unknown, index = 0): Parameters<typeof labelColorFor>[0] => ({ dataIndex: index, dataset: { backgroundColor: background } });

    it('picks a readable label color for the slice it is drawn on', () => {
        expect(labelColorFor(context(['#44739e', '#ffeb3b'], 0))).toBe('#ffffff');
        expect(labelColorFor(context(['#44739e', '#ffeb3b'], 1))).toBe('#1d1b20');
        expect(labelColorFor(context('#2e7d32'))).toBe('#ffffff');
    });

    it('resolves M3 tokens off the canvas and falls back when it cannot parse a color', () => {
        const canvas = document.createElement('canvas');
        canvas.style.setProperty('--md-sys-color-primary', '#6750a4');
        document.body.appendChild(canvas);
        expect(labelColorFor({ dataIndex: 0, dataset: { backgroundColor: 'var(--md-sys-color-primary)' }, chart: { canvas } })).toBe('#ffffff');
        expect(labelColorFor(context('rebeccapurple'))).toBe('#000');
        canvas.remove();
    });
});

describe('datalabelsConfig', () => {
    type Cfg = {
        align: string; anchor: string; offset: number; rotation: number; textAlign: string;
        font: { family?: string; size: number };
        color: (context: { dataIndex: number; dataset?: { backgroundColor?: unknown } }) => string;
        display: boolean | ((context: { dataIndex: number }) => boolean | string);
        formatter: (value: unknown, context: { dataIndex: number }) => string;
    };
    const label = (context: { dataIndex: number }): { text: string; color?: string } => [{ text: '10 kWh' }, { text: '20 kWh', color: '#123456' }][context.dataIndex];
    const build = (data: Record<string, unknown>): Cfg => datalabelsConfig(data, label, { align: 'end', anchor: 'center' }) as Cfg;

    it('takes position, font and rotation from the saved options', () => {
        const cfg = build({ valuesPositionAlign: 'top', valuesPositionAnchor: 'end', valuesPositionOffset: 12, valuesRotation: 90, valuesTextAlign: 'left', valuesFontFamily: 'Jura', valuesFontSize: 20 });
        expect(cfg).toMatchObject({ align: 'top', anchor: 'end', offset: 12, rotation: 90, textAlign: 'left' });
        expect(cfg.font).toEqual({ family: 'Jura', size: 20 });
        expect(build({}).anchor).toBe('center');
    });

    it('honours showValues, including the auto mode and the step thinning', () => {
        expect(build({ showValues: 'showValuesOff' }).display).toBe(false);
        const on = build({}).display as (context: { dataIndex: number }) => boolean | string;
        expect(on({ dataIndex: 1 })).toBe(true);
        const auto = build({ showValues: 'showValuesAuto' }).display as (context: { dataIndex: number }) => boolean | string;
        expect(auto({ dataIndex: 0 })).toBe('auto');
        const stepped = build({ valuesSteps: 2 }).display as (context: { dataIndex: number }) => boolean | string;
        expect([stepped({ dataIndex: 0 }), stepped({ dataIndex: 1 }), stepped({ dataIndex: 2 })]).toEqual([true, false, true]);
    });

    it('renders the item text and prefers a saved color over the derived one', () => {
        const cfg = build({});
        expect(cfg.formatter(0, { dataIndex: 0 })).toBe('10 kWh');
        expect(cfg.color({ dataIndex: 1, dataset: { backgroundColor: ['#44739e', '#44739e'] } })).toBe('#123456');
        expect(cfg.color({ dataIndex: 0, dataset: { backgroundColor: ['#44739e', '#44739e'] } })).toBe('#ffffff');
    });
});
