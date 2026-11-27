import { describe, expect, it, vi } from 'vitest';

import { chartConfig } from './MaterialDesignChartCanvas';
import { m3OnColor } from './widgetUtils';
import MaterialDesignChartLineHistory, { distinctAxisRows, item, lineDash, rowAxisId, shownAxisRows, timeFormatFor } from './MaterialDesignChartLineHistory';

function fixture<T>(value: unknown): T { return value as T; }

type HistoryInspection = {
    series: Array<{ oid: string; points: Array<{ ts: number; val: number | null }>; error?: string }>;
};

describe('line history loading', () => {
    it('normalizes history values, applies multipliers and passes bounded options', async () => {
        const getHistory = vi.fn().mockResolvedValue([
            { ts: 100, val: 2 },
            { ts: 200, val: 'invalid' },
            { ts: 300, val: null },
        ]);
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
        const inspection = fixture<HistoryInspection>(widget);
        widget.state = fixture<typeof widget.state>({
            rxData: {
                historyAdapterInstance: 'history.0',
                refreshMethod: 'byObject',
                dataCount: 1,
                oid: 'test.0.value',
                aggregate: 'average',
                maxDataPoints: 20,
                minTimeInterval: 5,
                multiply: 10,
                chartTimeout: 3,
            },
            values: {},
        });

        widget.componentDidMount();
        await vi.waitFor(() => expect(inspection.series).toHaveLength(1));
        expect(inspection.series[0]).toEqual({
            oid: 'test.0.value',
            row: 0,
            points: [{ ts: 100, val: 20 }, { ts: 200, val: null }, { ts: 300, val: null }],
        });
        expect(getHistory).toHaveBeenCalledWith('test.0.value', expect.objectContaining({
            aggregate: 'average', count: 20, instance: 'history.0', step: 5000, timeout: 3000,
        }));
        widget.componentWillUnmount();
    });

    it('contains socket failures and ignores results after unmount', async () => {
        let resolve: (value: Array<{ ts: number; val: number }>) => void = () => undefined;
        const getHistory = vi.fn(() => new Promise<Array<{ ts: number; val: number }>>(done => { resolve = done; }));
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
        const inspection = fixture<HistoryInspection>(widget);
        widget.state = fixture<typeof widget.state>({
            rxData: { historyAdapterInstance: 'history.0', refreshMethod: 'byObject', dataCount: 1, oid: 'test.0.value' },
            values: {},
        });
        widget.componentDidMount();
        widget.componentWillUnmount();
        resolve([{ ts: 100, val: 2 }]);
        await Promise.resolve();
        await Promise.resolve();
        expect(inspection.series).toEqual([]);
    });

    it('only re-queries on a live value in realtime mode', async () => {
        const build = (refreshMethod: string): { widget: MaterialDesignChartLineHistory; getHistory: ReturnType<typeof vi.fn> } => {
            const getHistory = vi.fn().mockResolvedValue([{ ts: 100, val: 1 }]);
            const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
            widget.state = fixture<typeof widget.state>({
                rxData: { historyAdapterInstance: 'history.0', refreshMethod, dataCount: 1, oid: 'test.0.value', manualRefreshTrigger: 'test.0.trigger' },
                values: { 'test.0.value.val': 1 },
            });
            return { widget, getHistory };
        };
        // A new live value arrives: vis-2 re-renders, which lands in componentDidUpdate.
        const tick = (widget: MaterialDesignChartLineHistory, values: Record<string, unknown>): void => {
            widget.state = fixture<typeof widget.state>({ ...widget.state, values });
            widget.componentDidUpdate(fixture<never>({}), fixture<never>({}));
        };

        // timeInterval refreshes on its own schedule and byObject waits for its trigger state, so
        // neither may put a history query on the bus just because a data value changed.
        for (const method of ['timeInterval', 'byObject']) {
            const { widget, getHistory } = build(method);
            widget.componentDidMount();
            await vi.waitFor(() => expect(getHistory).toHaveBeenCalledTimes(1));
            tick(widget, { 'test.0.value.val': 2 });
            await Promise.resolve();
            expect(getHistory, method).toHaveBeenCalledTimes(1);
            widget.componentWillUnmount();
        }

        // byObject reacts to its trigger...
        const byObject = build('byObject');
        byObject.widget.componentDidMount();
        await vi.waitFor(() => expect(byObject.getHistory).toHaveBeenCalledTimes(1));
        tick(byObject.widget, { 'test.0.value.val': 1, 'test.0.trigger.val': 7 });
        await vi.waitFor(() => expect(byObject.getHistory).toHaveBeenCalledTimes(2));
        byObject.widget.componentWillUnmount();

        // ...and realtime reacts to the value itself.
        const realtime = build('realtime');
        realtime.widget.componentDidMount();
        await vi.waitFor(() => expect(realtime.getHistory).toHaveBeenCalledTimes(1));
        tick(realtime.widget, { 'test.0.value.val': 2 });
        await vi.waitFor(() => expect(realtime.getHistory).toHaveBeenCalledTimes(2));
        realtime.widget.componentWillUnmount();
    });
});

