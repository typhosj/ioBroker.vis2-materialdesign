import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WidgetLock, lockSeconds, pinFieldError, pinOf, pinUnlocked, resetPins, subscribePins, unlockPin, type Pin } from './widgetLock';

const NONE: Pin = { kind: 'none' };
const PIN: Pin = { kind: 'pin', pin: '1234' };

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
        const lock = new WidgetLock(vi.fn());
        expect(lock.isLocked(opts({ enabled: false }))).toBe(false);
        expect(lock.request(opts({ enabled: false }))).toBe('open');
    });

    it('a tap without PIN unlocks, the next one acts, and it relocks after the time', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(onChange);
        expect(lock.request(opts())).toBe('unlocked');
        expect(vi.getTimerCount()).toBe(1);
        expect(lock.request(opts())).toBe('open');
        vi.advanceTimersByTime(3000);
        expect(lock.isLocked(opts())).toBe(true);
        expect(onChange).toHaveBeenCalled();
    });

    it('read-only blocks everything, even an unlock', () => {
        const lock = new WidgetLock(vi.fn());
        expect(lock.request(opts({ readOnly: true }))).toBe('blocked');
        expect(lock.request(opts({ readOnly: true, enabled: false }))).toBe('blocked');
        expect(lock.isLocked(opts())).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('read-only hides the lock without opening it, and a hold during read-only opens nothing', () => {
        const lock = new WidgetLock(vi.fn());
        expect(lock.isLocked(opts({ readOnly: true }))).toBe(false);
        lock.hold(true, opts({ readOnly: true }));
        expect(lock.isLocked(opts())).toBe(true);
        expect(lock.isLocked(opts({ readOnly: false, enabled: false }))).toBe(false);
    });

    it('with a PIN the tap opens the pad; in the editor it is blocked', () => {
        const lock = new WidgetLock(vi.fn());
        expect(lock.request(opts({ pin: PIN, editMode: true }))).toBe('blocked');
        expect(lock.padOpen).toBe(false);
        expect(lock.request(opts({ pin: PIN }))).toBe('pin');
        expect(lock.padOpen).toBe(true);
        lock.pinCancelled();
        expect(lock.padOpen).toBe(false);
        expect(lock.isLocked(opts({ pin: PIN }))).toBe(true);
    });

    it('an invalid PIN opens the pad as well (fails closed)', () => {
        const lock = new WidgetLock(vi.fn());
        expect(lock.request(opts({ pin: { kind: 'invalid' } }))).toBe('pin');
    });

    it('an accepted PIN unlocks every widget with the same PIN, not others', () => {
        const a = new WidgetLock(vi.fn());
        const b = new WidgetLock(vi.fn());
        const other = new WidgetLock(vi.fn());
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
        const lock = new WidgetLock(onChange);
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
        const lock = new WidgetLock(vi.fn());
        lock.hold(true, opts());
        expect(lock.isLocked(opts())).toBe(true);
        lock.hold(false, opts());
        expect(lock.isLocked(opts())).toBe(true);
    });

    it('dispose clears the timer and the subscription', () => {
        const onChange = vi.fn();
        const lock = new WidgetLock(onChange);
        lock.request(opts());
        lock.dispose();
        expect(vi.getTimerCount()).toBe(0);
        onChange.mockClear();
        unlockPin('1234', 3);
        expect(onChange).not.toHaveBeenCalled();
    });
});
