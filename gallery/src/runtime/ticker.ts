import type { Store } from './store';

export interface TickerRule { min: number; max: number; step: number; everyMs: number }

export const MIN_TICK_MS = 500;

export function nextTickValue(current: unknown, rule: TickerRule, random: () => number): number {
    const lo = Math.min(rule.min, rule.max);
    const hi = Math.max(rule.min, rule.max);
    const step = rule.step > 0 ? rule.step : 1;
    const clamp = (value: number): number => Math.min(hi, Math.max(lo, value));
    const start = typeof current === 'number' && Number.isFinite(current) ? current : (lo + hi) / 2;
    const moved = clamp(start + Math.round((random() * 2 - 1) * 2) * step);
    return Number(clamp(Math.round(moved / step) * step).toFixed(6));
}

export function startTicker(store: Store, rules: Record<string, TickerRule>, random: () => number, paused: () => boolean): () => void {
    const timers = new Map<string, number>();
    let stopped = false;
    for (const [id, rule] of Object.entries(rules)) {
        const every = Math.max(MIN_TICK_MS, rule.everyMs);
        const tick = (): void => {
            if (stopped) return;
            if (!paused()) store.setState(id, nextTickValue(store.getState(id)?.val, rule, random), true);
            timers.set(id, window.setTimeout(tick, every));
        };
        timers.set(id, window.setTimeout(tick, every));
    }
    return () => {
        stopped = true;
        timers.forEach(timer => window.clearTimeout(timer));
        timers.clear();
    };
}