// The series come from the history adapter, so the tests load them through a fake socket.
async function loaded(rxData: Record<string, unknown>, history: Array<Array<{ ts: number; val: number | null }>>): Promise<MaterialDesignChartLineHistory> {
    let call = 0;
    const getHistory = vi.fn(() => Promise.resolve(history[call++] ?? []));
    const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
    widget.state = fixture<typeof widget.state>({ rxData: { historyAdapterInstance: 'history.0', refreshMethod: 'byObject', ...rxData }, values: {} });
    widget.componentDidMount();
    await vi.waitFor(() => expect(getHistory).toHaveBeenCalledTimes(history.length));
    await vi.waitFor(() => expect(widget.chartSpec(widget.state.rxData as unknown as Record<string, unknown>, () => undefined).datasets).toHaveLength(history.length));
    return widget;
}
const configOf = (widget: MaterialDesignChartLineHistory, isM3 = false) => {
    const data = { ...(widget.state.rxData as unknown as Record<string, unknown>), ...(isM3 ? { designStyle: 'material3' } : {}) };
    return chartConfig(widget.chartSpec(data, () => undefined), data, { isM3, isDark: false });
};
const dot = (text: string): string => text.replace(',', '.');
type Labels = { display: unknown; backgroundColor: unknown; formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string };

