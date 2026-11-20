import type { RxWidgetInfo, RxWidgetInfoAttributesFieldText } from '@iobroker/types-vis-2';

import { looksLikeBinding } from './deviceFill';
import { renderIcon } from './MaterialDesignButtons';
import { boolValue, iconField, isReadOnly, textValue } from './widgetUtils';

export type Pin = { kind: 'none' } | { kind: 'pin'; pin: string } | { kind: 'invalid' };
export type LockRequest = 'open' | 'unlocked' | 'pin' | 'blocked';
export interface LockOptions { enabled: boolean; pin: Pin; seconds: number; readOnly?: boolean; editMode?: boolean }
export interface LockData { lockEnabled?: boolean; lockPin?: string; autoLockAfter?: number; lockIcon?: string; lockIconColor?: string; readOnly?: boolean }
type LockState = Pick<LockOptions, 'enabled' | 'pin'>;
type LockInput = Partial<Record<keyof LockData, unknown>>;

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

// The types declare `error` as a boolean predicate, but vis-2 shows a returned string as the field's
// translated helper text; a boolean would lose the message.
export const lockPinField = { name: 'lockPin', label: 'lockPin', type: 'text', error: pinFieldError } as RxWidgetInfoAttributesFieldText;

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

// `saved` is the unresolved widget data: only there a bound PIN still looks like a binding.
export function lockOptionsOf(data: LockInput, saved: unknown, editMode: boolean): LockOptions {
    return {
        enabled: boolValue(data.lockEnabled),
        pin: pinOf(data.lockPin, (saved as LockInput | undefined)?.lockPin),
        seconds: lockSeconds(data.autoLockAfter),
        readOnly: isReadOnly(data),
        editMode,
    };
}

export function lockIcon(data: LockInput, size: number): ReturnType<typeof renderIcon> {
    return renderIcon(textValue(data.lockIcon, 'lock-outline'), textValue(data.lockIconColor, '#B22222'), size, true);
}

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
    refocusing = false;
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

    // The unlocking tap on a field that already has the focus fires no focus event: no hold from
    // onFocus, and the On-screen Keyboard would not open. Blur and focus it again; the widget's blur
    // handler must return early while `refocusing` is set, or it commits and releases the hold.
    focusAfterUnlock(field: () => HTMLElement | null, o: LockState): void {
        const element = field();
        if (element && document.activeElement === element) this.hold(true, o);
        window.setTimeout(() => {
            const target = field();
            if (!target) return;
            if (document.activeElement === target) {
                this.refocusing = true;
                target.blur();
                this.refocusing = false;
            }
            target.focus();
        });
    }

    dispose(): void {
        window.clearTimeout(this.timer);
        this.timer = undefined;
        this.unsubscribe();
    }
}
