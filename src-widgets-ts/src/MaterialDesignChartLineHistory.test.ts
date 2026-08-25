import { describe, expect, it, vi } from 'vitest';

import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';

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
