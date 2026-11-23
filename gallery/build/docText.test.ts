import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { firstParagraph } from './docText';
import { repoRoot } from './paths';

describe('firstParagraph', () => {
    it('skips the heading and the navigation line and joins wrapped lines', () => {
        expect(firstParagraph('# Title\n\n[User guide](../README.md) › x\n\nA child-view container that embeds\ncomplete views.\n\nTemplate ids: …')).toBe('A child-view container that embeds complete views.');
    });
    it('strips markdown links and inline code', () => {
        expect(firstParagraph('# T\n\nUses [states](x.md) and `oid`.\n')).toBe('Uses states and oid.');
    });
    it('returns an empty string when there is no paragraph', () => {
        expect(firstParagraph('# Only a heading\n')).toBe('');
    });
    it('reads the real calendar page in both languages', () => {
        expect(firstParagraph(readFileSync(join(repoRoot, 'doc/en/widgets/calendar.md'), 'utf8'))).toMatch(/calendar/i);
        expect(firstParagraph(readFileSync(join(repoRoot, 'doc/de/widgets/calendar.md'), 'utf8'))).not.toBe('');
    });
});
