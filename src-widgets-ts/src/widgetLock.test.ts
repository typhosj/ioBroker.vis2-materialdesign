import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WidgetLock, lockOptionsOf, lockSeconds, pinFieldError, pinOf, pinUnlocked, resetPins, subscribePins, unlockPin, type Pin } from './widgetLock';

const NONE: Pin = { kind: 'none' };
const PIN: Pin = { kind: 'pin', pin: '1234' };
const host = (forceUpdate: () => void = vi.fn(), saved?: unknown, editMode?: boolean) => ({ forceUpdate, state: { data: saved }, props: { editMode } });

beforeEach(() => vi.useFakeTimers());
afterEach(() => { resetPins(); vi.useRealTimers(); });

describe('lockSeconds', () => {
    it.each([[undefined, 10], ['', 10], ['abc', 10], [Number.NaN, 10], [0, 1], [-5, 1], [0.5, 1], [3, 3], ['7', 7], [86_400, 86_400], [100_000, 86_400]])('%j -> %d', (value, seconds) => {
        expect(lockSeconds(value)).toBe(seconds);
    });
});

describe('pinOf', () => {
    it.each([
        [undefined, undefined, NONE],
        ['', '', NONE],
        ['   ', '   ', NONE],
        ['1234', '1234', PIN],
        [' 1234 ', ' 1234 ', PIN],
        [1234, 1234, PIN],
        ['1', '1', { kind: 'pin', pin: '1' }],
        ['123456789012', '123456789012', { kind: 'pin', pin: '123456789012' }],
        ['1234567890123', '1234567890123', { kind: 'invalid' }],
        ['12a4', '12a4', { kind: 'invalid' }],
        ['-12', '-12', { kind: 'invalid' }],
        // A binding fails closed while it is empty, still unresolved or not digits.
        ['', '{0_userdata.0.pin}', { kind: 'invalid' }],
        [undefined, '{0_userdata.0.pin}', { kind: 'invalid' }],
        ['{0_userdata.0.pin}', '{0_userdata.0.pin}', { kind: 'invalid' }],
        ['abcd', '{0_userdata.0.pin}', { kind: 'invalid' }],
        ['4711', '{0_userdata.0.pin}', { kind: 'pin', pin: '4711' }],
    ])('resolved %j, raw %j', (resolved, raw, expected) => {
        expect(pinOf(resolved, raw)).toEqual(expected);
    });
});

describe('pinFieldError', () => {
    it.each([
        [{}, false],
        [{ lockPin: '' }, false],
        [{ lockPin: '1234' }, false],
        [{ lockPin: ' 12 ' }, false],
        [{ lockPin: '{0_userdata.0.pin}' }, false],
        [{ lockPin: '12a4' }, 'lockPinInvalid'],
        [{ lockPin: '1234567890123' }, 'lockPinInvalid'],
    ])('%j -> %j', (data, expected) => {
        expect(pinFieldError(data)).toBe(expected);
    });
});

