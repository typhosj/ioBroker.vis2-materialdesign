import { describe, expect, it } from 'vitest';

import { DIAL_CENTER, INNER_RADIUS, OUTER_RADIUS, RING_BOUNDARY, angleOf, dialPoint, hourFromPoint, hourPlace, minuteFromPoint } from './timeDialGeometry';

const at = (angleDeg: number, radius: number): [number, number] => {
    const a = (angleDeg * Math.PI) / 180;
    return [radius * Math.sin(a), -radius * Math.cos(a)];
};

describe('angleOf', () => {
    it('measures clockwise from 12 o\'clock', () => {
        expect(angleOf(0, -10)).toBe(0);
        expect(angleOf(10, 0)).toBe(90);
        expect(angleOf(0, 10)).toBe(180);
        expect(angleOf(-10, 0)).toBe(270);
        expect(angleOf(-1, -1000)).toBeGreaterThan(359);
        expect(angleOf(-1, -1000)).toBeLessThan(360);
    });
});

describe('hourFromPoint, 24 h', () => {
    it('reads the outer ring as 1-12', () => {
        expect(hourFromPoint(...at(0, OUTER_RADIUS), false)).toBe(12);
        expect(hourFromPoint(...at(90, OUTER_RADIUS), false)).toBe(3);
        expect(hourFromPoint(...at(330, OUTER_RADIUS), false)).toBe(11);
    });

    it('reads the inner ring as 13-23 and 0', () => {
        expect(hourFromPoint(...at(0, INNER_RADIUS), false)).toBe(0);
        expect(hourFromPoint(...at(90, INNER_RADIUS), false)).toBe(15);
        expect(hourFromPoint(...at(330, INNER_RADIUS), false)).toBe(23);
    });

    it('switches ring exactly at the boundary radius', () => {
        expect(hourFromPoint(...at(90, RING_BOUNDARY - 0.01), false)).toBe(15);
        expect(hourFromPoint(...at(90, RING_BOUNDARY), false)).toBe(3);
    });

    it('snaps to the nearest label between two labels', () => {
        expect(hourFromPoint(...at(14, OUTER_RADIUS), false)).toBe(12);
        expect(hourFromPoint(...at(16, OUTER_RADIUS), false)).toBe(1);
        expect(hourFromPoint(...at(359, OUTER_RADIUS), false)).toBe(12);
    });
});

describe('hourFromPoint, 12 h', () => {
    it('has one ring 1-12 regardless of the radius', () => {
        expect(hourFromPoint(...at(0, INNER_RADIUS), true)).toBe(12);
        expect(hourFromPoint(...at(90, INNER_RADIUS), true)).toBe(3);
        expect(hourFromPoint(...at(90, OUTER_RADIUS), true)).toBe(3);
    });
});

describe('minuteFromPoint', () => {
    it('reads every minute and wraps at 60', () => {
        expect(minuteFromPoint(...at(0, OUTER_RADIUS))).toBe(0);
        expect(minuteFromPoint(...at(90, OUTER_RADIUS))).toBe(15);
        expect(minuteFromPoint(...at(2.9, OUTER_RADIUS))).toBe(0);
        expect(minuteFromPoint(...at(3.1, OUTER_RADIUS))).toBe(1);
        expect(minuteFromPoint(...at(357.1, OUTER_RADIUS))).toBe(0);
        expect(minuteFromPoint(...at(356.9, OUTER_RADIUS))).toBe(59);
    });
});

describe('dialPoint and hourPlace', () => {
    it('puts index 0 at the top and index 3 of 12 on the right', () => {
        expect(dialPoint(0, 12, OUTER_RADIUS)).toEqual({ x: DIAL_CENTER, y: DIAL_CENTER - OUTER_RADIUS });
        const right = dialPoint(3, 12, OUTER_RADIUS);
        expect(right.x).toBeCloseTo(DIAL_CENTER + OUTER_RADIUS);
        expect(right.y).toBeCloseTo(DIAL_CENTER);
    });

    it('places hours on the ring they are read from', () => {
        expect(hourPlace(12, false)).toEqual({ index: 0, radius: OUTER_RADIUS });
        expect(hourPlace(0, false)).toEqual({ index: 0, radius: INNER_RADIUS });
        expect(hourPlace(13, false)).toEqual({ index: 1, radius: INNER_RADIUS });
        expect(hourPlace(3, false)).toEqual({ index: 3, radius: OUTER_RADIUS });
        expect(hourPlace(19, true)).toEqual({ index: 7, radius: OUTER_RADIUS });
        expect(hourPlace(0, true)).toEqual({ index: 0, radius: OUTER_RADIUS });
    });
});
