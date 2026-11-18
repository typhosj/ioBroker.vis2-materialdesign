import { describe, expect, it } from 'vitest';

import { renderToStaticMarkup } from 'react-dom/server';

import MaterialDesignValue, { attributeValue, formatBoolean, formatNumber, formattedValue, type ValueData } from './MaterialDesignValue';
import { visLocale } from './widgetUtils';

const data = (overrides: Partial<ValueData>): ValueData => overrides as unknown as ValueData;

describe('MaterialDesignValue formatting', () => {
    describe('#value expressions', () => {
        it('calculates with the numeric value', () => {
            expect(formatNumber(21, data({ calculate: '#value * 2' }))).toBe('42');
        });
        // `#value` used to be spliced into the compiled source, so a state anyone could write ran as
        // code on every dashboard showing the widget.
        it('never executes code held in the state value', () => {
            const flag = globalThis as unknown as { __mdwPwned?: boolean };
            delete flag.__mdwPwned;
            formatNumber('(globalThis.__mdwPwned = true, 1)', data({ calculate: '#value * 1000' }));
            expect(flag.__mdwPwned).toBeUndefined();
        });
        // A string value compiled to a bare identifier and threw a ReferenceError out of render,
        // which blanks the whole VIS2 view.
        it('compares a string value without throwing', () => {
            expect(formatBoolean('on', data({ condition: '#value === "on"', textOnTrue: 'AN', textOnFalse: 'AUS' }))).toBe('AN');
        });
        it('keeps the raw value when the expression is broken', () => {
            expect(formatNumber(21, data({ calculate: '#value +' }))).toBe('21');
        });
    });

    describe('cleared number fields', () => {
        // VIS2 stores a cleared number field as '', and `Number('')` is a finite 0 — which used to
        // drop every decimal place the value had.
        it('treats an emptied maxDecimals as unset, not as zero', () => {
            expect(formatNumber(3.5, data({ maxDecimals: '' as unknown as number }))).toMatch(/^3[.,]5$/);
        });
    });

    describe('formatNumber', () => {
        it('appends the unit with a separating space', () => {
            expect(formatNumber(42, data({ valueLabelUnit: 'W' }))).toBe('42 W');
        });
        it('passes non-numeric values through as text', () => {
            expect(formatNumber('n/a', data({}))).toBe('n/a');
        });
        it('rounds to the configured maximum decimals', () => {
            expect(formatNumber(3.14159, data({ maxDecimals: 0 }))).toBe('3');
        });
        // max < min made Intl.NumberFormat throw, which blanked the whole VIS2 view.
        it('survives a maximum below the configured minimum', () => {
            expect(formatNumber(21.4, data({ minDecimals: 2, maxDecimals: 1 }))).toMatch(/^21[.,]40$/);
        });
    });

    describe('formatBoolean', () => {
        it('uses the on-text for truthy values (true, "1")', () => {
            expect(formatBoolean(true, data({ textOnTrue: 'ON', textOnFalse: 'OFF' }))).toBe('ON');
            expect(formatBoolean('1', data({ textOnTrue: 'ON', textOnFalse: 'OFF' }))).toBe('ON');
        });
        it('uses the off-text for falsy values', () => {
            expect(formatBoolean(false, data({ textOnTrue: 'ON', textOnFalse: 'OFF' }))).toBe('OFF');
        });
        it('falls back to the raw value when no text is configured', () => {
            expect(formatBoolean(true, data({}))).toBe('true');
        });
    });

    describe('formattedValue', () => {
        it('returns an empty string for null/undefined', () => {
            expect(formattedValue(undefined, data({}))).toBe('');
            expect(formattedValue(null, data({}))).toBe('');
        });
        it('formats booleans when targetType is boolean', () => {
            expect(formattedValue(false, data({ targetType: 'boolean', textOnFalse: 'off' }))).toBe('off');
        });
        it('applies overrideText with a #value placeholder', () => {
            expect(formattedValue('5', data({ targetType: 'string', overrideText: 'val=#value' }))).toBe('val=5');
        });
        it('splits piped results into indexed #value[n] placeholders', () => {
            expect(formattedValue('a|b', data({ targetType: 'string', overrideText: '#value[0]/#value[1]' }))).toBe('a/b');
        });
    });
});

