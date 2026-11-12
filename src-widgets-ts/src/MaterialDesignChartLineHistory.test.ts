import { describe, expect, it, vi } from 'vitest';

import { chartConfig } from './MaterialDesignChartCanvas';
import MaterialDesignChartLineHistory, { distinctAxisRows, item, rowAxisId, timeFormatFor } from './MaterialDesignChartLineHistory';

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
});

// vis-materialdesign stored xAxisTimeFormats as chart.js v2 `displayFormats` JSON (one format per
// unit), and the old editor inserted that JSON as the default. Taken as one moment format, every
// tick printed the JSON with its letters replaced by date parts.
describe('timeFormatFor', () => {
    const OLD_DEFAULT = '{"millisecond":"H:mm:ss.SSS","second":"H:mm:ss","minute":"H:mm","hour":"H","day":"ddd DD.","week":"ll","month":"MMM YYYY","quarter":"[Q]Q - YYYY","year":"YYYY"}';
    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    it('keeps a plain format as it is, and the default for an empty one', () => {
        expect(timeFormatFor('DD.MM HH:mm', HOUR)).toBe('DD.MM HH:mm');
        expect(timeFormatFor('', HOUR)).toBe('HH:mm');
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

    it('falls back to the default for broken JSON or a unit the map leaves out', () => {
        expect(timeFormatFor('{nope', HOUR)).toBe('HH:mm');
        expect(timeFormatFor('{"minute":"H:mm"}', DAY)).toBe('HH:mm');
    });
});
