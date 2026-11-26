import { describe, expect, it } from 'vitest';

import { barBackground, cleanColor, progressState, type ProgressData } from './MaterialDesignProgress';

const data = (value: Partial<ProgressData>): ProgressData => value as ProgressData;

describe('progress normalization', () => {
    it('clamps numeric and boolean values into the configured range', () => {
        expect(progressState(25, data({ min: 0, max: 100 }))).toMatchObject({ percent: 25, raw: 25, label: '25 %' });
        expect(progressState(200, data({ min: 0, max: 100 }))).toMatchObject({ percent: 100, raw: 100 });
        expect(progressState(true, data({ min: 10, max: 20 }))).toMatchObject({ percent: 100, raw: 20 });
        expect(progressState(false, data({ min: 10, max: 20 }))).toMatchObject({ percent: 0, raw: 10 });
    });

    // VIS2 stores a cleared number field as '', and `Number('')` is a finite 0 that beat the
    // declared default: min = max = 0 pinned the bar at 0 % whatever the state said.
    it('falls back to the default range when min/max were emptied', () => {
        expect(progressState(25, data({ min: '' as unknown as number, max: '' as unknown as number })))
            .toMatchObject({ percent: 25, raw: 25 });
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

// The old widget laid Vuetify's stripes over the bar color in a square tile; the port replaced the bar
// color with the half-transparent stripe color (the track showed through on a light theme) and
// stretched the tile over the bar height, so the stripes broke at every tile edge.
describe('striped bar', () => {
    it('keeps a plain bar a plain color', () => {
        expect(barBackground(data({}), '#123456')).toEqual({ backgroundColor: '#123456', backgroundImage: 'none' });
        expect(barBackground(data({ progressStriped: false, stripDistance: 24 }), '#123456')).toEqual({ backgroundColor: '#123456', backgroundImage: 'none' });
    });

    it('lays the stripes over the bar color in a square 40 px tile by default', () => {
        expect(barBackground(data({ progressStriped: true }), '#123456')).toEqual({
            backgroundColor: '#123456',
            backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 25%, transparent 0, transparent 50%, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 75%, transparent 0, transparent)',
            backgroundSize: '40px 40px',
        });
    });

    it('applies angle, widths, color and distance', () => {
        const style = barBackground(data({ progressStriped: true, stripAngle: 45, stipWidth1: 10, stipWidth2: 30, stipWidth3: 60, progressStripedColor: '#ff0000', stripDistance: 24 }), '#123456');
        expect(style.backgroundImage).toBe('linear-gradient(45deg, #ff0000 10%, transparent 0, transparent 30%, #ff0000 0, #ff0000 60%, transparent 0, transparent)');
        expect(style.backgroundSize).toBe('24px 24px');
    });

    it('falls back to 40 px for an emptied, zero, negative or text distance', () => {
        for (const stripDistance of ['', 0, -5, 'abc'] as unknown as number[]) {
            expect(barBackground(data({ progressStriped: true, stripDistance }), '#123456').backgroundSize).toBe('40px 40px');
        }
    });

    it('ignores an unresolved theme token as stripe color', () => {
        expect(barBackground(data({ progressStriped: true, progressStripedColor: '#mdwTheme:colors.x' }), '#123456').backgroundImage).toContain('rgba(255, 255, 255, 0.25) 25%');
    });
});