describe('change effect and hidden-on-load', () => {
    const fixture = <T>(value: unknown): T => value as T;
    const widget = (rxData: Partial<ValueData>, value: unknown): MaterialDesignValue => {
        const instance = new MaterialDesignValue(fixture<ConstructorParameters<typeof MaterialDesignValue>[0]>({ context: {} }));
        instance.state = fixture<typeof instance.state>({ rxData, values: value === undefined ? {} : { 'test.0.v.val': value } });
        return instance;
    };
    const render = (instance: MaterialDesignValue): string =>
        renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<MaterialDesignValue['renderWidgetBody']>[0]>({})));
    const update = (instance: MaterialDesignValue, value: unknown): string => {
        instance.state = fixture<typeof instance.state>({ ...instance.state, values: { 'test.0.v.val': value } });
        return render(instance);
    };

    it('hides itself until the state arrives', () => {
        expect(render(widget({ oid: 'test.0.v', isHiddenOnLoad: true }, undefined))).toContain('visibility:hidden');
        expect(render(widget({ oid: 'test.0.v', isHiddenOnLoad: true }, 5))).not.toContain('visibility:hidden');
        expect(render(widget({ oid: 'test.0.v' }, undefined))).not.toContain('visibility:hidden');
    });

    it('flashes the effect color on a change, but not on the first value', () => {
        const instance = widget({ oid: 'test.0.v', changeEffectEnabled: true, effectFontColor: '#ff0000' }, 1);
        expect(render(instance)).not.toContain('#ff0000');
        expect(update(instance, 2)).toContain('#ff0000');
    });

    it('stays quiet while the effect is switched off', () => {
        const instance = widget({ oid: 'test.0.v', effectFontColor: '#ff0000' }, 1);
        render(instance);
        expect(update(instance, 2)).not.toContain('#ff0000');
    });
});

const fixture = <T>(value: unknown): T => value as T;
const at = (values: Record<string, unknown> | undefined, d: ValueData): unknown => attributeValue(fixture<Parameters<typeof attributeValue>[0]>({ values }), d);

// upstream-#180: the widget could only show `val`, never when the state last changed or who wrote it.
describe('MaterialDesignValue state attribute', () => {
    const LC = Date.UTC(2026, 10, 18, 9, 30, 15);
    const values = { 'test.0.v.val': 21.5, 'test.0.v.lc': LC, 'test.0.v.ts': LC + 1000, 'test.0.v.ack': true, 'test.0.v.q': 0, 'test.0.v.from': 'system.adapter.hm-rpc.0' };

    it('reads the chosen field and keeps val as the default', () => {
        expect(at(values, data({ oid: 'test.0.v' }))).toBe(21.5);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'val' }))).toBe(21.5);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'ack' }))).toBe(true);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'q' }))).toBe(0);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'from' }))).toBe('system.adapter.hm-rpc.0');
    });

    it('treats an unknown field name as val and reads nothing without an object ID', () => {
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'user' }))).toBe(21.5);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: '' }))).toBe(21.5);
        expect(at(values, data({ valueAttribute: 'lc' }))).toBeUndefined();
        expect(at(undefined, data({ oid: 'test.0.v', valueAttribute: 'lc' }))).toBeUndefined();
    });

    it('hands lc and ts to the converters in seconds', () => {
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'lc', convertToTimestamp: 'HH:mm' }))).toBe(LC / 1000);
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'ts', convertToDuration: 'hh:mm' }))).toBe(LC / 1000 + 1);
        expect(formatNumber(LC / 1000, data({ convertToTimestamp: 'YYYY-MM-DD' }))).toBe('2026-11-18');
    });

    it('shows lc and ts as local date and time when no converter is set', () => {
        expect(at(values, data({ oid: 'test.0.v', valueAttribute: 'lc' }))).toBe(new Date(LC).toLocaleString(visLocale()));
    });

    it('shows nothing for a missing or broken timestamp instead of 1970', () => {
        for (const broken of [undefined, null, '', 'abc', Number.NaN]) {
            expect(at({ 'test.0.v.lc': broken }, data({ oid: 'test.0.v', valueAttribute: 'lc' })), String(broken)).toBeUndefined();
        }
    });

    it('renders the last change in the widget', () => {
        const instance = new MaterialDesignValue(fixture<ConstructorParameters<typeof MaterialDesignValue>[0]>({ context: {} }));
        instance.state = fixture<typeof instance.state>({ rxData: { oid: 'test.0.v', valueAttribute: 'lc', convertToTimestamp: 'YYYY-MM-DD' }, values });
        expect(renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<MaterialDesignValue['renderWidgetBody']>[0]>({})))).toContain('2026-11-18');
    });

    it('offers the field as a select in the editor', () => {
        const field = MaterialDesignValue.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; options?: string[] }>).find(entry => entry.name === 'valueAttribute');
        expect(field?.options).toEqual(['val', 'lc', 'ts', 'ack', 'q', 'from']);
    });
});
