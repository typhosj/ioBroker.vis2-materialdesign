import { describe, expect, it } from 'vitest';

import { applyKey, autoShift, chooseLayout, currentWord, decimalChar, keyMapFor, NUMBER_ROWS, replaceWord, textRows } from './keyboard';

describe('applyKey', () => {
    it('inserts at the caret and moves the caret behind the text', () => {
        expect(applyKey('Arzt', 2, 2, { kind: 'char', text: 'x' })).toEqual({ value: 'Arxzt', caret: 3 });
        expect(applyKey('', 0, 0, { kind: 'char', text: 'A' })).toEqual({ value: 'A', caret: 1 });
        expect(applyKey('ab', 2, 2, { kind: 'char', text: 'c' })).toEqual({ value: 'abc', caret: 3 });
    });

    it('replaces a selection, also one given backwards', () => {
        expect(applyKey('Zahnarzt', 0, 4, { kind: 'char', text: 'Tier' })).toEqual({ value: 'Tierarzt', caret: 4 });
        expect(applyKey('Zahnarzt', 4, 0, { kind: 'char', text: 'Tier' })).toEqual({ value: 'Tierarzt', caret: 4 });
        expect(applyKey('Zahnarzt', 0, 4, { kind: 'backspace' })).toEqual({ value: 'arzt', caret: 0 });
    });

    it('deletes one character before the caret and nothing at position 0', () => {
        expect(applyKey('abc', 2, 2, { kind: 'backspace' })).toEqual({ value: 'ac', caret: 1 });
        expect(applyKey('abc', 0, 0, { kind: 'backspace' })).toEqual({ value: 'abc', caret: 0 });
        expect(applyKey('', 0, 0, { kind: 'backspace' })).toEqual({ value: '', caret: 0 });
    });

    it('deletes a surrogate pair as one character', () => {
        expect(applyKey('a😀', 3, 3, { kind: 'backspace' })).toEqual({ value: 'a', caret: 1 });
        // A lone low surrogate is only one unit wide.
        expect(applyKey('a\udc00', 2, 2, { kind: 'backspace' })).toEqual({ value: 'a', caret: 1 });
    });

    it('works at the end without a selection API (type="number")', () => {
        expect(applyKey('12', null, null, { kind: 'char', text: '3' })).toEqual({ value: '123', caret: 3 });
        expect(applyKey('12', null, null, { kind: 'backspace' })).toEqual({ value: '1', caret: 1 });
    });

    it('clamps positions outside the value', () => {
        expect(applyKey('ab', 99, 99, { kind: 'char', text: 'c' })).toEqual({ value: 'abc', caret: 3 });
        expect(applyKey('ab', -5, -5, { kind: 'char', text: 'c' })).toEqual({ value: 'cab', caret: 1 });
        expect(applyKey('ab', Number.NaN, Number.NaN, { kind: 'backspace' })).toEqual({ value: 'a', caret: 1 });
    });
});

describe('keyMapFor', () => {
    it('takes an explicit map and otherwise follows the language', () => {
        expect(keyMapFor('de', 'en')).toBe('de');
        expect(keyMapFor('en', 'de-DE')).toBe('en');
        expect(keyMapFor('auto', 'de-DE')).toBe('de');
        expect(keyMapFor('auto', 'DE')).toBe('de');
        expect(keyMapFor('auto', 'fr')).toBe('en');
        expect(keyMapFor(undefined, undefined)).toBe('en');
        expect(keyMapFor('xx', 'de')).toBe('de');
    });
});

describe('chooseLayout', () => {
    it('honours an explicit layout', () => {
        expect(chooseLayout('text', 'number', 'numeric')).toBe('text');
        expect(chooseLayout('number', 'text', '')).toBe('number');
    });

    it('picks the number pad from type or the original inputmode', () => {
        expect(chooseLayout('auto', 'number', '')).toBe('number');
        expect(chooseLayout('auto', 'NUMBER', '')).toBe('number');
        expect(chooseLayout('auto', 'text', 'numeric')).toBe('number');
        expect(chooseLayout('auto', 'text', 'decimal')).toBe('number');
        expect(chooseLayout('auto', 'text', 'tel')).toBe('number');
        expect(chooseLayout('auto', 'text', 'none')).toBe('text');
        expect(chooseLayout('auto', 'email', '')).toBe('text');
        expect(chooseLayout(undefined, 'text', '')).toBe('text');
    });
});

