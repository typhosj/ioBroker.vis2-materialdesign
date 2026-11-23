export interface HistoryRule { shape: 'daily' | 'flat' | 'counter'; base: number; amplitude: number; noise: number }

export const MAX_HISTORY_POINTS = 2000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function hashString(text: string): number {
    let hash = 0;
    for (const char of text) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
    return hash >>> 0;
}

export function historySeries(rule: HistoryRule, start: number, end: number, count: number, seed: number): Array<{ ts: number; val: number }> {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    const points = Math.min(MAX_HISTORY_POINTS, Math.max(2, Number.isFinite(count) ? Math.floor(count) : 2));
    const step = (end - start) / (points - 1);
    const random = mulberry32(seed);
    const out: Array<{ ts: number; val: number }> = [];
    let total = rule.base;
    for (let i = 0; i < points; i++) {
        const ts = Math.round(start + i * step);
        const jitter = 1 + (random() * 2 - 1) * rule.noise;
        let val: number;
        if (rule.shape === 'daily') {
            const dayFraction = (((ts % DAY) + DAY) % DAY) / DAY;
            val = rule.base + rule.amplitude * Math.max(0, Math.sin((dayFraction - 0.25) * 2 * Math.PI)) * jitter;
        } else if (rule.shape === 'counter') {
            if (i > 0) total += Math.abs(rule.amplitude * jitter) * (step / HOUR);
            val = total;
        } else {
            val = rule.base + rule.amplitude * (random() * 2 - 1);
        }
        out.push({ ts, val: Math.round(val * 100) / 100 });
    }
    return out;
}
