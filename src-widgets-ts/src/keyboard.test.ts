import { describe, expect, it } from 'vitest';

import {
    applyKey,
    autoShift,
    chooseLayout,
    currentWord,
    decimalChar,
    forget,
    keyMapFor,
    learn,
    MAX_WORD_LENGTH,
    MAX_WORDS,
    moveCaret,
    numberRows,
    panOffset,
    parseWords,
    replaceWord,
    suggest,
    textRows,
    wordsIn,
    type Words,
} from './keyboard';

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
        const rows = numberRows();
        expect(rows.map(row => row.length)).toEqual([4, 4, 4, 4]);
        expect(rows.flat()).toContainEqual({ special: 'decimal' });
        expect(rows.flat()).toContain('-');
    });

    it('adds the arrow keys behind the dot and as a fifth number column', () => {
        const off = textRows('de', false);
        expect(textRows('de', false, false)).toEqual(off);
        expect(textRows('de', false, true)[3]).toEqual([
            { special: 'symbols' }, ',', { special: 'space' }, '.',
            { special: 'left' }, { special: 'up' }, { special: 'down' }, { special: 'right' },
            { special: 'enter' }, { special: 'close' },
        ]);
        expect(textRows('de', true, true)[3].slice(0, 1)).toEqual([{ special: 'letters' }]);
        expect(textRows('de', true, true)[3]).toContainEqual({ special: 'left' });
        expect(textRows('de', false, true).slice(0, 3)).toEqual(off.slice(0, 3));
        const rows = numberRows(true);
        expect(rows.map(row => row.length)).toEqual([5, 5, 5, 5]);
        expect(rows.map(row => row[3])).toEqual([{ special: 'backspace' }, { special: 'enter' }, { special: 'close' }, '']);
        expect(rows.map(row => row[4])).toEqual([{ special: 'up' }, { special: 'down' }, { special: 'left' }, { special: 'right' }]);
    });
});

describe('wordsIn', () => {
    it('takes words with a letter and at least three characters', () => {
        expect(wordsIn('Arzt am Montag, 14 Uhr')).toEqual(['Arzt', 'Montag', 'Uhr']);
        expect(wordsIn('Müll-Abfuhr über Straße')).toEqual(['Müll-Abfuhr', 'über', 'Straße']);
        expect(wordsIn("Kita's Fest")).toEqual(["Kita's", 'Fest']);
        expect(wordsIn('2026 1-2 --- ab 3G4')).toEqual(['3G4']);
        expect(wordsIn('')).toEqual([]);
    });

    it('skips a word longer than MAX_WORD_LENGTH characters', () => {
        const longest = 'ä'.repeat(MAX_WORD_LENGTH);
        expect(wordsIn(`${longest} ${longest}x Ende`)).toEqual([longest, 'Ende']);
    });
});

describe('parseWords', () => {
    const good = { arzt: { w: 'Arzt', n: 2, t: 10 } };

    it('accepts a JSON string and an object', () => {
        expect(parseWords(JSON.stringify(good))).toEqual(good);
        expect(parseWords(good)).toEqual(good);
    });

    it('turns anything else into an empty list', () => {
        for (const raw of [null, undefined, '', 'no json', '[1,2]', [1, 2], 5, true, '"text"']) {
            expect(parseWords(raw)).toEqual({});
        }
    });

    it('drops broken entries and re-keys by the lower-case word', () => {
        const raw = {
            a: null,
            b: { w: 'Bad', n: '3', t: 1 },
            c: { w: 'Neg', n: 0, t: 1 },
            d: { w: 'Inf', n: Number.POSITIVE_INFINITY, t: 1 },
            e: { w: 5, n: 1, t: 1 },
            wrongkey: { w: 'Fest', n: 1.7, t: 3 },
        };
        expect(parseWords(raw)).toEqual({ fest: { w: 'Fest', n: 1, t: 3 } });
    });

    it('never sets the prototype from a state value', () => {
        const words = parseWords('{"x":{"w":"__proto__","n":1,"t":1}}');
        expect(Object.keys(words)).toEqual([]);
        expect(Object.getPrototypeOf(words)).toBe(Object.prototype);
    });

    it('keeps at most MAX_WORDS of a foreign list, the most typed ones', () => {
        const raw: Record<string, unknown> = {};
        for (let i = 0; i < MAX_WORDS + 50; i++) raw[`k${i}`] = { w: `wort${i}`, n: i + 1, t: i };
        const words = parseWords(JSON.stringify(raw));
        expect(Object.keys(words)).toHaveLength(MAX_WORDS);
        expect(words.wort49).toBeUndefined();
        expect(words.wort50).toBeDefined();
        expect(words[`wort${MAX_WORDS + 49}`]).toBeDefined();

        const exact: Record<string, unknown> = {};
        for (let i = 0; i < MAX_WORDS; i++) exact[`k${i}`] = { w: `wort${i}`, n: 1, t: i };
        expect(Object.keys(parseWords(exact))).toHaveLength(MAX_WORDS);
    });

    it('drops a word longer than MAX_WORD_LENGTH characters', () => {
        const longest = 'ü'.repeat(MAX_WORD_LENGTH);
        const words = parseWords({ a: { w: longest, n: 1, t: 1 }, b: { w: `${longest}x`, n: 1, t: 1 } });
        expect(Object.keys(words)).toEqual([longest]);
    });

    it('keeps the higher count when two entries spell the same word', () => {
        expect(parseWords({ a: { w: 'Arzt', n: 7, t: 1 }, b: { w: 'ARZT', n: 2, t: 9 } })).toEqual({ arzt: { w: 'Arzt', n: 7, t: 1 } });
        expect(parseWords({ a: { w: 'arzt', n: 2, t: 1 }, b: { w: 'Arzt', n: 3, t: 2 } })).toEqual({ arzt: { w: 'Arzt', n: 3, t: 2 } });
    });
});

