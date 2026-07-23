import { describe, expect, it } from 'vitest';

import { formatBoolean, formatNumber, formattedValue, replaceValue, type ValueData } from './MaterialDesignValue';

// BaseRxData carries required fields; test fixtures only set the value-specific keys.
const data = (overrides: Partial<ValueData>): ValueData => overrides as unknown as ValueData;

describe('MaterialDesignValue formatting', () => {
    describe('replaceValue', () => {
        it('substitutes #value with the numeric value', () => {
            expect(replaceValue('#value * 2', 21)).toBe('21 * 2');
        });
        it('falls back to the text form for non-numeric values', () => {
            expect(replaceValue('[#value]', 'abc')).toBe('[abc]');
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
