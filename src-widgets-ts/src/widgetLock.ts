import type { RxWidgetInfo, RxWidgetInfoAttributesFieldText } from '@iobroker/types-vis-2';

import { looksLikeBinding } from './deviceFill';
import { iconField } from './widgetUtils';

export type Pin = { kind: 'none' } | { kind: 'pin'; pin: string } | { kind: 'invalid' };
export type LockRequest = 'open' | 'unlocked' | 'pin' | 'blocked';
export interface LockOptions { enabled: boolean; pin: Pin; seconds: number; readOnly?: boolean; editMode?: boolean }
type LockState = Pick<LockOptions, 'enabled' | 'pin'>;

const DIGITS = /^\d{1,12}$/;

const trimmed = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '');

export function lockSeconds(value: unknown): number {
    const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
    return Math.min(86_400, Math.max(1, Number.isFinite(number) ? number : 10));
}

// A child lock that stands open while its bound PIN loads is worth nothing: a binding that does not
// resolve to digits fails closed.
export function pinOf(resolved: unknown, raw: unknown): Pin {
    const text = trimmed(resolved);
    const bound = typeof raw === 'string' && looksLikeBinding(raw);
    if (text === '' && !bound) return { kind: 'none' };
    return DIGITS.test(text) ? { kind: 'pin', pin: text } : { kind: 'invalid' };
}

export function pinFieldError(data: Record<string, unknown>): string | false {
    const text = trimmed(data.lockPin);
    if (text === '' || looksLikeBinding(text)) return false;
    return DIGITS.test(text) ? false : 'lockPinInvalid';
}

// vis-2 shows a string returned by `error` as the field's helper text (translated).
export const lockPinField: RxWidgetInfoAttributesFieldText = { name: 'lockPin', label: 'lockPin', type: 'text', error: pinFieldError as unknown as NonNullable<RxWidgetInfoAttributesFieldText['error']> };

export const lockGroup = {
    name: 'lock',
    label: 'group_lock',
    fields: [
        { name: 'lockEnabled', label: 'lockEnabled', type: 'checkbox' },
        { name: 'autoLockAfter', label: 'autoLockAfter', type: 'number', default: 10 },
        lockPinField,
        iconField('lockIcon', 'lockIcon', 'lock-outline'),
        { name: 'lockIconColor', label: 'lockIconColor', type: 'color' },
    ],
} as RxWidgetInfo['visAttrs'][number];

const pinUntil = new Map<string, number>();
const pinTimers = new Map<string, number>();
const listeners = new Set<() => void>();
const notify = (): void => { for (const listener of [...listeners]) listener(); };

export function unlockPin(pin: string, seconds: number): void {
    pinUntil.set(pin, Date.now() + seconds * 1000);
    window.clearTimeout(pinTimers.get(pin));
    pinTimers.set(pin, window.setTimeout(() => { pinTimers.delete(pin); pinUntil.delete(pin); notify(); }, seconds * 1000));
    notify();
}

export function pinUnlocked(pin: string): boolean {
    return (pinUntil.get(pin) ?? 0) > Date.now();
}

export function subscribePins(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function resetPins(): void {
    for (const timer of pinTimers.values()) window.clearTimeout(timer);
    pinTimers.clear();
    pinUntil.clear();
    listeners.clear();
}

export class WidgetLock {
    padOpen = false;
    private unlocked = false;
    private holding = false;
    private timer: number | undefined;
    private readonly unsubscribe: () => void;

    constructor(private readonly onChange: () => void) {
        this.unsubscribe = subscribePins(onChange);
    }

    // Read only wins: a read-only widget shows no lock, while the lock itself keeps its state.
    isLocked(o: LockState & Pick<LockOptions, 'readOnly'>): boolean {
        return !o.readOnly && this.closed(o);
    }

    private closed(o: LockState): boolean {
        if (!o.enabled || this.unlocked || this.holding) return false;
        return !(o.pin.kind === 'pin' && pinUnlocked(o.pin.pin));
    }

    request(o: LockOptions): LockRequest {
        if (o.readOnly) return 'blocked';
        if (!this.closed(o)) return 'open';
        if (o.pin.kind === 'none') {
            this.unlock(o.seconds);
            return 'unlocked';
        }
        if (o.editMode) return 'blocked';
        this.padOpen = true;
        this.onChange();
        return 'pin';
    }

    unlock(seconds: number): void {
        this.unlocked = true;
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => { this.timer = undefined; this.unlocked = false; this.onChange(); }, seconds * 1000);
        this.onChange();
    }

    pinAccepted(pin: string, seconds: number): void {
        this.padOpen = false;
        unlockPin(pin, seconds);
    }

    pinCancelled(): void {
        this.padOpen = false;
        this.onChange();
    }

    // An input that started while unlocked (focus, open menu, drag) is never cut off by the relock.
    hold(open: boolean, o: LockState): void {
        if (open) {
            if (!this.closed(o)) this.holding = true;
            return;
        }
        if (!this.holding) return;
        this.holding = false;
        this.onChange();
    }

    dispose(): void {
        window.clearTimeout(this.timer);
        this.timer = undefined;
        this.unsubscribe();
    }
}