describe('learn and forget', () => {
    it('counts words case-insensitively and keeps the latest spelling', () => {
        let words: Words = {};
        words = learn(words, 'Arzt Termin', 1);
        words = learn(words, 'arzt', 2);
        expect(words.arzt).toEqual({ w: 'arzt', n: 2, t: 2 });
        expect(words.termin).toEqual({ w: 'Termin', n: 1, t: 1 });
    });

    it('does not change the list it got', () => {
        const before: Words = { arzt: { w: 'Arzt', n: 1, t: 1 } };
        learn(before, 'Arzt', 2);
        expect(before.arzt.n).toBe(1);
    });

    it('treats words named like Object members as plain words', () => {
        const words = learn({}, 'constructor constructor', 1);
        expect(words.constructor).toEqual({ w: 'constructor', n: 2, t: 1 });
    });

    it('keeps at most MAX_WORDS, dropping the rarest and then the oldest', () => {
        let words: Words = {};
        for (let i = 0; i < MAX_WORDS; i++) words[`wort${i}`] = { w: `wort${i}`, n: 2, t: i };
        words.selten = { w: 'selten', n: 1, t: 1000 };
        words = learn(words, 'neuwort', 2000);
        expect(Object.keys(words)).toHaveLength(MAX_WORDS);
        // 202 keys: "selten" (n 1) and the oldest n = 2 word (wort0) go, the new word stays.
        expect(words.selten).toBeUndefined();
        expect(words.wort0).toBeUndefined();
        expect(words.neuwort).toBeDefined();
        // Exactly MAX_WORDS stays untouched.
        expect(Object.keys(learn({}, 'eins zwei', 1))).toHaveLength(2);
    });

    it('keeps a new word in a full list of frequent words', () => {
        let words: Words = {};
        for (let i = 0; i < MAX_WORDS; i++) words[`wort${i}`] = { w: `wort${i}`, n: 2, t: i + 1 };
        words = learn(words, 'neuwort', 2000);
        expect(Object.keys(words)).toHaveLength(MAX_WORDS);
        expect(words.neuwort).toBeDefined();
        expect(words.wort0).toBeUndefined();
        expect(words.wort1).toBeDefined();
    });

    it('forgets a word in any case and leaves the input alone', () => {
        const words: Words = { arzt: { w: 'Arzt', n: 3, t: 1 } };
        expect(forget(words, 'ARZT')).toEqual({});
        expect(words.arzt).toBeDefined();
        expect(forget(words, 'fehlt')).toEqual(words);
    });
});

