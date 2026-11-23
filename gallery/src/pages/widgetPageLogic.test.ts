import { describe, expect, it } from 'vitest';

import { parseDatapointInput, parseStoredData, pickVariant } from './widgetPageLogic';

const variant = (id: string): { id: string; label: string; data: Record<string, unknown>; size: { width: number; height: number } } => ({ id, label: id, data: {}, size: { width: 1, height: 1 } });
const entry = { variants: [variant('default'), variant('b')] };

describe('pickVariant', () => {
    it('returns the variant with the id', () => expect(pickVariant(entry, 'b').id).toBe('b'));
    it.each([['unknown', 'nope'], ['undefined', undefined], ['empty', '']])('falls back to the first variant for %s', (_n, id) => expect(pickVariant(entry, id).id).toBe('default'));
});

describe('parseDatapointInput', () => {
    it.each([['42', 42], ['-0.5', -0.5], ['1e3', 1000]])('accepts number %s', (raw, value) => expect(parseDatapointInput(5, raw)).toEqual({ ok: true, value }));
    it.each(['', '  ', 'abc', 'NaN', 'Infinity'])('rejects number input %j', raw => expect(parseDatapointInput(5, raw)).toEqual({ ok: false }));
    it.each([['true', true], ['false', false]])('accepts boolean %s', (raw, value) => expect(parseDatapointInput(true, raw)).toEqual({ ok: true, value }));
    it.each(['TRUE', '1', ''])('rejects boolean input %j', raw => expect(parseDatapointInput(false, raw)).toEqual({ ok: false }));
    it.each(['', 'x'])('keeps string input %j as typed', raw => expect(parseDatapointInput('a', raw)).toEqual({ ok: true, value: raw }));
    it('treats an unset state as a string', () => expect(parseDatapointInput(undefined, 'x')).toEqual({ ok: true, value: 'x' }));
});

describe('parseStoredData', () => {
    it.each([null, '', 'not json', '5', '"x"', '[]', 'null'])('ignores %j', raw => expect(parseStoredData(raw)).toBeUndefined());
    it('returns a plain object', () => expect(parseStoredData('{"a":1}')).toEqual({ a: 1 }));
});
