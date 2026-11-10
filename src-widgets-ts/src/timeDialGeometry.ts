// Dial units throughout; y grows downwards, as in SVG and pointer coordinates.

export const DIAL_SIZE = 256;
export const DIAL_CENTER = DIAL_SIZE / 2;
export const OUTER_RADIUS = 104;
export const INNER_RADIUS = 68;
export const RING_BOUNDARY = (OUTER_RADIUS + INNER_RADIUS) / 2;

/** Clockwise angle from 12 o'clock in degrees, 0 <= angle < 360, for a point relative to the centre. */
export function angleOf(dx: number, dy: number): number {
    const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return (degrees + 360) % 360;
}

export function hourFromPoint(dx: number, dy: number, hour12: boolean): number {
    const index = Math.round(angleOf(dx, dy) / 30) % 12;
    if (!hour12 && Math.hypot(dx, dy) < RING_BOUNDARY) {
        return index === 0 ? 0 : index + 12;
    }
    return index === 0 ? 12 : index;
}

export function minuteFromPoint(dx: number, dy: number): number {
    return Math.round(angleOf(dx, dy) / 6) % 60;
}

export function dialPoint(index: number, steps: number, radius: number): { x: number; y: number } {
    const angle = (index / steps) * 2 * Math.PI;
    return { x: DIAL_CENTER + radius * Math.sin(angle), y: DIAL_CENTER - radius * Math.cos(angle) };
}

export function hourPlace(hour: number, hour12: boolean): { index: number; radius: number } {
    const inner = !hour12 && (hour === 0 || hour > 12);
    return { index: hour % 12, radius: inner ? INNER_RADIUS : OUTER_RADIUS };
}