describe('line history chart', () => {
    it('labels the y value of each point, dropping gaps, with the row decimals and unit', async () => {
        const widget = await loaded({ dataCount: 1, oid: 'a', valuesMaxDecimals: 1, valuesAppendText: ' W' }, [[{ ts: 100, val: 2.25 }, { ts: 200, val: null }, { ts: 300, val: 4 }]]);
        const labels = configOf(widget).data.datasets[0].datalabels as Labels;
        expect(dot(labels.formatter(0, { datasetIndex: 0, dataIndex: 0 }))).toBe('2.3 W');
        expect(labels.formatter(0, { datasetIndex: 0, dataIndex: 1 })).toBe('4 W');
        widget.componentWillUnmount();
    });

    it('takes the label box and the on/off switch from each series row', async () => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', valuesBackgroundColor1: '#eeeeee', showValues1: 'showValuesOff' }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }]]);
        const [first, second] = configOf(widget).data.datasets.map(d => d.datalabels as Labels);
        expect(first.backgroundColor).toBeNull();
        expect(second.backgroundColor).toBe('#eeeeee');
        expect(second.display).toBe(false);
        expect(configOf(widget).options.plugins.datalabels).toEqual({ display: false });
        widget.componentWillUnmount();
    });

    it('fills under the line from the line colour and keeps the points on it', async () => {
        const widget = await loaded({ dataCount: 1, oid: 'a', useFillColor: true, pointColor: '#ff0000' }, [[{ ts: 1, val: 20 }]]);
        expect(configOf(widget).data.datasets[0]).toMatchObject({ borderColor: '#44739e', backgroundColor: '#44739e33', pointBackgroundColor: '#ff0000', fill: true });
        widget.componentWillUnmount();
    });

    it('colours the value labels like the series unless the row sets a label colour', async () => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', dataColor: '#00aa00', valuesFontColor1: '#123456' }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }]]);
        const [first, second] = configOf(widget).data.datasets.map(d => d.datalabels as { color: (context: object) => string });
        expect(first.color({ datasetIndex: 0, dataIndex: 0 })).toBe('#00aa00');
        expect(second.color({ datasetIndex: 1, dataIndex: 0 })).toBe('#123456');
        widget.componentWillUnmount();
    });

    it('reads a label in an opaque box against the box, not in the series colour', async () => {
        const widget = await loaded({ dataCount: 3, oid: 'a', oid1: 'b', oid2: 'c', dataColor: '#ffeb3b', valuesBackgroundColor: '#ffffff', valuesBackgroundColor1: 'rgba(0, 0, 0, 0.3)', valuesBackgroundColor2: '#000000', valuesFontColor2: '#ff0000' }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }]]);
        const [boxed, translucent, own] = configOf(widget).data.datasets.map(d => d.datalabels as { color: (context: object) => string });
        expect(boxed.color({ datasetIndex: 0, dataIndex: 0 })).toBe(m3OnColor('#ffffff'));
        expect(translucent.color({ datasetIndex: 1, dataIndex: 0 })).toBe('#44739e');
        expect(own.color({ datasetIndex: 2, dataIndex: 0 })).toBe('#ff0000');
        widget.componentWillUnmount();
    });

    it('takes an explicit series colour for line, fill and points', async () => {
        const widget = await loaded({ dataCount: 1, oid: 'a', dataColor: '#00aa00', useFillColor: true }, [[{ ts: 1, val: 20 }]]);
        expect(configOf(widget).data.datasets[0]).toMatchObject({ borderColor: '#00aa00', backgroundColor: '#00aa0033', pointBackgroundColor: '#00aa00' });
        widget.componentWillUnmount();
    });

    // Regression: the legend rebuilt the colour without the M3 default its dataset used.
    it('draws the legend in the dataset colour in M3', async () => {
        const widget = await loaded({ dataCount: 1, oid: 'a', legendText: 'Temperatur' }, [[{ ts: 1, val: 20 }]]);
        const result = configOf(widget, true);
        expect(result.data.datasets[0].borderColor).toBe('#6750a4');
        expect(result.legend).toEqual([{ label: 'Temperatur', color: '#6750a4' }]);
        widget.componentWillUnmount();
    });

    it('prints "<series>: <value><unit>" in the tooltip and the time as its title', async () => {
        const widget = await loaded({ dataCount: 1, oid: 'a', legendText: 'Temperatur', tooltipBodyAppend: ' °C', tooltipValueMinDecimals: 1, tooltipValueMaxDecimals: 1, xAxisTimeFormats: 'HH:mm' }, [[{ ts: Date.UTC(2026, 0, 1, 12, 0), val: 20.25 }]]);
        const callbacks = configOf(widget).options.plugins.tooltip.callbacks as { title: (items: object[]) => unknown; label: (item: object) => unknown };
        expect(dot(String(callbacks.label({ datasetIndex: 0, dataIndex: 0 })))).toMatch(/^Temperatur: 20\.3 °C$/);
        expect(String(callbacks.title([{ datasetIndex: 0, dataIndex: 0 }]))).toMatch(/^\d\d:\d\d$/);
        widget.componentWillUnmount();
    });

    // Without an X-axis time format the tooltip title read "lll" instead of date and time.
    it('titles the tooltip with date and time when no time format is set', async () => {
        const ts = new Date(2026, 0, 2, 12, 34).getTime();
        const widget = await loaded({ dataCount: 1, oid: 'a' }, [[{ ts, val: 1 }]]);
        const callbacks = configOf(widget).options.plugins.tooltip.callbacks as { title: (items: object[]) => unknown };
        const title = String(callbacks.title([{ datasetIndex: 0, dataIndex: 0 }]));
        expect(title).not.toContain('lll');
        expect(title).toContain('2026');
        expect(title).toMatch(/12:34/);
        widget.componentWillUnmount();
    });

    // upstream-#120: one appendix for the whole tooltip could not tell °C from %.
    it('gives each data set its own tooltip unit and falls back to the tooltip group appendix', async () => {
        const widget = await loaded({ dataCount: 3, oid: 'a', oid1: 'b', oid2: 'c', legendText: 'T', legendText1: 'H', legendText2: 'P', tooltipBodyAppend: ' x', tooltipAppendText: ' °C', tooltipAppendText1: ' %', tooltipAppendText2: '' }, [[{ ts: 1, val: 20 }], [{ ts: 1, val: 50 }], [{ ts: 1, val: 7 }]]);
        const label = (configOf(widget).options.plugins.tooltip.callbacks as { label: (item: object) => unknown }).label;
        expect(label({ datasetIndex: 0, dataIndex: 0 })).toBe('T: 20 °C');
        expect(label({ datasetIndex: 1, dataIndex: 0 })).toBe('H: 50 %');
        expect(label({ datasetIndex: 2, dataIndex: 0 })).toBe('P: 7 x');
        widget.componentWillUnmount();
    });

    // upstream-#218
    it('dashes or dots a line from its row and keeps the default solid', async () => {
        const widget = await loaded({ dataCount: 3, oid: 'a', oid1: 'b', oid2: 'c', lineStyle1: 'dashed', lineStyle2: 'dotted', lineThikness2: 4 }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }], [{ ts: 1, val: 1 }]]);
        expect(configOf(widget).data.datasets.map(dataset => dataset.borderDash)).toEqual([[], [8, 4], [4, 6]]);
        widget.componentWillUnmount();
    });

    // upstream-#210: two years was the longest range, a yearly value needs twenty.
    it('offers ranges beyond two years and queries the history from that far back', async () => {
        const options = MaterialDesignChartLineHistory.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; options?: string[] }>).find(field => field.name === 'timeIntervalToShow')?.options;
        expect(options?.slice(-4)).toEqual(['2 years', '5 years', '10 years', '20 years']);
        const before = Date.now();
        let start = 0;
        const getHistory = vi.fn((_id: string, options: { start: number }) => { start = options.start; return Promise.resolve([]); });
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
        widget.state = fixture<typeof widget.state>({ rxData: { historyAdapterInstance: 'history.0', refreshMethod: 'byObject', dataCount: 1, oid: 'a', timeIntervalToShow: '20 years' }, values: {} });
        widget.componentDidMount();
        await vi.waitFor(() => expect(getHistory).toHaveBeenCalledTimes(1));
        const after = Date.now();
        const span = 20 * 365 * 86400000;
        expect(start).toBeGreaterThanOrEqual(before - span);
        expect(start).toBeLessThanOrEqual(after - span);
        widget.componentWillUnmount();
    });
});

