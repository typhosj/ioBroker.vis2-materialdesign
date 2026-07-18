import { describe, expect, it } from 'vitest';
import { snapToStep } from './MaterialDesignProgress';

describe('snapToStep (slider #222 decimal precision)', () => {
    it('snaps to a decimal step without binary-float noise', () => {
        expect(snapToStep(0.3, 0.1)).toBe(0.3); // Math.round(0.3/0.1)*0.1 = 0.30000000000000004
        expect(snapToStep(0.29, 0.1)).toBe(0.3);
        expect(snapToStep(0.74, 0.1)).toBe(0.7);
        expect(snapToStep(1.25, 0.5)).toBe(1.5);
        expect(snapToStep(2.04, 0.01)).toBe(2.04);
    });

    it('keeps integer steps integer', () => {
        expect(snapToStep(7.4, 1)).toBe(7);
        expect(snapToStep(12, 5)).toBe(10);
        expect(snapToStep(13, 5)).toBe(15);
    });

    it('returns the raw value for a non-positive or invalid step', () => {
        expect(snapToStep(3.7, 0)).toBe(3.7);
        expect(snapToStep(3.7, -1)).toBe(3.7);
        expect(snapToStep(3.7, NaN)).toBe(3.7);
    });
});
