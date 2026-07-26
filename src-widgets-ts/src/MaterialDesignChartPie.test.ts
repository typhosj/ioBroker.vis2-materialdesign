import { describe, expect, it } from 'vitest';
import { buildPieValues, pieCount, readJson } from './MaterialDesignChartPie';
import { datalabelsConfig, labelColorFor } from './MaterialDesignChartCanvas';

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

describe('datalabelsConfig', () => {
    type Cfg = {
        align: string; anchor: string; offset: number; rotation: number; textAlign: string;
        font: { family?: string; size: number };
        color: (context: { dataIndex: number; dataset?: { backgroundColor?: unknown } }) => string;
        display: boolean | ((context: { dataIndex: number }) => boolean | string);
        formatter: (value: unknown, context: { dataIndex: number }) => string;
    };
    const label = (index: number): { text: string; color?: string } => [{ text: '10 kWh' }, { text: '20 kWh', color: '#123456' }][index];
    const build = (data: Record<string, unknown>): Cfg => datalabelsConfig(data, label, { align: 'end', anchor: 'center' }) as Cfg;

    it('takes position, font and rotation from the saved options', () => {
        const cfg = build({ valuesPositionAlign: 'top', valuesPositionAnchor: 'end', valuesPositionOffset: 12, valuesRotation: 90, valuesTextAlign: 'left', valuesFontFamily: 'Jura', valuesFontSize: 20 });
        expect(cfg).toMatchObject({ align: 'top', anchor: 'end', offset: 12, rotation: 90, textAlign: 'left' });
        expect(cfg.font).toEqual({ family: 'Jura', size: 20 });
        expect(build({}).anchor).toBe('center');
    });

    it('honours showValues, including the auto mode and the step thinning', () => {
        expect(build({ showValues: 'showValuesOff' }).display).toBe(false);
        const on = build({}).display as (context: { dataIndex: number }) => boolean | string;
        expect(on({ dataIndex: 1 })).toBe(true);
        const auto = build({ showValues: 'showValuesAuto' }).display as (context: { dataIndex: number }) => boolean | string;
        expect(auto({ dataIndex: 0 })).toBe('auto');
        const stepped = build({ valuesSteps: 2 }).display as (context: { dataIndex: number }) => boolean | string;
        expect([stepped({ dataIndex: 0 }), stepped({ dataIndex: 1 }), stepped({ dataIndex: 2 })]).toEqual([true, false, true]);
    });

    it('renders the item text and prefers a saved color over the derived one', () => {
        const cfg = build({});
        expect(cfg.formatter(0, { dataIndex: 0 })).toBe('10 kWh');
        expect(cfg.color({ dataIndex: 1, dataset: { backgroundColor: ['#44739e', '#44739e'] } })).toBe('#123456');
        expect(cfg.color({ dataIndex: 0, dataset: { backgroundColor: ['#44739e', '#44739e'] } })).toBe('#ffffff');
    });
});
