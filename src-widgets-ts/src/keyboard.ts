/**
 * Pure logic of the on-screen keyboard widget: editing at the caret, key maps and layouts, and
 * the list of most typed words. No DOM here, so every rule is testable on its own.
 */

export type KeyMap = 'de' | 'en';
export type Layout = 'text' | 'number';
export type Special = 'shift' | 'backspace' | 'enter' | 'close' | 'symbols' | 'letters' | 'space' | 'decimal';
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

export function textRows(map: KeyMap, symbols: boolean): KeyDef[][] {
    const [first, second, third] = symbols ? SYMBOLS : LETTERS[map];
    return [
        first,
        second,
        [...(symbols ? [] : [{ special: 'shift' as const }]), ...third, { special: 'backspace' }],
        [{ special: symbols ? 'letters' : 'symbols' }, ',', { special: 'space' }, '.', { special: 'enter' }, { special: 'close' }],
    ];
}

export const NUMBER_ROWS: KeyDef[][] = [
    ['1', '2', '3', { special: 'backspace' }],
    ['4', '5', '6', { special: 'enter' }],
    ['7', '8', '9', { special: 'close' }],
    ['-', '0', { special: 'decimal' }, ''],
];
