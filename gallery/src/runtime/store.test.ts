import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Store } from './store';

const objects = {} as Record<string, ioBroker.Object>;

describe('Store', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000); });
    afterEach(() => { vi.useRealTimers(); });

    it('starts with the initial values as acknowledged states', () => {
        const store = new Store({ a: 1 }, objects);
        expect(store.getState('a')).toMatchObject({ val: 1, ack: true, ts: 1_000, lc: 1_000, q: 0 });
    });

    it('notifies a subscriber with ack false and confirms with ack true after the delay', () => {
        const store = new Store({ a: 1 }, objects);
        const seen: Array<[unknown, boolean]> = [];
        store.subscribe('a', (_id, state) => seen.push([state?.val, !!state?.ack]));
        store.setState('a', 2);
        expect(seen).toEqual([[2, false]]);
        vi.advanceTimersByTime(150);
        expect(seen).toEqual([[2, false], [2, true]]);
    });

    it('confirms only the latest of two quick writes', () => {
        const store = new Store({ a: 1 }, objects);
        const listener = vi.fn();
        store.subscribe('a', listener);
        store.setState('a', 2);
        vi.advanceTimersByTime(100);
        store.setState('a', 3);
        vi.advanceTimersByTime(150);
        expect(listener.mock.calls.map(([, s]) => [s.val, s.ack])).toEqual([[2, false], [3, false], [3, true]]);
    });

    it('confirms at once with ackDelayMs 0', () => {
        const store = new Store({ a: 1 }, objects, { ackDelayMs: 0 });
        store.setState('a', 5);
        expect(store.getState('a')).toMatchObject({ val: 5, ack: true });
    });

    it('keeps lc when the value did not change', () => {
        const store = new Store({ a: 1 }, objects, { ackDelayMs: 0 });
        vi.setSystemTime(2_000);
        store.setState('a', 1, true);
        expect(store.getState('a')).toMatchObject({ ts: 2_000, lc: 1_000 });
    });

    it('returns null for an unknown id and creates it on write', () => {
        const store = new Store({}, objects, { ackDelayMs: 0 });
        expect(store.getState('x')).toBeNull();
        store.setState('x', 'hello', true);
        expect(store.getState('x')?.val).toBe('hello');
    });

    it('stops notifying after unsubscribe', () => {
        const store = new Store({ a: 1 }, objects, { ackDelayMs: 0 });
        const listener = vi.fn();
        const off = store.subscribe('a', listener);
        expect(store.listenerCount('a')).toBe(1);
        off();
        store.setState('a', 2, true);
        expect(listener).not.toHaveBeenCalled();
        expect(store.listenerCount('a')).toBe(0);
    });

    it('reset restores the initial values, cancels pending acks and notifies', () => {
        const store = new Store({ a: 1 }, objects);
        const listener = vi.fn();
        store.subscribe('a', listener);
        store.setState('a', 9);
        store.reset();
        vi.advanceTimersByTime(500);
        expect(store.getState('a')?.val).toBe(1);
        expect(listener.mock.calls.at(-1)?.[1]).toMatchObject({ val: 1, ack: true });
    });

    it('returns objects by id', () => {
        const object = { _id: 'o', type: 'state', common: { name: 'o' }, native: {} } as unknown as ioBroker.Object;
        expect(new Store({}, { o: object }).getObject('o')).toBe(object);
        expect(new Store({}, {}).getObject('o')).toBeNull();
    });
});