describe('lineDash', () => {
    it('scales dashes and dots with the line width and treats anything else as solid', () => {
        expect(lineDash('dashed', 2)).toEqual([8, 4]);
        expect(lineDash('dotted', 2)).toEqual([2, 3]);
        expect(lineDash('solid', 2)).toEqual([]);
        expect(lineDash(undefined, 2)).toEqual([]);
        expect(lineDash('bogus', 2)).toEqual([]);
        // A zero or negative width still leaves visible gaps instead of an empty dash array.
        expect(lineDash('dashed', 0)).toEqual([4, 2]);
        expect(lineDash('dotted', -3)).toEqual([1, 1.5]);
    });
});

describe('item (indexed-row fallback)', () => {
    it('reads the suffixed key for a row index', () => {
        expect(item({ oid1: 'b' }, 'oid', 1)).toBe('b');
    });
    it('falls back to the plain base key only for row index 0', () => {
        expect(item({ oid: 'a' }, 'oid', 0)).toBe('a');
        expect(item({ oid: 'a' }, 'oid', 1)).toBeUndefined();
    });
    it('prefers the suffixed key over the plain key at index 0', () => {
        expect(item({ oid: 'a', oid0: 'b' }, 'oid', 0)).toBe('b');
    });
});

describe('rowAxisId', () => {
    it('defaults to yAxis_id 0 when unset', () => {
        expect(rowAxisId({}, 0)).toBe('yAxis_id_0');
    });
    it('uses the row-specific commonYAxis when set', () => {
        expect(rowAxisId({ commonYAxis1: 2 }, 1)).toBe('yAxis_id_2');
    });
});

