import { describe, expect, it } from 'vitest';

import { nextLimit } from './IconFilePicker';

describe('icon picker paging', () => {
    it('grows the grid near the bottom and leaves it alone elsewhere', () => {
        const box = { scrollHeight: 4000, clientHeight: 600, scrollTop: 0 };
        expect(nextLimit({ ...box, scrollTop: 0 }, 400)).toBe(400);
        expect(nextLimit({ ...box, scrollTop: 3200 }, 400)).toBe(400);
        expect(nextLimit({ ...box, scrollTop: 3250 }, 400)).toBe(800);
        expect(nextLimit({ ...box, scrollTop: 3400 }, 800)).toBe(1200);
    });
});
