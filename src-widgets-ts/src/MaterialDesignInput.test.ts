import { describe, expect, it } from 'vitest';
import { activeLabelTranslateY, applyMask, outlinedNotchWidth } from './MaterialDesignInput';

describe('outlined input geometry', () => {
    it('uses VIS1 label offset unless a custom non-zero offset is configured', () => {
        expect(activeLabelTranslateY(undefined)).toBe(-16);
        expect(activeLabelTranslateY(0)).toBe(-16);
        expect(activeLabelTranslateY(-12)).toBe(-12);
    });

    it('keeps the outline notch wider than the scaled label', () => {
        expect(outlinedNotchWidth('Name', 16)).toBeCloseTo(37.76);
        expect(outlinedNotchWidth('', 16)).toBe(0);
    });
});

describe('applyMask (Input inputType:mask, VueTheMask parity)', () => {
    it('auto-inserts literal separators and keeps only matching chars', () => {
        expect(applyMask('31122024', '##/##/####')).toBe('31/12/2024');
        expect(applyMask('3112', '##/##/####')).toBe('31/12');
        expect(applyMask('3', '##/##/####')).toBe('3');
    });

    it('drops characters that do not match the token pattern', () => {
        expect(applyMask('3a1b', '##/##')).toBe('31'); // letters skipped for '#'
        expect(applyMask('12ab34', '##-##')).toBe('12-34');
    });

    it('supports letter tokens with case transforms', () => {
        expect(applyMask('ab12', 'AA##')).toBe('AB12'); // A => uppercase
        expect(applyMask('AB12', 'aa##')).toBe('ab12'); // a => lowercase
        expect(applyMask('a1b2', 'SN')).toBe('a1'); // S letter, N alnum
    });

    it('tolerates separators already typed by the user', () => {
        expect(applyMask('31/12/2024', '##/##/####')).toBe('31/12/2024');
    });

    it('stops at the mask length and returns raw when no mask', () => {
        expect(applyMask('123456', '##')).toBe('12');
        expect(applyMask('abc', '')).toBe('abc');
    });
});
