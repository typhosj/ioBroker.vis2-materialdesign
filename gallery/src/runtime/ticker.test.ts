import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mulberry32 } from './history';
import { Store } from './store';
import { MIN_TICK_MS, nextTickValue, startTicker } from './ticker';

describe('nextTickValue', () => {
    const rule = { min: 20.5, max: 22.5, step: 0.1, everyMs: 5000 };

    it('stays inside min … max and on the step grid', () => {
        const random = mulberry32(1);
        let value: unknown = 21;
        for (let i = 0; i < 10_000; i++) {
            value = nextTickValue(value, rule, random);
            expect(value).toBeGreaterThanOrEqual(20.5);
            expect(value).toBeLessThanOrEqual(22.5);
            expect(Math.abs((value as number) * 10 - Math.round((value as number) * 10))).toBeLessThan(1e-6);
        }
    });

    it('starts from the middle when the current value is not a finite number', () => {
        expect(nextTickValue('x', rule, () => 0.5)).toBe(21.5);
        expect(nextTickValue(Number.NaN, rule, () => 0.5)).toBe(21.5);
    });

    it('swaps min and max when they are inverted and treats step <= 0 as 1', () => {
        expect(nextTickValue(5, { min: 10, max: 0, step: 0, everyMs: 1000 }, () => 0.5)).toBe(5);
        expect(nextTickValue(50, { min: 10, max: 0, step: 0, everyMs: 1000 }, () => 0.5)).toBe(10);
    });
});

describe('startTicker', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('writes acknowledged values every interval, skips while paused and stops', () => {
        const store = new Store({ t: 21 }, {}, { ackDelayMs: 0 });
        let paused = false;
        const seen: unknown[] = [];
        store.subscribe('t', (_id, state) => seen.push(state?.ack));
        const stop = startTicker(store, { t: { min: 20, max: 22, step: 0.5, everyMs: 1000 } }, () => 0.9, () => paused);
        vi.advanceTimersByTime(1000);
        expect(seen).toEqual([true]);
        paused = true;
        vi.advanceTimersByTime(3000);
        expect(seen).toHaveLength(1);
        paused = false;
        stop();
        vi.advanceTimersByTime(3000);
        expect(seen).toHaveLength(1);
    });

    it(`never ticks faster than ${MIN_TICK_MS} ms`, () => {
        const store = new Store({ t: 0 }, {}, { ackDelayMs: 0 });
        const listener = vi.fn();
        store.subscribe('t', listener);
        const stop = startTicker(store, { t: { min: 0, max: 10, step: 1, everyMs: 1 } }, () => 0.9, () => false);
        vi.advanceTimersByTime(MIN_TICK_MS - 1);
        expect(listener).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(listener).toHaveBeenCalledTimes(1);
        stop();
    });
});
