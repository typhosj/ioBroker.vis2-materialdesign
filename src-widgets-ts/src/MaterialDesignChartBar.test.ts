import { describe, expect, it } from 'vitest';
import { barAxisRange, barCount, buildBars, json } from './MaterialDesignChartBar';

describe('json', () => {
    it('parses a JSON array', () => {
        expect(json('[{"a":1}]')).toEqual([{ a: 1 }]);
    });
    it('returns null for a JSON object (not an array)', () => {
        expect(json('{"a":1}')).toBeNull();
    });
    it('returns null for invalid JSON', () => {
        expect(json('not json')).toBeNull();
        expect(json(undefined)).toBeNull();
    });
});

describe('barCount', () => {
    it('uses the source array length when using jsonStringObject data', () => {
        expect(barCount({}, [{}, {}, {}])).toBe(3);
    });
    it('caps the source length at MAX_DYNAMIC_ITEMS', () => {
        const source = Array.from({ length: 999 }, () => ({}));
        expect(barCount({}, source)).toBeLessThan(999);
    });
    it('falls back to dataCount + 1 (0-based indexFrom) without a source', () => {
        expect(barCount({ dataCount: 2 }, null)).toBe(3);
        expect(barCount({}, null)).toBe(2); // default dataCount 1 -> count 2
    });
});

describe('buildBars', () => {
    it('reads value/label/color from indexed editor fields when there is no JSON source', () => {
        const data = { label0: 'Room A', dataColor0: '#ff0000', valueText0: '', valuesFontColor: '#000' };
        const bars = buildBars(data, null, 1, [], () => 42);
        expect(bars).toEqual([
            expect.objectContaining({ label: 'Room A', value: 42, color: '#ff0000' }),
        ]);
    });

    it('prefers JSON source row fields over indexed editor fields', () => {
        const data = { label0: 'ignored', dataColor0: '#ff0000' };
        const source = [{ label: 'From JSON', value: 7, dataColor: '#00ff00' }];
        const bars = buildBars(data, source, 1, [], () => 0);
        expect(bars[0]).toEqual(expect.objectContaining({ label: 'From JSON', value: 7, color: '#00ff00' }));
    });

    it('falls back to the color scheme, then globalColor, when no explicit color is set', () => {
        const withScheme = buildBars({}, null, 1, ['#123456'], () => 0);
        expect(withScheme[0].color).toBe('#123456');
        const withGlobal = buildBars({ globalColor: '#abcdef' }, null, 1, [], () => 0);
        expect(withGlobal[0].color).toBe('#abcdef');
    });

    it('formats valueText with configured min/max decimals when not explicitly provided', () => {
        const bars = buildBars({ valuesMinDecimals: 2, valuesMaxDecimals: 2 }, null, 1, [], () => 3);
        expect(bars[0].valueText).toBe((3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    });
});

describe('barAxisRange', () => {
    it('derives min/max from bar values when axisValueMin/Max are unset', () => {
        const bars = buildBars({}, [{ value: -5 }, { value: 10 }], 2, [], () => 0);
        expect(barAxisRange({}, bars)).toEqual({ min: -5, max: 10 });
    });
    it('never lets the auto max drop below 1', () => {
        const bars = buildBars({}, [{ value: 0 }], 1, [], () => 0);
        expect(barAxisRange({}, bars).max).toBe(1);
    });
    it('prefers explicit axisValueMin/Max over the computed range', () => {
        const bars = buildBars({}, [{ value: 50 }], 1, [], () => 0);
        expect(barAxisRange({ axisValueMin: -100, axisValueMax: 100 }, bars)).toEqual({ min: -100, max: 100 });
    });
    it('treats a null axisValueMax as unset (auto-scale), not as 1', () => {
        const bars = buildBars({}, [{ value: 5 }, { value: 30 }], 2, [], () => 0);
        expect(barAxisRange({ axisValueMin: null, axisValueMax: null }, bars)).toEqual({ min: 0, max: 30 });
    });
});