describe('distinctAxisRows', () => {
    it('keeps only the first row per distinct axis id', () => {
        const d = { commonYAxis0: 0, commonYAxis1: 1, commonYAxis2: 0 };
        expect(distinctAxisRows([0, 1, 2], d)).toEqual([0, 1]);
    });
    it('collapses rows with no explicit commonYAxis onto the shared default axis', () => {
        expect(distinctAxisRows([0, 1, 2], {})).toEqual([0]);
    });
    it('works on a row list with gaps, as left after hiding rows', () => {
        const d = { commonYAxis0: 0, commonYAxis1: 1, commonYAxis2: 1, commonYAxis3: 0 };
        expect(distinctAxisRows([1, 2, 3], d)).toEqual([1, 3]);
        expect(distinctAxisRows([2], d)).toEqual([2]);
        expect(distinctAxisRows([], d)).toEqual([]);
    });
});

// vis-materialdesign stored xAxisTimeFormats as chart.js v2 `displayFormats` JSON (one format per
// unit), and the old editor inserted that JSON as the default. Taken as one moment format, every
// tick printed the JSON with its letters replaced by date parts.
describe('timeFormatFor', () => {
    const OLD_DEFAULT = '{"millisecond":"H:mm:ss.SSS","second":"H:mm:ss","minute":"H:mm","hour":"H","day":"ddd DD.","week":"ll","month":"MMM YYYY","quarter":"[Q]Q - YYYY","year":"YYYY"}';
    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    it('keeps a plain format as it is, whatever the spacing', () => {
        expect(timeFormatFor('DD.MM HH:mm', HOUR)).toBe('DD.MM HH:mm');
        expect(timeFormatFor('DD.MM HH:mm', 365 * DAY)).toBe('DD.MM HH:mm');
        expect(timeFormatFor('[Uhr] HH:mm', DAY)).toBe('[Uhr] HH:mm');
    });

    // An empty field printed HH:mm on every range, so a 20-year chart read 12:33, 22:20, ...
    it('follows the tick spacing when the field is empty', () => {
        expect(timeFormatFor('', 500)).toBe('HH:mm:ss');
        expect(timeFormatFor('', 10_000)).toBe('HH:mm:ss');
        expect(timeFormatFor('', 5 * MINUTE)).toBe('HH:mm');
        expect(timeFormatFor('', 3 * HOUR)).toBe('HH:mm');
        expect(timeFormatFor('', DAY - 1)).toBe('HH:mm');
        expect(timeFormatFor('', DAY)).toBe('L');
        expect(timeFormatFor('', 7 * DAY)).toBe('L');
        expect(timeFormatFor('', 28 * DAY - 1)).toBe('L');
        expect(timeFormatFor('', 28 * DAY)).toBe('MMM YYYY');
        expect(timeFormatFor('', 90 * DAY)).toBe('MMM YYYY');
        expect(timeFormatFor('', 365 * DAY - 1)).toBe('MMM YYYY');
        expect(timeFormatFor('', 365 * DAY)).toBe('YYYY');
        expect(timeFormatFor('', 2 * 365 * DAY)).toBe('YYYY');
        expect(timeFormatFor('', Number.NaN)).toBe('HH:mm');
        expect(timeFormatFor('', 0)).toBe('HH:mm');
        expect(timeFormatFor('', -DAY)).toBe('HH:mm');
        expect(timeFormatFor('', Number.POSITIVE_INFINITY)).toBe('YYYY');
    });

    it('picks the format of the unit the tick spacing falls into', () => {
        expect(timeFormatFor(OLD_DEFAULT, 500)).toBe('H:mm:ss.SSS');
        expect(timeFormatFor(OLD_DEFAULT, 10_000)).toBe('H:mm:ss');
        expect(timeFormatFor(OLD_DEFAULT, 5 * MINUTE)).toBe('H:mm');
        expect(timeFormatFor(OLD_DEFAULT, 3 * HOUR)).toBe('H');
        expect(timeFormatFor(OLD_DEFAULT, DAY)).toBe('ddd DD.');
        expect(timeFormatFor(OLD_DEFAULT, 7 * DAY)).toBe('ll');
        expect(timeFormatFor(OLD_DEFAULT, 30 * DAY)).toBe('MMM YYYY');
        expect(timeFormatFor(OLD_DEFAULT, 365 * DAY)).toBe('YYYY');
    });

    it('takes the minute format while the spacing is unknown (a single tick)', () => {
        expect(timeFormatFor(OLD_DEFAULT, Number.NaN)).toBe('H:mm');
        expect(timeFormatFor(OLD_DEFAULT, 0)).toBe('H:mm');
    });

    it('falls back to the default of the unit for broken JSON or a unit the map leaves out', () => {
        expect(timeFormatFor('{nope', HOUR)).toBe('HH:mm');
        expect(timeFormatFor('{nope', 365 * DAY)).toBe('YYYY');
        expect(timeFormatFor('{"minute":"H:mm"}', DAY)).toBe('L');
        expect(timeFormatFor('{"day":""}', DAY)).toBe('L');
        expect(timeFormatFor('{"day":5}', DAY)).toBe('L');
        expect(timeFormatFor('{"year":["YYYY"]}', 365 * DAY)).toBe('YYYY');
        expect(timeFormatFor('{"year":"YY"}', 365 * DAY)).toBe('YY');
        expect(timeFormatFor('{}', 30 * DAY)).toBe('MMM YYYY');
    });
});
describe('line history data set visibility (upstream #84)', () => {
    const rx = { dataCount: 2, oid: 'a', oid1: 'b', legendText: 'Innen', legendText1: 'Pumpe', yAxisPosition1: 'right', visibilityOid1: 'test.0.mode', visibilityCondition1: '==', visibilityConditionValue1: 'auto', commonYAxis1: 1, colorScheme: 'turbo', tooltipAppendText: ' °C', tooltipAppendText1: ' W' };
    const withMode = (widget: MaterialDesignChartLineHistory, mode: unknown) => {
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': mode } });
        return configOf(widget);
    };

    it.each([['auto', false], ['manual', true], [undefined, true], ['', true], [0, true]])('mode %j -> second data set hidden %s', async (mode, hidden) => {
        const widget = await loaded(rx, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        const config = withMode(widget, mode);
        expect(config.data.datasets[0].hidden).toBeUndefined();
        expect(config.data.datasets[1].hidden === true).toBe(hidden);
        expect(config.legend.map(entry => entry.label)).toEqual(hidden ? ['Innen'] : ['Innen', 'Pumpe']);
        widget.componentWillUnmount();
    });

    it('keeps colours and tooltips of the other data sets where they were, and drops the axis of the hidden one', async () => {
        const widget = await loaded(rx, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        const visible = withMode(widget, 'auto');
        const hidden = withMode(widget, 'manual');
        expect(hidden.data.datasets[0].borderColor).toBe(visible.data.datasets[0].borderColor);
        expect(hidden.data.datasets[1].borderColor).toBe(visible.data.datasets[1].borderColor);
        expect((hidden.options.scales as Record<string, { display?: unknown }>).yAxis_id_1.display).toBe(false);
        expect((visible.options.scales as Record<string, { display?: unknown }>).yAxis_id_1.display).not.toBe(false);
        const label = (hidden.options.plugins.tooltip.callbacks as { label: (item: object) => string }).label;
        expect(label({ datasetIndex: 1, dataIndex: 0 })).toMatch(/ W$/);
        widget.componentWillUnmount();
    });

    it('shows a data set without visibility object id whatever the state says', async () => {
        const widget = await loaded({ ...rx, visibilityOid1: '' }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        expect(withMode(widget, 'manual').data.datasets[1].hidden).toBeUndefined();
        widget.componentWillUnmount();
    });

    it('declares the three visibility fields per data set', () => {
        const fields = MaterialDesignChartLineHistory.getWidgetInfo().visAttrs.flatMap(group => group.fields).map(field => field.name);
        expect(fields).toEqual(expect.arrayContaining(['visibilityOid', 'visibilityCondition', 'visibilityConditionValue']));
    });

    it('offers the condition as a choice of the operators the check knows', () => {
        const field = MaterialDesignChartLineHistory.getWidgetInfo().visAttrs.flatMap(group => group.fields).find(f => f.name === 'visibilityCondition') as { type?: string; options?: string[]; default?: string };
        expect(field).toMatchObject({ type: 'select', default: '==' });
        expect(field.options).toEqual(['==', '!=', '<=', '>=', '<', '>', 'consist', 'not consist', 'exist', 'not exist']);
    });
});

describe('line history hiding the first data set', () => {
    it('keeps the axis of the second data set when the first is hidden', async () => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', commonYAxis1: 1, visibilityOid: 'test.0.mode', visibilityConditionValue: 'auto' }, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': 'manual' } });
        const config = configOf(widget);
        expect(config.data.datasets[0].hidden).toBe(true);
        expect((config.options.scales as Record<string, { display?: unknown }>).yAxis_id_1.display).not.toBe(false);
        expect((config.options.scales as Record<string, { display?: unknown }>).yAxis_id_0.display).toBe(false);
        widget.componentWillUnmount();
    });

    it('keeps title and range of a shared axis from its first row when that row is hidden', async () => {
        const rx = {
            dataCount: 2, oid: 'a', oid1: 'b', visibilityOid: 'test.0.mode', visibilityConditionValue: 'auto',
            yAxisTitle: 'Temperatur', yAxisMinValue: 0, yAxisMaxValue: 40, yAxisPosition: 'left',
            yAxisTitle1: 'Leistung', yAxisMinValue1: 0, yAxisMaxValue1: 3000, yAxisPosition1: 'right',
        };
        const widget = await loaded(rx, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        const axisWith = (mode: string) => {
            widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': mode } });
            return (configOf(widget).options.scales as Record<string, { min?: number; max?: number; position?: string; title?: { text?: string } }>).yAxis_id_0;
        };
        const shown = axisWith('auto');
        const hidden = axisWith('manual');
        expect(hidden).toMatchObject({ min: 0, max: 40, position: 'left', title: { text: 'Temperatur' } });
        expect(hidden).toEqual(shown);
        widget.componentWillUnmount();
    });
});

