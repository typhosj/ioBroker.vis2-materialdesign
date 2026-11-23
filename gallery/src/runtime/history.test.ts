import { describe, expect, it } from 'vitest';

import { MAX_HISTORY_POINTS, hashString, historySeries, mulberry32 } from './history';

const HOUR = 3_600_000;

describe('historySeries', () => {
    const daily = { shape: 'daily' as const, base: 300, amplitude: 900, noise: 0.1 };

    it('is deterministic for the same seed and differs for another', () => {
        expect(historySeries(daily, 0, 24 * HOUR, 50, 1)).toEqual(historySeries(daily, 0, 24 * HOUR, 50, 1));
        expect(historySeries(daily, 0, 24 * HOUR, 50, 1)).not.toEqual(historySeries(daily, 0, 24 * HOUR, 50, 2));
    });

    it('spans start to end with the requested number of points', () => {
        const series = historySeries(daily, 1_000, 1_000 + HOUR, 10, 1);
        expect(series).toHaveLength(10);
        expect(series[0].ts).toBe(1_000);
        expect(series.at(-1)!.ts).toBe(1_000 + HOUR);
    });

    it('keeps a daily curve between base and base + amplitude * (1 + noise)', () => {
        for (const { val } of historySeries(daily, 0, 48 * HOUR, 500, 7)) {
            expect(val).toBeGreaterThanOrEqual(300);
            expect(val).toBeLessThanOrEqual(300 + 900 * 1.1 + 0.01);
        }
    });

    it('never decreases for a counter', () => {
        const series = historySeries({ shape: 'counter', base: 100, amplitude: 2, noise: 0.5 }, 0, 24 * HOUR, 100, 3);
        series.slice(1).forEach((point, i) => expect(point.val).toBeGreaterThanOrEqual(series[i].val));
    });

    it('returns nothing for an empty or inverted range', () => {
        expect(historySeries(daily, 5, 5, 10, 1)).toEqual([]);
        expect(historySeries(daily, 10, 5, 10, 1)).toEqual([]);
        expect(historySeries(daily, Number.NaN, 5, 10, 1)).toEqual([]);
    });

    it('clamps the point count to 2 … MAX_HISTORY_POINTS', () => {
        expect(historySeries(daily, 0, HOUR, 1, 1)).toHaveLength(2);
        expect(historySeries(daily, 0, HOUR, 1e9, 1)).toHaveLength(MAX_HISTORY_POINTS);
        expect(historySeries(daily, 0, HOUR, Number.NaN, 1)).toHaveLength(2);
    });
});

describe('mulberry32 / hashString', () => {
    it('yields numbers in [0, 1) and stable hashes', () => {
        const random = mulberry32(42);
        for (let i = 0; i < 1000; i++) {
            const value = random();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
        expect(hashString('a.b')).toBe(hashString('a.b'));
        expect(hashString('a.b')).not.toBe(hashString('a.c'));
    });
});
