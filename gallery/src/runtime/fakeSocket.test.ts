import { describe, expect, it, vi } from 'vitest';

import { ADAPTER_OBJECT_ID, createFakeSocket } from './fakeSocket';
import { Store } from './store';

const make = () => {
    const store = new Store({ a: 1, b: 2 }, {}, { ackDelayMs: 0 });
    const socket = createFakeSocket(store, { version: '9.9.9', seed: 1, history: { a: { shape: 'flat', base: 5, amplitude: 1, noise: 0 } } });
    return { store, socket };
};

describe('createFakeSocket', () => {
    it('calls back at once with the current value, as socket-client does after subscribing', async () => {
        const { socket } = make();
        const cb = vi.fn();
        await socket.subscribeState(['a', 'b'], cb);
        expect(cb.mock.calls.map(([id, s]) => [id, s.val])).toEqual([['a', 1], ['b', 2]]);
    });

    it('forwards later writes and ignores a second subscription of the same callback', async () => {
        const { store, socket } = make();
        const cb = vi.fn();
        await socket.subscribeState('a', cb);
        await socket.subscribeState('a', cb);
        store.setState('a', 3, true);
        expect(cb).toHaveBeenCalledTimes(2);
        expect(store.listenerCount('a')).toBe(1);
    });

    it('unsubscribes only the given callback, also for an id array', async () => {
        const { store, socket } = make();
        const one = vi.fn();
        const two = vi.fn();
        await socket.subscribeState(['a', 'b'], one);
        await socket.subscribeState('a', two);
        socket.unsubscribeState(['a', 'b'], one);
        store.setState('a', 7, true);
        expect(one).toHaveBeenCalledTimes(2);
        expect(two).toHaveBeenCalledTimes(2);
        expect(store.listenerCount('b')).toBe(0);
    });

    it('drops every callback of an id when none is given', async () => {
        const { store, socket } = make();
        await socket.subscribeState('a', vi.fn());
        await socket.subscribeState('a', vi.fn());
        socket.unsubscribeState('a');
        expect(store.listenerCount('a')).toBe(0);
    });

    it('ignores empty and non-string ids', async () => {
        const { store, socket } = make();
        await socket.subscribeState(['', undefined as unknown as string], vi.fn());
        expect(store.ids()).toEqual(['a', 'b']);
    });

    it('answers the adapter object with the package version', async () => {
        const { socket } = make();
        expect((await socket.getObject(ADAPTER_OBJECT_ID))?.common).toMatchObject({ version: '9.9.9', installedVersion: '9.9.9' });
        expect(await socket.getObject('nope')).toBeNull();
    });

    it('serves a deterministic history for configured ids and nothing for others', async () => {
        const { socket } = make();
        const first = await socket.getHistory('a', { start: 0, end: 60_000, count: 5 });
        expect(first).toHaveLength(5);
        expect(await socket.getHistory('a', { start: 0, end: 60_000, count: 5 })).toEqual(first);
        expect(await socket.getHistory('b', { start: 0, end: 60_000 })).toEqual([]);
    });

    it('throws a named error for anything the gallery does not simulate', () => {
        const { socket } = make();
        expect(() => (socket as unknown as { sendTo(): void }).sendTo()).toThrow('not simulated: sendTo');
    });

    it('is not a thenable, so awaiting it does not hang', async () => {
        const { socket } = make();
        expect((socket as unknown as { then?: unknown }).then).toBeUndefined();
        await expect(Promise.resolve(socket)).resolves.toBe(socket);
    });
});