describe('decimalChar', () => {
    it('uses a dot in number fields and the separator of the map elsewhere', () => {
        expect(decimalChar('de', true)).toBe('.');
        expect(decimalChar('de', false)).toBe(',');
        expect(decimalChar('en', false)).toBe('.');
    });
});

describe('autoShift', () => {
    it('is on in an empty field and after a full stop and a space', () => {
        expect(autoShift('', 0)).toBe(true);
        expect(autoShift('   ', 3)).toBe(true);
        expect(autoShift('Hallo. ', 7)).toBe(true);
        expect(autoShift('Hallo.  ', 8)).toBe(true);
    });

    it('is off inside a sentence and right after the stop', () => {
        expect(autoShift('Hallo', 5)).toBe(false);
        expect(autoShift('Hallo.', 6)).toBe(false);
        expect(autoShift('Hallo ', 6)).toBe(false);
        // Only the text before the caret counts.
        expect(autoShift('Hallo', 0)).toBe(true);
        expect(autoShift('ab', 99)).toBe(false);
    });
});

describe('currentWord and replaceWord', () => {
    it('finds the started word before the caret', () => {
        expect(currentWord('Termin Ar', 9)).toEqual({ start: 7, word: 'Ar' });
        expect(currentWord('Termin ', 7)).toEqual({ start: 7, word: '' });
        expect(currentWord('', 0)).toEqual({ start: 0, word: '' });
        expect(currentWord('Arzt', 2)).toEqual({ start: 0, word: 'Ar' });
        expect(currentWord('a\nbc', 4)).toEqual({ start: 2, word: 'bc' });
        expect(currentWord('ab', 99)).toEqual({ start: 0, word: 'ab' });
    });

    it('replaces the started word and adds a space', () => {
        expect(replaceWord('Termin Ar', 9, 'Arzttermin')).toEqual({ value: 'Termin Arzttermin ', caret: 18 });
        expect(replaceWord('', 0, 'Arzt')).toEqual({ value: 'Arzt ', caret: 5 });
        // Text behind the caret stays.
        expect(replaceWord('Ar morgen', 2, 'Arzt')).toEqual({ value: 'Arzt  morgen', caret: 5 });
    });
});

describe('key rows', () => {
    it('lays out QWERTZ with umlauts and QWERTY without', () => {
        const de = textRows('de', false);
        expect(de[0]).toEqual([...'qwertzuiopü']);
        expect(de[1]).toEqual([...'asdfghjklöä']);
        expect(de[2]).toEqual([{ special: 'shift' }, ...'yxcvbnmß', { special: 'backspace' }]);
        expect(de[3]).toEqual([{ special: 'symbols' }, ',', { special: 'space' }, '.', { special: 'enter' }, { special: 'close' }]);
        const en = textRows('en', false);
        expect(en[0]).toEqual([...'qwertyuiop']);
        expect(en.flat()).not.toContain('ß');
    });

    it('has a symbol layer without shift and a way back', () => {
        const symbols = textRows('de', true);
        expect(symbols[0]).toEqual([...'1234567890']);
        expect(symbols.flat()).toContain('€');
        expect(symbols.flat()).not.toContainEqual({ special: 'shift' });
        expect(symbols[3][0]).toEqual({ special: 'letters' });
    });

    it('has four equally long number rows', () => {
        expect(NUMBER_ROWS.map(row => row.length)).toEqual([4, 4, 4, 4]);
        expect(NUMBER_ROWS.flat()).toContainEqual({ special: 'decimal' });
        expect(NUMBER_ROWS.flat()).toContain('-');
    });
});
