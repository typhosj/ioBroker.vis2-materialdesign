import { describe, expect, it } from 'vitest';

import { renderToStaticMarkup } from 'react-dom/server';

import MaterialDesignValue, { formatBoolean, formatNumber, formattedValue, type ValueData } from './MaterialDesignValue';

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
