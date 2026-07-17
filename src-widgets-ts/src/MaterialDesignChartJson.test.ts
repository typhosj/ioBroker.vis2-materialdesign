import { describe, expect, it } from 'vitest';
import { jsonChartSegments, jsonChartValue } from './MaterialDesignChartJson';

describe('MaterialDesignChartJson gaps', () => {
    it('keeps missing values distinct from numeric zero', () => {
        expect([null, undefined, '', 0, '0', 2.5, { y: null }, { y: 3 }].map(jsonChartValue))
            .toEqual([null, null, null, 0, 0, 2.5, null, 3]);
    });

    it('splits at null only when spanGaps is disabled', () => {
        const points = ['a', null, 'b', 'c', null, 'd'];
        expect(jsonChartSegments(points, false)).toEqual([['a'], ['b', 'c'], ['d']]);
        expect(jsonChartSegments(points, true)).toEqual([['a', 'b', 'c', 'd']]);
    });
});
