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
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory } } }));
        const inspection = fixture<HistoryInspection>(widget);
        widget.state = fixture<typeof widget.state>({
            rxData: {
                historyAdapterInstance: 'history.0',
                refreshMethod: 'byObject',
                dataCount: 0,
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
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory } } }));
        const inspection = fixture<HistoryInspection>(widget);
        widget.state = fixture<typeof widget.state>({
            rxData: { historyAdapterInstance: 'history.0', refreshMethod: 'byObject', dataCount: 0, oid: 'test.0.value' },
            values: {},
        });
        widget.componentDidMount();
        widget.componentWillUnmount();
        resolve([{ ts: 100, val: 2 }]);
        await Promise.resolve();
        await Promise.resolve();
        expect(inspection.series).toEqual([]);
    });
});