describe('shared PIN table', () => {
    it('unlocks a PIN until its time ends and tells the subscribers', () => {
        const listener = vi.fn();
        const stop = subscribePins(listener);
        unlockPin('1234', 3);
        expect(pinUnlocked('1234')).toBe(true);
        expect(pinUnlocked('9999')).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(2999);
        expect(pinUnlocked('1234')).toBe(true);
        vi.advanceTimersByTime(1);
        expect(pinUnlocked('1234')).toBe(false);
        expect(listener).toHaveBeenCalledTimes(2);
        stop();
        unlockPin('1234', 3);
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('a second unlock restarts the time and keeps one timer', () => {
        unlockPin('1234', 3);
        vi.advanceTimersByTime(2000);
        unlockPin('1234', 3);
        expect(vi.getTimerCount()).toBe(1);
        vi.advanceTimersByTime(2000);
        expect(pinUnlocked('1234')).toBe(true);
    });
});

describe('WidgetLock', () => {
    const opts = (over: Partial<Parameters<WidgetLock['request']>[0]> = {}) => ({ enabled: true, pin: NONE, seconds: 3, ...over });

    it('is open while the lock is off', () => {
        const lock = new WidgetLock(host());
        expect(lock.isLocked(opts({ enabled: false }))).toBe(false);
        expect(lock.request(opts({ enabled: false }))).toBe('open');
    });

    it('a tap without PIN unlocks, the next one acts, and it relocks after the time', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(host(onChange));
        expect(lock.request(opts())).toBe('unlocked');
        expect(vi.getTimerCount()).toBe(1);
        expect(lock.request(opts())).toBe('open');
        vi.advanceTimersByTime(3000);
        expect(lock.isLocked(opts())).toBe(true);
        expect(onChange).toHaveBeenCalled();
    });

    it('read-only blocks everything, even an unlock', () => {
        const lock = new WidgetLock(host());
        expect(lock.request(opts({ readOnly: true }))).toBe('blocked');
        expect(lock.request(opts({ readOnly: true, enabled: false }))).toBe('blocked');
        expect(lock.isLocked(opts())).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('read-only hides the lock without opening it, and a hold during read-only opens nothing', () => {
        const lock = new WidgetLock(host());
        expect(lock.isLocked(opts({ readOnly: true }))).toBe(false);
        lock.hold(true, opts({ readOnly: true }));
        expect(lock.isLocked(opts())).toBe(true);
        expect(lock.isLocked(opts({ readOnly: false, enabled: false }))).toBe(false);
    });

    it('focusAfterUnlock holds a focused field and blurs and focuses it again with refocusing set', () => {
        const lock = new WidgetLock(host());
        const field = document.createElement('input');
        document.body.appendChild(field);
        field.focus();
        const seen: boolean[] = [];
        field.addEventListener('blur', () => seen.push(lock.refocusing));
        lock.focusAfterUnlock(() => field, opts({ enabled: false }));
        expect(lock.isLocked(opts())).toBe(false);
        vi.runAllTimers();
        expect(seen).toEqual([true]);
        expect(lock.refocusing).toBe(false);
        expect(document.activeElement).toBe(field);
        field.remove();
    });

    it('focusAfterUnlock leaves an unfocused field unheld and survives a missing field', () => {
        const lock = new WidgetLock(host());
        lock.focusAfterUnlock(() => null, opts());
        vi.runAllTimers();
        expect(lock.isLocked(opts())).toBe(true);
    });

    it('with a PIN the tap opens the pad; in the editor it is blocked', () => {
        const lock = new WidgetLock(host());
        expect(lock.request(opts({ pin: PIN, editMode: true }))).toBe('blocked');
        expect(lock.padOpen).toBe(false);
        expect(lock.request(opts({ pin: PIN }))).toBe('pin');
        expect(lock.padOpen).toBe(true);
        lock.pinCancelled();
        expect(lock.padOpen).toBe(false);
        expect(lock.isLocked(opts({ pin: PIN }))).toBe(true);
    });

    it('an invalid PIN opens the pad as well (fails closed)', () => {
        const lock = new WidgetLock(host());
        expect(lock.request(opts({ pin: { kind: 'invalid' } }))).toBe('pin');
    });

    it('an accepted PIN unlocks every widget with the same PIN, not others', () => {
        const a = new WidgetLock(host());
        const b = new WidgetLock(host());
        const other = new WidgetLock(host());
        a.request(opts({ pin: PIN }));
        a.pinAccepted('1234', 3);
        expect(a.padOpen).toBe(false);
        expect(a.isLocked(opts({ pin: PIN }))).toBe(false);
        expect(b.isLocked(opts({ pin: PIN }))).toBe(false);
        expect(other.isLocked(opts({ pin: { kind: 'pin', pin: '9999' } }))).toBe(true);
        expect(other.isLocked(opts())).toBe(true);
        vi.advanceTimersByTime(3000);
        expect(b.isLocked(opts({ pin: PIN }))).toBe(true);
    });

    it('an input open at relock time keeps the widget open until it ends', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(host(onChange));
        lock.request(opts());
        lock.hold(true, opts());
        vi.advanceTimersByTime(5000);
        expect(lock.isLocked(opts())).toBe(false);
        onChange.mockClear();
        lock.hold(false, opts());
        expect(lock.isLocked(opts())).toBe(true);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('an input opened while locked holds nothing open', () => {
        const lock = new WidgetLock(host());
        lock.hold(true, opts());
        expect(lock.isLocked(opts())).toBe(true);
        lock.hold(false, opts());
        expect(lock.isLocked(opts())).toBe(true);
    });

    it('dispose clears the timer and the subscription', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(host(onChange));
        lock.mount();
        lock.request(opts());
        lock.dispose();
        expect(vi.getTimerCount()).toBe(0);
        onChange.mockClear();
        unlockPin('1234', 3);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('subscribes to PIN changes only once mounted, once, and again after a remount', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(host(onChange));
        unlockPin('1234', 3);
        expect(onChange).not.toHaveBeenCalled();
        lock.mount();
        lock.mount();
        unlockPin('1234', 3);
        expect(onChange).toHaveBeenCalledTimes(1);
        lock.dispose();
        lock.dispose();
        lock.mount();
        onChange.mockClear();
        unlockPin('1234', 3);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('a lock that is never mounted leaves no listener behind', () => {
        const listener = vi.fn();
        const unsubscribe = subscribePins(listener);
        for (let i = 0; i < 3; i++) new WidgetLock(host());
        unsubscribe();
        const onChange = vi.fn();
        new WidgetLock(host(onChange));
        unlockPin('1234', 3);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('options read the saved data and the edit mode of the host', () => {
        const lock = new WidgetLock(host(vi.fn(), { lockPin: '{0_userdata.0.pin}' }, true));
        expect(lock.options({ lockEnabled: true, lockPin: '', autoLockAfter: 'x' })).toEqual({ enabled: true, pin: { kind: 'invalid' }, seconds: 10, readOnly: false, editMode: true });
        expect(new WidgetLock({ forceUpdate: vi.fn(), state: null, props: {} }).options({}).editMode).toBe(false);
    });

    it('afterUnlock runs at once without a PIN, after the right PIN, and never after a cancel or a block', () => {
        const after = vi.fn();
        const lock = new WidgetLock(host());
        expect(lock.request(opts(), after)).toBe('unlocked');
        expect(after).toHaveBeenCalledTimes(1);
        const pinned = new WidgetLock(host());
        expect(pinned.request(opts({ pin: PIN }), after)).toBe('pin');
        pinned.pinCancelled();
        expect(pinned.request(opts({ pin: PIN }))).toBe('pin');
        pinned.pinAccepted('1234', 3);
        expect(after).toHaveBeenCalledTimes(1);
        resetPins();
        expect(pinned.request(opts({ pin: PIN }), after)).toBe('pin');
        pinned.pinAccepted('1234', 3);
        expect(after).toHaveBeenCalledTimes(2);
        const fresh = new WidgetLock(host());
        expect(fresh.request(opts({ readOnly: true }), after)).toBe('blocked');
        expect(fresh.request(opts({ pin: { kind: 'pin', pin: '5555' }, editMode: true }), after)).toBe('blocked');
        expect(after).toHaveBeenCalledTimes(2);
    });

    it('pad renders only while it is open', () => {
        const lock = new WidgetLock(host());
        expect(lock.pad(opts({ pin: PIN }), false, false)).toBeNull();
        lock.request(opts({ pin: PIN }));
        expect(lock.pad(opts({ pin: PIN }), true, true)).not.toBeNull();
    });

    describe('dragHandlers', () => {
        const target = () => {
            let captured = false;
            return { setPointerCapture: () => { captured = true; }, hasPointerCapture: () => captured, releasePointerCapture: () => { captured = false; } };
        };
        const event = (element: ReturnType<typeof target>) => ({ currentTarget: element, pointerId: 1, stopPropagation: vi.fn() }) as unknown as React.PointerEvent<Element>;
        const callbacks = () => ({ start: vi.fn(), move: vi.fn(), end: vi.fn(), cancel: vi.fn() });

        it('a locked press asks to unlock and the rest of that gesture does nothing', () => {
            const lock = new WidgetLock(host());
            const on = callbacks();
            const element = target();
            const handlers = lock.dragHandlers(opts(), true, false, on);
            handlers.onPointerDown(event(element));
            handlers.onPointerMove(event(element));
            handlers.onPointerUp(event(element));
            expect(on.start).not.toHaveBeenCalled();
            expect(on.end).not.toHaveBeenCalled();
            expect(lock.isLocked(opts())).toBe(false);
        });

        it('a locked press released outside leaves no stale flag for the next press', () => {
            const lock = new WidgetLock(host());
            const on = callbacks();
            const element = target();
            lock.dragHandlers(opts(), true, false, on).onPointerDown(event(element));
            const open = lock.dragHandlers(opts(), false, false, on);
            open.onPointerDown(event(element));
            open.onPointerMove(event(element));
            open.onPointerUp(event(element));
            expect(on.start).toHaveBeenCalledTimes(1);
            expect(on.move).toHaveBeenCalledTimes(1);
            expect(on.end).toHaveBeenCalledTimes(1);
            expect(element.hasPointerCapture()).toBe(false);
        });

        it('a swallowed press ends with its cancel, and a disabled press never starts', () => {
            const lock = new WidgetLock(host());
            const on = callbacks();
            const element = target();
            const locked = lock.dragHandlers(opts(), true, false, on);
            locked.onPointerDown(event(element));
            locked.onPointerCancel(event(element));
            expect(on.cancel).not.toHaveBeenCalled();
            const disabled = lock.dragHandlers(opts(), false, true, on);
            disabled.onPointerDown(event(element));
            disabled.onPointerMove(event(element));
            expect(on.start).not.toHaveBeenCalled();
            expect(on.move).not.toHaveBeenCalled();
        });

        it('a drag that started unlocked holds the lock open until it is cancelled', () => {
            const lock = new WidgetLock(host());
            const on = callbacks();
            const element = target();
            lock.request(opts());
            const handlers = lock.dragHandlers(opts(), false, false, on);
            handlers.onPointerDown(event(element));
            vi.advanceTimersByTime(5000);
            expect(lock.isLocked(opts())).toBe(false);
            handlers.onPointerCancel(event(element));
            expect(on.cancel).toHaveBeenCalledTimes(1);
            expect(lock.isLocked(opts())).toBe(true);
        });
    });
});

describe('lockOptionsOf', () => {
    it.each([
        [{ lockEnabled: true }, true],
        [{ lockEnabled: 'true' }, true],
        [{ lockEnabled: 'false' }, false],
        [{ lockEnabled: undefined }, false],
    ])('%j -> enabled %s', (data, enabled) => {
        expect(lockOptionsOf(data, data, false).enabled).toBe(enabled);
    });

    it('reads the binding from the saved data and the values from the resolved data', () => {
        expect(lockOptionsOf({ lockPin: '' }, { lockPin: '{0_userdata.0.pin}' }, false).pin).toEqual({ kind: 'invalid' });
        expect(lockOptionsOf({ lockPin: '4711' }, { lockPin: '{0_userdata.0.pin}' }, true)).toEqual({ enabled: false, pin: { kind: 'pin', pin: '4711' }, seconds: 10, readOnly: false, editMode: true });
        expect(lockOptionsOf({ autoLockAfter: -3, readOnly: 'true' }, undefined, false)).toMatchObject({ pin: NONE, seconds: 1, readOnly: true });
    });
});
