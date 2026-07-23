import { describe, expect, it, vi } from 'vitest';

import MaterialDesignChartLineHistory, { distinctAxisRows, item, rowAxisId, seriesColor } from './MaterialDesignChartLineHistory';

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
        const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: { socket: { getHistory, subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() } } }));
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

describe('seriesColor', () => {
    it('prefers the row explicit dataColor', () => {
        expect(seriesColor({ dataColor0: '#ff0000' }, 0, ['#123456'], undefined)).toBe('#ff0000');
    });
    it('falls back to the palette entry for the row index', () => {
        expect(seriesColor({}, 1, ['#111111', '#222222'], undefined)).toBe('#222222');
    });
    it('falls back to globalColor, then the default blue', () => {
        expect(seriesColor({}, 0, [], '#abcdef')).toBe('#abcdef');
        expect(seriesColor({}, 0, [], undefined)).toBe('#44739e');
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
