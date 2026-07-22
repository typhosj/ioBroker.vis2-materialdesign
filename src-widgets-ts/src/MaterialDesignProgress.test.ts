import { describe, expect, it } from 'vitest';

import { cleanColor, progressState, type ProgressData } from './MaterialDesignProgress';

const data = (value: Partial<ProgressData>): ProgressData => value as ProgressData;

describe('progress normalization', () => {
    it('clamps numeric and boolean values into the configured range', () => {
        expect(progressState(25, data({ min: 0, max: 100 }))).toMatchObject({ percent: 25, raw: 25, label: '25 %' });
        expect(progressState(200, data({ min: 0, max: 100 }))).toMatchObject({ percent: 100, raw: 100 });
        expect(progressState(true, data({ min: 10, max: 20 }))).toMatchObject({ percent: 100, raw: 20 });
        expect(progressState(false, data({ min: 10, max: 20 }))).toMatchObject({ percent: 0, raw: 10 });
    });

    it('supports inverted, value and custom labels', () => {
        expect(progressState(25, data({ invertValue: true }))).toMatchObject({ percent: 75 });
        expect(progressState(12.34, data({ valueLabelStyle: 'progressValue', valueLabelUnit: ' °C', valueMaxDecimals: 1 })).label)
            .toMatch(/^12[,.]3 °C$/);
        expect(progressState(25, data({ valueLabelStyle: 'progressCustom', valueLabelCustom: '[#value] / [#percent]' })).label)
            .toBe('25 / 25');
    });

    it('selects condition colors and ignores unresolved theme tokens', () => {
        expect(progressState(50, data({ colorProgress: '#base', colorOneCondition: 20, colorTwoCondition: 70, colorOne: '#one' })).color).toBe('#one');
        expect(progressState(80, data({ colorProgress: '#base', colorOneCondition: 20, colorTwoCondition: 70, colorTwo: '#two' })).color).toBe('#two');
        expect(cleanColor('#mdwTheme:colors.test', '#fallback')).toBe('#fallback');
        expect(cleanColor('#123456', '#fallback')).toBe('#123456');
    });
});
