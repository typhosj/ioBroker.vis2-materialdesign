import { describe, expect, it } from 'vitest';

import { layoutConfig, tooltipConfig, tooltipNumber } from './MaterialDesignChartCanvas';

describe('layoutConfig', () => {
    it('emits only the sides the editor filled in', () => {
        expect(layoutConfig({ chartPaddingTop: 10, chartPaddingLeft: '', chartPaddingBottom: '4' })).toEqual({
            padding: { top: 10, bottom: 4 },
        });
    });

    it('stays undefined when no padding is set, so chart.js keeps its own', () => {
        expect(layoutConfig({ chartPaddingTop: '', chartPaddingLeft: null })).toBeUndefined();
    });
});

describe('tooltipConfig geometry', () => {
    it('passes the box geometry through under the chart.js v2 names', () => {
        const config = tooltipConfig({
            tooltipArrowSize: 8,
            tooltipDistanceToBar: 6,
            tooltipBoxRadius: 3,
            tooltipXpadding: 12,
            tooltipYpadding: 9,
            tooltipTitleMarginBottom: 2,
            tooltipShowColorBox: false,
        }) as Record<string, unknown>;
        expect(config).toMatchObject({
            caretSize: 8,
            caretPadding: 6,
            cornerRadius: 3,
            xPadding: 12,
            yPadding: 9,
            titleMarginBottom: 2,
            displayColors: false,
        });
    });

    it('leaves unset geometry out instead of overwriting the chart.js defaults', () => {
        const config = tooltipConfig({ tooltipArrowSize: '', tooltipShowColorBox: '' }) as Record<string, unknown>;
        expect('caretSize' in config).toBe(false);
        expect('displayColors' in config).toBe(false);
    });
});

describe('tooltipNumber', () => {
    it('formats with the configured decimals', () => {
        expect(tooltipNumber({ tooltipValueMinDecimals: 2, tooltipValueMaxDecimals: 2 }, 3.14159)).toBe((3.14159).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    });

    it('returns undefined without decimals set, so the caller keeps its own text', () => {
        expect(tooltipNumber({}, 3.14159)).toBeUndefined();
        expect(tooltipNumber({ tooltipValueMaxDecimals: 1 }, 'not a number')).toBeUndefined();
    });
});
