import { describe, expect, it } from 'vitest';

import { datalabelsConfig, layoutConfig, tooltipConfig, tooltipNumber } from './MaterialDesignChartCanvas';

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

describe('datalabelsConfig', () => {
    const label = (index: number): { text: string; color?: string } => ({ text: `#${index}`, color: index === 1 ? '#f00' : undefined });

    it('takes the look from the values* fields', () => {
        const config = datalabelsConfig({
            valuesPositionAlign: 'start',
            valuesPositionAnchor: 'center',
            valuesBackgroundColor: '#eee',
            valuesBorderColor: '#333',
            valuesBorderRadius: 4,
            valuesBorderWidth: 1,
            valuesFontFamily: 'Jura',
            valuesFontSize: 16,
            valuesPositionOffset: 8,
            valuesRotation: 45,
            valuesTextAlign: 'left',
        }, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect(config).toMatchObject({
            align: 'start', anchor: 'center', backgroundColor: '#eee', borderColor: '#333',
            borderRadius: 4, borderWidth: 1, offset: 8, rotation: 45, textAlign: 'left',
            font: { family: 'Jura', size: 16 },
        });
    });

    it('falls back to the per-chart defaults', () => {
        const config = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as Record<string, unknown>;
        expect(config).toMatchObject({ align: 'top', anchor: 'end', backgroundColor: null, offset: 4 });
    });

    it('uses the per-item color, then valuesFontColor, then black', () => {
        const color = datalabelsConfig({ valuesFontColor: '#0f0' }, label, { align: 'top', anchor: 'end' }) as { color: (c: { dataIndex: number }) => string };
        expect(color.color({ dataIndex: 1 })).toBe('#f00');
        expect(color.color({ dataIndex: 0 })).toBe('#0f0');
        const plain = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as { color: (c: { dataIndex: number }) => string };
        expect(plain.color({ dataIndex: 0 })).toBe('#000');
    });

    it('honours showValues and thins the labels out with valuesSteps', () => {
        expect((datalabelsConfig({ showValues: 'showValuesOff' }, label, { align: 'top', anchor: 'end' }) as { display: unknown }).display).toBe(false);
        const auto = datalabelsConfig({ showValues: 'showValuesAuto' }, label, { align: 'top', anchor: 'end' }) as { display: (c: { dataIndex: number }) => unknown };
        expect(auto.display({ dataIndex: 0 })).toBe('auto');
        const every3rd = datalabelsConfig({ valuesSteps: 3 }, label, { align: 'top', anchor: 'end' }) as { display: (c: { dataIndex: number }) => unknown };
        expect([0, 1, 2, 3].map(dataIndex => every3rd.display({ dataIndex }))).toEqual([true, false, false, true]);
    });

    it('prints the text the chart supplies', () => {
        const config = datalabelsConfig({}, label, { align: 'top', anchor: 'end' }) as { formatter: (v: unknown, c: { dataIndex: number }) => string };
        expect(config.formatter(42, { dataIndex: 2 })).toBe('#2');
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
