import { describe, expect, it } from 'vitest';

import { exactItem, isComposing, moveHighlight, writeValue } from './autocomplete';

const list = [
    { value: 'w', text: 'Wohnzimmer' },
    { value: 2, text: 'Two' },
    { value: 'k', text: 'Küche' },
];

describe('exactItem', () => {
    it('matches the whole text, ignoring case and surrounding spaces', () => {
        expect(exactItem(list, 'two')?.value).toBe(2);
        expect(exactItem(list, '  WOHNZIMMER ')?.value).toBe('w');
    });

    it('ignores partial matches, an empty list and empty text', () => {
        expect(exactItem(list, 'Wohn')).toBeUndefined();
        expect(exactItem([], 'Two')).toBeUndefined();
        expect(exactItem(list, '')).toBeUndefined();
        expect(exactItem(list, '   ')).toBeUndefined();
    });
});

describe('moveHighlight', () => {
    it('starts at the first or last item when nothing is highlighted', () => {
        expect(moveHighlight(list, undefined, 1)).toBe('w');
        expect(moveHighlight(list, undefined, -1)).toBe('k');
    });

    it('steps and wraps at both ends', () => {
        expect(moveHighlight(list, 'w', 1)).toBe('2');
        expect(moveHighlight(list, 'k', 1)).toBe('w');
        expect(moveHighlight(list, 'w', -1)).toBe('k');
    });

    it('treats a highlight that is no longer visible as none', () => {
        expect(moveHighlight(list, 'gone', 1)).toBe('w');
        expect(moveHighlight(list, 'gone', -1)).toBe('k');
    });

    it('returns nothing for an empty list', () => {
        expect(moveHighlight([], 'w', 1)).toBeUndefined();
    });
});

describe('isComposing', () => {
    it('detects an input method composition', () => {
        expect(isComposing({ nativeEvent: { isComposing: true } })).toBe(true);
        expect(isComposing({ keyCode: 229 })).toBe(true);
    });

    it('lets a plain key through, also without a native event', () => {
        expect(isComposing({ nativeEvent: { isComposing: false }, keyCode: 13 })).toBe(false);
        expect(isComposing({})).toBe(false);
    });
});

describe('writeValue', () => {
    it('writes the value of an item whose text matches exactly', () => {
        expect(writeValue(list, 'two')).toBe(2);
        expect(writeValue(list, 'wohnzimmer')).toBe('w');
    });

    it('writes the raw typed text otherwise', () => {
        expect(writeValue(list, 'Wo')).toBe('Wo');
        expect(writeValue(list, '')).toBe('');
        expect(writeValue(list, ' Neu ')).toBe(' Neu ');
    });
});
