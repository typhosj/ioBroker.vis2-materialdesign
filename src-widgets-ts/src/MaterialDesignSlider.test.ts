import { describe, expect, it } from 'vitest';
import { snapToStep } from './MaterialDesignProgress';
import { isWorking, labelFor, range, sliderValue, type SliderData } from './MaterialDesignSlider';

const data = (overrides: Partial<SliderData>): SliderData => overrides;

describe('snapToStep (slider #222 decimal precision)', () => {
    it('snaps to a decimal step without binary-float noise', () => {
        expect(snapToStep(0.3, 0.1)).toBe(0.3); // Math.round(0.3/0.1)*0.1 = 0.30000000000000004
        expect(snapToStep(0.29, 0.1)).toBe(0.3);
        expect(snapToStep(0.74, 0.1)).toBe(0.7);
        expect(snapToStep(1.25, 0.5)).toBe(1.5);
        expect(snapToStep(2.04, 0.01)).toBe(2.04);
    });

    it('keeps integer steps integer', () => {
        expect(snapToStep(7.4, 1)).toBe(7);
        expect(snapToStep(12, 5)).toBe(10);
        expect(snapToStep(13, 5)).toBe(15);
    });

    it('returns the raw value for a non-positive or invalid step', () => {
        expect(snapToStep(3.7, 0)).toBe(3.7);
        expect(snapToStep(3.7, -1)).toBe(3.7);
        expect(snapToStep(3.7, NaN)).toBe(3.7);
    });
});

describe('linear slider range/value/label', () => {
    describe('range', () => {
        it('defaults to 0..100 step 1', () => {
            expect(range(data({}))).toEqual({ min: 0, max: 100, step: 1 });
        });
        it('offsets max by 100 when min equals max', () => {
            expect(range(data({ min: 50, max: 50 }))).toEqual({ min: 50, max: 150, step: 1 });
        });
        it('never allows a zero step', () => {
            expect(range(data({ step: 0 })).step).toBe(1);
        });
    });

    describe('sliderValue', () => {
        it('clamps below min and above max', () => {
            expect(sliderValue(-20, data({ min: 0, max: 100 }))).toEqual({ raw: 0, percent: 0 });
            expect(sliderValue(200, data({ min: 0, max: 100 }))).toEqual({ raw: 100, percent: 100 });
        });
        it('computes the percent within the range', () => {
            expect(sliderValue(25, data({ min: 0, max: 50 }))).toEqual({ raw: 25, percent: 50 });
        });
        it('falls back to min when the value is not a number', () => {
            expect(sliderValue(undefined, data({ min: 10, max: 20 }))).toEqual({ raw: 10, percent: 0 });
        });
    });

    describe('labelFor', () => {
        it('prefers the min/max rule texts when applyRules is on', () => {
            expect(labelFor(0, 0, data({ min: 0, max: 100, valueLabelMin: 'MIN' }), true)).toBe('MIN');
            expect(labelFor(100, 100, data({ min: 0, max: 100, valueLabelMax: 'MAX' }), true)).toBe('MAX');
        });
        it('ignores rule texts when applyRules is off', () => {
            expect(labelFor(0, 0, data({ min: 0, max: 100, valueLabelMin: 'MIN', valueLabelUnit: '°C' }), false)).toBe('0°C');
        });
        it('renders percent style rounded', () => {
            expect(labelFor(30, 30.4, data({ min: 0, max: 100, valueLabelStyle: 'sliderPercent' }), false)).toBe('30 %');
        });
        it('appends the unit for value style', () => {
            expect(labelFor(30, 30, data({ min: 0, max: 100, valueLabelUnit: ' kWh' }), false)).toBe('30 kWh');
        });
    });

    describe('isWorking', () => {
        it('treats empty/false/null/undefined as not working', () => {
            for (const v of [undefined, null, '', false, 'false'] as const) {
                expect(isWorking(v)).toBe(false);
            }
        });
        it('treats any other value as working', () => {
            expect(isWorking(true)).toBe(true);
            expect(isWorking(1)).toBe(true);
        });
    });
});
