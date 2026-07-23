import { describe, expect, it } from 'vitest';

import { arcPath, current, label, polar, range, working, type RoundSliderData } from './MaterialDesignRoundSlider';

const data = (overrides: Partial<RoundSliderData>): RoundSliderData => overrides;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

describe('MaterialDesignRoundSlider logic', () => {
    describe('range / current', () => {
        it('offsets max by 100 when min equals max', () => {
            expect(range(data({ min: 20, max: 20 })).max).toBe(120);
        });
        it('clamps and computes percent', () => {
            expect(current(150, data({ min: 0, max: 100 }))).toEqual({ raw: 100, percent: 100 });
            expect(current(25, data({ min: 0, max: 50 }))).toEqual({ raw: 25, percent: 50 });
        });
    });

    describe('polar', () => {
        it('maps 0° to 3 o’clock and 90° to 6 o’clock (y grows downward)', () => {
            const a = polar(0, 40);
            expect([r3(a.x), r3(a.y)]).toEqual([90, 50]);
            const b = polar(90, 40);
            expect([r3(b.x), r3(b.y)]).toEqual([50, 90]);
        });
    });

    describe('arcPath', () => {
        it('starts the path at the start-angle position', () => {
            expect(arcPath(0, 90, 40).startsWith('M 90 50')).toBe(true);
        });
        it('sets the large-arc flag past 180° and encodes a positive sweep', () => {
            expect(arcPath(0, 270, 40)).toContain('A 40 40 0 1 1');
        });
        it('clears the large-arc flag at or below 180°', () => {
            expect(arcPath(0, 90, 40)).toContain('A 40 40 0 0 1');
        });
    });

    describe('label', () => {
        it('returns the min text at or below min', () => {
            expect(label(0, 0, data({ min: 0, max: 100, valueLabelMin: 'off' }))).toBe('off');
        });
        it('uses percent style with a floor', () => {
            expect(label(30, 30.9, data({ min: 0, max: 100, valueLabelStyle: 'sliderPercent' }))).toBe('30 %');
        });
    });

    describe('working', () => {
        it('mirrors the linear slider working guard', () => {
            expect(working(false)).toBe(false);
            expect(working(42)).toBe(true);
        });
    });
});
