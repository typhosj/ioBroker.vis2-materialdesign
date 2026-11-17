/**
 * Pure logic of the on-screen keyboard widget: editing at the caret, key maps and layouts, and
 * the list of most typed words. No DOM here, so every rule is testable on its own.
 */

export type KeyMap = 'de' | 'en';
export type Layout = 'text' | 'number';
export type Special = 'shift' | 'backspace' | 'enter' | 'close' | 'symbols' | 'letters' | 'space' | 'decimal' | 'left' | 'right' | 'up' | 'down';
/** A character key, a special key, or `''` for an invisible spacer. */
export type KeyDef = string | { special: Special };
export type KeyAction = { kind: 'char'; text: string } | { kind: 'backspace' };

export interface EditResult {
    value: string;
    caret: number;
}

const isHigh = (code: number): boolean => code >= 0xd800 && code <= 0xdbff;
const isLow = (code: number): boolean => code >= 0xdc00 && code <= 0xdfff;

function clamp(value: string, pos: number | null): number {
    return pos === null || !Number.isFinite(pos) ? value.length : Math.max(0, Math.min(value.length, Math.trunc(pos)));
}

/**
 * Applies one key to a field value. A `null` position means the field has no selection API
 * (`type="number"`, `type="email"`): the key then works at the end.
 */
export function applyKey(value: string, selStart: number | null, selEnd: number | null, key: KeyAction): EditResult {
    let start = clamp(value, selStart);
    let end = clamp(value, selEnd);
    if (end < start) [start, end] = [end, start];
    if (key.kind === 'char') {
        return { value: value.slice(0, start) + key.text + value.slice(end), caret: start + key.text.length };
    }
    if (start !== end) return { value: value.slice(0, start) + value.slice(end), caret: start };
    if (start === 0) return { value, caret: 0 };
    const width = start >= 2 && isLow(value.charCodeAt(start - 1)) && isHigh(value.charCodeAt(start - 2)) ? 2 : 1;
    return { value: value.slice(0, start - width) + value.slice(start), caret: start - width };
}

/**
 * The caret after an arrow key, or `null` when the field has no selection API. A selection
 * collapses to its edge; otherwise the caret moves one code point.
 */
export function moveCaret(value: string, selStart: number | null, selEnd: number | null, direction: 'left' | 'right' | 'start' | 'end'): number | null {
    if (selStart === null || selEnd === null) return null;
    const start = Math.min(clamp(value, selStart), clamp(value, selEnd));
    const end = Math.max(clamp(value, selStart), clamp(value, selEnd));
    if (direction === 'start') return 0;
    if (direction === 'end') return value.length;
    if (start !== end) return direction === 'left' ? start : end;
    if (direction === 'left') {
        return start >= 2 && isLow(value.charCodeAt(start - 1)) && isHigh(value.charCodeAt(start - 2)) ? start - 2 : Math.max(0, start - 1);
    }
    return isHigh(value.charCodeAt(start)) && isLow(value.charCodeAt(start + 1)) ? start + 2 : Math.min(value.length, start + 1);
}