describe('suggest', () => {
    const words: Words = {
        arzt: { w: 'Arzt', n: 5, t: 1 },
        arzttermin: { w: 'Arzttermin', n: 5, t: 2 },
        arbeit: { w: 'Arbeit', n: 2, t: 9 },
        müll: { w: 'Müll', n: 9, t: 1 },
    };

    it('orders by count, then by last use, with "frequent"', () => {
        expect(suggest(words, '', 10, 'frequent')).toEqual(['Müll', 'Arzttermin', 'Arzt', 'Arbeit']);
    });

    describe('order', () => {
        const day = 24 * 60 * 60 * 1000;
        const now = 400 * day;
        // Count halves in worth every 30 days of disuse: Milch 8 → 1 after 90 days, Brot 4 → 2.83
        // after 15, Käse 2 → 1.95 after 1, Eier 1 today.
        const shop: Words = {
            milch: { w: 'Milch', n: 8, t: now - 90 * day },
            brot: { w: 'Brot', n: 4, t: now - 15 * day },
            eier: { w: 'Eier', n: 1, t: now },
            käse: { w: 'Käse', n: 2, t: now - day },
        };

        it('weighs the count by the time since last use with "frecency"; a tie goes to the newer word', () => {
            expect(suggest(shop, '', 10, 'frecency', now)).toEqual(['Brot', 'Käse', 'Eier', 'Milch']);
        });

        it('orders by count with "frequent" and by last use with "recent"', () => {
            expect(suggest(shop, '', 10, 'frequent', now)).toEqual(['Milch', 'Brot', 'Käse', 'Eier']);
            expect(suggest(shop, '', 10, 'recent', now)).toEqual(['Eier', 'Käse', 'Brot', 'Milch']);
        });

        it('breaks a tie of "recent" by count', () => {
            const same: Words = { a: { w: 'a', n: 1, t: now }, b: { w: 'b', n: 3, t: now } };
            expect(suggest(same, '', 10, 'recent', now)).toEqual(['b', 'a']);
        });

        it('uses "frecency" by default and for an unknown order', () => {
            const frecency = ['Brot', 'Käse', 'Eier', 'Milch'];
            expect(suggest(shop, '', 10, undefined, now)).toEqual(frecency);
            expect(suggest(shop, '', 10, 'bogus', now)).toEqual(frecency);
            expect(suggest(shop, '', 10, '', now)).toEqual(frecency);
        });

        it('does not boost a word whose last use lies in the future (clock of another device)', () => {
            const skew: Words = { ahead: { w: 'ahead', n: 1, t: now + 365 * day }, today: { w: 'today', n: 2, t: now } };
            expect(suggest(skew, '', 10, 'frecency', now)).toEqual(['today', 'ahead']);
        });

        it('still ranks words unused for decades instead of collapsing them to zero', () => {
            const old: Words = { a: { w: 'a', n: 2, t: 0 }, b: { w: 'b', n: 5, t: 0 } };
            expect(suggest(old, '', 10, 'frecency', 100 * 365 * day)).toEqual(['b', 'a']);
        });

        it('filters by the typed part in every order', () => {
            for (const order of ['frecency', 'frequent', 'recent']) {
                expect(suggest(shop, 'b', 10, order, now)).toEqual(['Brot']);
            }
        });
    });

    it('filters by prefix ignoring case and leaves out the complete word', () => {
        expect(suggest(words, 'ar', 10)).toEqual(['arzttermin', 'arzt', 'arbeit'].map(w => words[w].w));
        expect(suggest(words, 'arzt', 10)).toEqual(['Arzttermin']);
        expect(suggest(words, 'xyz', 10)).toEqual([]);
    });

    it('starts with a capital when the typed part does', () => {
        const lower: Words = { arzt: { w: 'arzt', n: 1, t: 1 } };
        expect(suggest(lower, 'A', 3)).toEqual(['Arzt']);
        expect(suggest(lower, 'a', 3)).toEqual(['arzt']);
    });

    it('clamps the count to 1..10', () => {
        expect(suggest(words, '', 0)).toHaveLength(1);
        expect(suggest(words, '', 2)).toHaveLength(2);
        expect(suggest(words, '', Number.NaN)).toHaveLength(3);
        const many: Words = {};
        for (let i = 0; i < 20; i++) many[`wort${i}`] = { w: `wort${i}`, n: 1, t: i };
        expect(suggest(many, '', 50)).toHaveLength(10);
    });
});

describe('panOffset', () => {
    it('moves just enough to put the field 8 px above the keyboard', () => {
        expect(panOffset(500, 400)).toBe(108);
        expect(panOffset(392, 400)).toBe(0);
        expect(panOffset(300, 400)).toBe(0);
        expect(panOffset(500.2, 400)).toBe(109);
        expect(panOffset(500, 400, 0)).toBe(100);
    });
});

describe('moveCaret', () => {
    it('moves one position and stays inside the text', () => {
        expect(moveCaret('abc', 0, 0, 'left')).toBe(0);
        expect(moveCaret('abc', 3, 3, 'right')).toBe(3);
        expect(moveCaret('abc', 1, 1, 'left')).toBe(0);
        expect(moveCaret('abc', 1, 1, 'right')).toBe(2);
        expect(moveCaret('', 0, 0, 'right')).toBe(0);
    });

    it('collapses a selection to its edge, also one given backwards', () => {
        expect(moveCaret('abcdef', 1, 4, 'left')).toBe(1);
        expect(moveCaret('abcdef', 1, 4, 'right')).toBe(4);
        expect(moveCaret('abcdef', 4, 1, 'left')).toBe(1);
        expect(moveCaret('abcdef', 4, 1, 'right')).toBe(4);
    });

    it('steps over a surrogate pair as one character', () => {
        expect(moveCaret('a😀b', 3, 3, 'left')).toBe(1);
        expect(moveCaret('a😀b', 1, 1, 'right')).toBe(3);
        expect(moveCaret('a😀b', 2, 2, 'left')).toBe(1);
    });

    it('goes to the start or the end', () => {
        expect(moveCaret('abc', 2, 2, 'start')).toBe(0);
        expect(moveCaret('abc', 1, 2, 'end')).toBe(3);
    });

    it('does nothing without a selection API', () => {
        for (const direction of ['left', 'right', 'start', 'end'] as const) {
            expect(moveCaret('abc', null, null, direction)).toBeNull();
            expect(moveCaret('abc', 1, null, direction)).toBeNull();
        }
    });

    it('clamps NaN and out-of-range positions', () => {
        expect(moveCaret('abc', 99, 99, 'left')).toBe(2);
        expect(moveCaret('abc', -5, -5, 'right')).toBe(1);
        expect(moveCaret('abc', Number.NaN, Number.NaN, 'left')).toBe(2);
        expect(moveCaret('abc', 99, 99, 'right')).toBe(3);
    });
});
