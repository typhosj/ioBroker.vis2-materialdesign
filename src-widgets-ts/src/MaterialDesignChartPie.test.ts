import { describe, expect, it } from 'vitest';
import { buildPieValues, pieCount, readJson } from './MaterialDesignChartPie';
import { labelColorFor } from './MaterialDesignChartCanvas';

describe('readJson', () => {
    it('parses a JSON array', () => {
        expect(readJson('[{"a":1}]')).toEqual([{ a: 1 }]);
    });
    it('returns null for a JSON object (not an array)', () => {
        expect(readJson('{"a":1}')).toBeNull();
    });
    it('returns null for invalid JSON', () => {
        expect(readJson('not json')).toBeNull();
        expect(readJson(undefined)).toBeNull();
    });
});

describe('pieCount', () => {
    it('uses the source array length when using jsonStringObject data', () => {
        expect(pieCount({}, [{}, {}])).toBe(2);
    });
    it('falls back to dataCount + 1 without a source', () => {
        expect(pieCount({ dataCount: 3 }, null)).toBe(4);
        expect(pieCount({}, null)).toBe(2);
    });
});

describe('buildPieValues', () => {
    it('reads value/label/color from indexed editor fields when there is no JSON source', () => {
        const data = { label0: 'Living Room', dataColor0: '#ff0000' };
        const values = buildPieValues(data, null, 1, [], () => 5);
        expect(values[0]).toEqual(expect.objectContaining({ label: 'Living Room', value: 5, color: '#ff0000' }));
    });

    it('prefers JSON source item fields over indexed editor fields', () => {
        const data = { label0: 'ignored' };
        const source = [{ label: 'From JSON', value: 9, dataColor: '#00ff00' }];
        const values = buildPieValues(data, source, 1, [], () => 0);
        expect(values[0]).toEqual(expect.objectContaining({ label: 'From JSON', value: 9, color: '#00ff00' }));
    });

    it('clamps negative values to zero (a pie slice cannot be negative)', () => {
        const values = buildPieValues({}, [{ value: -10 }], 1, [], () => 0);
        expect(values[0].value).toBe(0);
    });

    it('falls back to the color scheme, then globalColor, when no explicit color is set', () => {
        const withScheme = buildPieValues({}, null, 1, ['#123456'], () => 0);
        expect(withScheme[0].color).toBe('#123456');
        const withGlobal = buildPieValues({ globalColor: '#abcdef' }, null, 1, [], () => 0);
        expect(withGlobal[0].color).toBe('#abcdef');
    });
});

describe('labelColorFor', () => {
    const context = (background: unknown, index = 0): Parameters<typeof labelColorFor>[0] => ({ dataIndex: index, dataset: { backgroundColor: background } });

    it('picks a readable label color for the slice it is drawn on', () => {
        // Value labels sit on the slice, so a fixed color is unreadable on half of any palette.
        expect(labelColorFor(context(['#44739e', '#ffeb3b'], 0))).toBe('#ffffff');
        expect(labelColorFor(context(['#44739e', '#ffeb3b'], 1))).toBe('#1d1b20');
        expect(labelColorFor(context('#2e7d32'))).toBe('#ffffff');
    });

    it('resolves M3 tokens off the canvas and falls back when it cannot parse a color', () => {
        const canvas = document.createElement('canvas');
        canvas.style.setProperty('--md-sys-color-primary', '#6750a4');
        document.body.appendChild(canvas);
        expect(labelColorFor({ dataIndex: 0, dataset: { backgroundColor: 'var(--md-sys-color-primary)' }, chart: { canvas } })).toBe('#ffffff');
        expect(labelColorFor(context('rebeccapurple'))).toBe('#000');
        canvas.remove();
    });
});