export function keyMapFor(setting: unknown, locale: string | undefined): KeyMap {
    if (setting === 'de' || setting === 'en') return setting;
    return (locale ?? '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

const NUMBER_MODES = new Set(['numeric', 'decimal', 'tel']);

/** `originalInputMode` is the page's value from before the widget set `inputmode="none"`. */
export function chooseLayout(setting: unknown, type: string, originalInputMode: string): Layout {
    if (setting === 'text' || setting === 'number') return setting;
    return type.toLowerCase() === 'number' || NUMBER_MODES.has(originalInputMode.toLowerCase()) ? 'number' : 'text';
}

/** A `type="number"` field rejects a comma, whatever the language. */
export function decimalChar(map: KeyMap, numberType: boolean): string {
    return numberType || map === 'en' ? '.' : ',';
}

/** Shift starts on in an empty field and after a full stop followed by a space. */
export function autoShift(value: string, caret: number): boolean {
    const before = value.slice(0, clamp(value, caret));
    return before.trim() === '' || /\.\s+$/.test(before);
}

/** The word right before the caret: from the last whitespace up to the caret. */
export function currentWord(value: string, caret: number): { start: number; word: string } {
    const end = clamp(value, caret);
    let start = end;
    while (start > 0 && !/\s/.test(value[start - 1])) start--;
    return { start, word: value.slice(start, end) };
}

/** Replaces the started word with a suggestion and puts a space behind it. */
export function replaceWord(value: string, caret: number, suggestion: string): EditResult {
    const end = clamp(value, caret);
    const { start } = currentWord(value, end);
    const inserted = `${suggestion} `;
    return { value: value.slice(0, start) + inserted + value.slice(end), caret: start + inserted.length };
}

const LETTERS: Record<KeyMap, string[][]> = {
    de: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnmß'].map(row => [...row]),
    en: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map(row => [...row]),
};
const SYMBOLS: string[][] = ['1234567890', '@#€&-+()/', ';:!?"\'_'].map(row => [...row]);

const ARROWS: KeyDef[] = [{ special: 'left' }, { special: 'up' }, { special: 'down' }, { special: 'right' }];

export function textRows(map: KeyMap, symbols: boolean, arrows = false): KeyDef[][] {
    const [first, second, third] = symbols ? SYMBOLS : LETTERS[map];
    return [
        first,
        second,
        [...(symbols ? [] : [{ special: 'shift' as const }]), ...third, { special: 'backspace' }],
        [{ special: symbols ? 'letters' : 'symbols' }, ',', { special: 'space' }, '.', ...(arrows ? ARROWS : []), { special: 'enter' }, { special: 'close' }],
    ];
}

export function numberRows(arrows = false): KeyDef[][] {
    const rows: KeyDef[][] = [
        ['1', '2', '3', { special: 'backspace' }],
        ['4', '5', '6', { special: 'enter' }],
        ['7', '8', '9', { special: 'close' }],
        ['-', '0', { special: 'decimal' }, ''],
    ];
    // Column five: up, down, left, right.
    return arrows ? rows.map((row, i) => [...row, ARROWS[[1, 2, 0, 3][i]]]) : rows;
}

export const NUMBER_ROWS = numberRows(false);

export interface WordEntry {
    /** Spelling typed last. */
    w: string;
    /** Count. */
    n: number;
    /** Time of last use, ms. */
    t: number;
}
/** Keyed by the lower-case word. */
export type Words = Record<string, WordEntry>;

// Known limit: at most 200 words; on overflow the rarest, then the longest unused word goes; words of the current entry are kept.
export const MAX_WORDS = 200;

const WORD = /[\p{L}\p{N}'-]+/gu;

export function wordsIn(text: string): string[] {
    return (text.match(WORD) ?? []).filter(word => [...word].length >= 3 && /\p{L}/u.test(word));
}

/** Reads the stored list; anything malformed becomes an empty list or loses the bad entry. */
export function parseWords(raw: unknown): Words {
    let value: unknown = raw;
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw);
        } catch {
            return {};
        }
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const words: Words = {};
    for (const entry of Object.values(value as Record<string, unknown>)) {
        const e = entry as Partial<WordEntry> | null;
        if (!e || typeof e !== 'object' || typeof e.w !== 'string' || typeof e.n !== 'number' || typeof e.t !== 'number') continue;
        if (!Number.isFinite(e.n) || e.n < 1 || !Number.isFinite(e.t)) continue;
        const key = e.w.toLowerCase();
        // The list is a plain object fed from a state anyone may write.
        if (key === '__proto__') continue;
        words[key] = { w: e.w, n: Math.floor(e.n), t: e.t };
    }
    return words;
}

export function learn(words: Words, text: string, now: number): Words {
    const next: Words = { ...words };
    for (const word of wordsIn(text)) {
        const key = word.toLowerCase();
        next[key] = { w: word, n: (Object.hasOwn(next, key) ? next[key].n : 0) + 1, t: now };
    }
    const keys = Object.keys(next);
    if (keys.length > MAX_WORDS) {
        keys.sort((a, b) => Number(next[a].t === now) - Number(next[b].t === now) || next[a].n - next[b].n || next[a].t - next[b].t)
            .slice(0, keys.length - MAX_WORDS)
            .forEach(key => delete next[key]);
    }
    return next;
}

export function forget(words: Words, word: string): Words {
    const next: Words = { ...words };
    delete next[word.toLowerCase()];
    return next;
}

/** Most frequent words starting with `prefix` (all words for an empty prefix), at most 10. */
export function suggest(words: Words, prefix: string, count: number): string[] {
    const wanted = prefix.toLowerCase();
    const limit = Math.max(1, Math.min(10, Math.trunc(Number.isFinite(count) ? count : 3)));
    const capital = prefix !== '' && prefix.charAt(0) !== prefix.charAt(0).toLowerCase();
    return Object.entries(words)
        .filter(([key]) => key.startsWith(wanted) && key !== wanted)
        .sort(([, a], [, b]) => b.n - a.n || b.t - a.t)
        .slice(0, limit)
        .map(([, entry]) => (capital ? entry.w.charAt(0).toUpperCase() + entry.w.slice(1) : entry.w));
}

/** How far the view has to move up so the field ends `gap` px above the keyboard. */
export function panOffset(fieldBottom: number, keyboardTop: number, gap = 8): number {
    return Math.max(0, Math.ceil(fieldBottom + gap - keyboardTop));
}