describe('shownAxisRows', () => {
    const d = { commonYAxis0: 0, commonYAxis1: 1, commonYAxis2: 0, commonYAxis3: 1 };
    it.each([
        [[0, 1, 2, 3], [0, 1]],
        [[1, 2, 3], [0, 1]],
        [[2], [0]],
        [[3], [1]],
        [[], []],
    ])('shown rows %j -> axes defined by rows %j', (shown, axes) => {
        expect(shownAxisRows([0, 1, 2, 3], i => shown.includes(i), d)).toEqual(axes);
    });
    it('takes every row onto the shared axis when no row names one', () => {
        expect(shownAxisRows([0, 1, 2], i => i === 2, {})).toEqual([0]);
        expect(shownAxisRows([], () => true, {})).toEqual([]);
    });
});

describe('line history with a data row that has no object id', () => {
    // Row 1 is empty and loads no series, so the second dataset belongs to row 2.
    const rx = {
        dataCount: 3, oid: 'a', oid1: '', oid2: 'c',
        legendText: 'A', legendText1: 'B', legendText2: 'C',
        dataColor1: '#111111', dataColor2: '#222222',
        chartType1: 'bar', chartType2: 'line',
        tooltipAppendText1: ' x', tooltipAppendText2: ' W',
        commonYAxis2: 2, visibilityOid2: 'test.0.mode', visibilityConditionValue2: 'auto',
    };

    it('reads label, colour, type, axis, visibility and tooltip unit from the row of the series', async () => {
        const widget = await loaded(rx, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': 'manual' } });
        const config = configOf(widget);
        const second = config.data.datasets[1];
        expect(second).toMatchObject({ label: 'C', borderColor: '#222222', yAxisID: 'yAxis_id_2', hidden: true });
        expect(second.type).toBeUndefined();
        expect(config.data.datasets[0].hidden).toBeUndefined();
        expect(config.options.scales.x.offset).toBeUndefined();
        const label = (config.options.plugins.tooltip.callbacks as { label: (item: object) => string }).label;
        expect(label({ datasetIndex: 1, dataIndex: 0 })).toMatch(/ W$/);
        widget.componentWillUnmount();
    });

    it('shows the series again once the condition of its own row holds', async () => {
        const widget = await loaded(rx, [[{ ts: 1, val: 1 }], [{ ts: 1, val: 2 }]]);
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': 'auto' } });
        expect(configOf(widget).data.datasets[1].hidden).toBeUndefined();
        widget.componentWillUnmount();
    });
});

describe('line history bars per dataset (upstream #233)', () => {
    const two = [[{ ts: 1000, val: 1 }, { ts: 2000, val: 3 }], [{ ts: 1000, val: 2 }, { ts: 2000, val: 4 }]];

    it.each([['bar', 'bar'], ['line', undefined], ['', undefined], [undefined, undefined], ['pie', undefined]])('chartType %j -> dataset type %j', async (chartType, type) => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', chartType1: chartType }, two);
        const config = configOf(widget);
        expect(config.data.datasets[0].type).toBeUndefined();
        expect(config.data.datasets[1].type).toBe(type);
        expect(config.options.scales.x.offset).toBe(type === 'bar' ? true : undefined);
        widget.componentWillUnmount();
    });

    it('fills a bar solid in the dataset colour, or in the fill colour when one is set', async () => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', chartType: 'bar', dataColor: '#00aa00', chartType1: 'bar', dataColor1: '#0000ff', fillColor1: '#ff000080' }, two);
        const [first, second] = configOf(widget).data.datasets;
        expect(first).toMatchObject({ type: 'bar', backgroundColor: '#00aa00', borderWidth: 0 });
        expect(second).toMatchObject({ type: 'bar', backgroundColor: '#ff000080' });
        expect(first.fill).toBeUndefined();
        widget.componentWillUnmount();
    });

    it('keeps the bar on its own y-axis and drops the axis offset while the bar is hidden', async () => {
        const widget = await loaded({ dataCount: 2, oid: 'a', oid1: 'b', chartType1: 'bar', commonYAxis1: 1, visibilityOid1: 'test.0.mode', visibilityConditionValue1: 'auto' }, two);
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': 'auto' } });
        expect(configOf(widget).data.datasets[1].yAxisID).toBe('yAxis_id_1');
        expect(configOf(widget).options.scales.x.offset).toBe(true);
        widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.mode.val': 'manual' } });
        expect(configOf(widget).options.scales.x.offset).toBeUndefined();
        widget.componentWillUnmount();
    });
});
