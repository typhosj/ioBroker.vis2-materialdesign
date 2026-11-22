import type { RxWidgetInfo, RxWidgetInfoAttributesFieldText } from '@iobroker/types-vis-2';
import React from 'react';

import { looksLikeBinding } from './deviceFill';
import { renderIcon } from './MaterialDesignButtons';
import PinPad from './PinPad';
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

export interface LockHost { forceUpdate(): void; readonly state: { readonly data?: unknown } | null; readonly props: { readonly editMode?: boolean } }
export interface DragHandlers<T extends Element> { start(event: React.PointerEvent<T>): void; move(event: React.PointerEvent<T>): void; end(): void; cancel(): void }
type PointerHandlers<T extends Element> = Required<Pick<React.DOMAttributes<T>, 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'>>;

export class WidgetLock {
    padOpen = false;
    refocusing = false;
    private unlocked = false;
    private holding = false;
    // The tap that unlocks must not move the knob to where the finger landed.
    private swallowing = false;
    private timer: number | undefined;
    private afterPin: (() => void) | undefined;
    private unsubscribe: (() => void) | undefined;

    constructor(private readonly host: LockHost) {}

    private onChange(): void {
        this.host.forceUpdate();
    }

    options(data: LockInput): LockOptions {
        return lockOptionsOf(data, this.host.state?.data, !!this.host.props.editMode);
    }

    // On mount, never in the constructor: React may construct an instance it never mounts, and that
    // one would stay subscribed for good. Call it from componentDidMount; dispose() undoes it.
    mount(): void {
        this.unsubscribe ??= subscribePins(() => this.onChange());
    }

    // Read only wins: a read-only widget shows no lock, while the lock itself keeps its state.
    isLocked(o: LockState & Pick<LockOptions, 'readOnly'>): boolean {
        return !o.readOnly && this.closed(o);
    }

    private closed(o: LockState): boolean {
        if (!o.enabled || this.unlocked || this.holding) return false;
        return !(o.pin.kind === 'pin' && pinUnlocked(o.pin.pin));
    }

    // `afterUnlock` runs once the widget is unlocked, at once or after the right PIN.
    request(o: LockOptions, afterUnlock?: () => void): LockRequest {
        if (o.readOnly) return 'blocked';
        if (!this.closed(o)) return 'open';
        if (o.pin.kind === 'none') {
            this.unlock(o.seconds);
            afterUnlock?.();
            return 'unlocked';
        }
        if (o.editMode) return 'blocked';
        this.afterPin = afterUnlock;
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
        const after = this.afterPin;
        this.afterPin = undefined;
        this.padOpen = false;
        unlockPin(pin, seconds);
        after?.();
    }

    pinCancelled(): void {
        this.afterPin = undefined;
        this.padOpen = false;
        this.onChange();
    }

    pad(o: Pick<LockOptions, 'pin' | 'seconds'>, m3: boolean, dark: boolean): React.ReactElement | null {
        if (!this.padOpen) return null;
        return React.createElement(PinPad, { dark, m3, pin: o.pin, onCancel: () => this.pinCancelled(), onUnlock: (pin: string) => this.pinAccepted(pin, o.seconds) });
    }

    // A locked press only asks to unlock; the rest of that gesture does nothing.
    dragHandlers<T extends Element>(o: LockOptions, locked: boolean, disabled: boolean, on: DragHandlers<T>): PointerHandlers<T> {
        const release = (event: React.PointerEvent<T>): void => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        };
        return {
            onPointerDown: event => {
                if (locked) {
                    this.swallowing = true;
                    this.request(o);
                    return;
                }
                // A locked press released outside the element delivers no pointerup, so the flag may be stale.
                this.swallowing = false;
                if (disabled) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                this.hold(true, o);
                on.start(event);
            },
            onPointerMove: event => {
                if (!this.swallowing && event.currentTarget.hasPointerCapture(event.pointerId)) on.move(event);
            },
            onPointerUp: event => {
                event.stopPropagation();
                if (this.swallowing) {
                    this.swallowing = false;
                    return;
                }
                release(event);
                on.end();
                this.hold(false, o);
            },
            onPointerCancel: event => {
                if (this.swallowing) {
                    this.swallowing = false;
                    return;
                }
                release(event);
                on.cancel();
                this.hold(false, o);
            },
        };
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
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }
}
