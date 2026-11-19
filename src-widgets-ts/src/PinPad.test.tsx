import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PinPad from './PinPad';
import { keyLook } from './keyLook';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); document.body.innerHTML = ''; });

const show = (pin: Parameters<typeof PinPad>[0]['pin']) => {
    const onUnlock = vi.fn();
    const onCancel = vi.fn();
    act(() => root.render(<PinPad dark={false} m3 onCancel={onCancel} onUnlock={onUnlock} pin={pin} />));
    const key = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[data-pin-key]')].find(button => button.dataset.pinKey === label)!;
    const press = (label: string) => act(() => { key(label).click(); });
    const dots = () => document.querySelectorAll('[data-pin-dot][data-filled="true"]').length;
    return { onUnlock, onCancel, key, press, dots };
};

describe('PinPad', () => {
    it('shows a 4x3 grid and no input element', () => {
        show({ kind: 'pin', pin: '12' });
        const labels = [...document.querySelectorAll<HTMLButtonElement>('[data-pin-key]')].map(button => button.dataset.pinKey);
        expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'delete']);
        expect(document.querySelector('input, textarea')).toBeNull();
    });

    it('checks once as many digits as the PIN has are typed', () => {
        const pad = show({ kind: 'pin', pin: '4711' });
        pad.press('4'); pad.press('7'); pad.press('1');
        expect(pad.onUnlock).not.toHaveBeenCalled();
        expect(pad.dots()).toBe(3);
        pad.press('1');
        expect(pad.onUnlock).toHaveBeenCalledWith('4711');
    });

    it('a wrong PIN clears the digits and stays open', () => {
        const pad = show({ kind: 'pin', pin: '12' });
        pad.press('1'); pad.press('3');
        expect(pad.onUnlock).not.toHaveBeenCalled();
        expect(pad.dots()).toBe(0);
        expect(document.querySelector('[data-pin-wrong="true"]')).not.toBeNull();
        pad.press('1'); pad.press('2');
        expect(pad.onUnlock).toHaveBeenCalledWith('12');
    });

    it('delete removes the last digit, cancel cancels', () => {
        const pad = show({ kind: 'pin', pin: '123' });
        pad.press('1'); pad.press('9'); pad.press('delete');
        expect(pad.dots()).toBe(1);
        pad.press('2'); pad.press('3');
        expect(pad.onUnlock).toHaveBeenCalledWith('123');
        pad.press('cancel');
        expect(pad.onCancel).toHaveBeenCalledTimes(1);
    });

    it('takes digits, Backspace and Escape from a hardware keyboard', () => {
        const pad = show({ kind: 'pin', pin: '123' });
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
        const key = (k: string) => act(() => { dialog.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); });
        key('1'); key('9'); key('Backspace'); key('2'); key('3');
        expect(pad.onUnlock).toHaveBeenCalledWith('123');
        key('Escape');
        expect(pad.onCancel).toHaveBeenCalledTimes(1);
    });

    it('a PIN that is not set up disables the digits; only cancel works', () => {
        const pad = show({ kind: 'invalid' });
        expect(document.body.textContent).toContain('pinPadNotSetUp');
        expect(pad.key('1').disabled).toBe(true);
        expect(pad.key('delete').disabled).toBe(true);
        expect(pad.key('cancel').disabled).toBe(false);
        pad.press('cancel');
        expect(pad.onCancel).toHaveBeenCalledTimes(1);
    });
});

describe('keyLook', () => {
    it('gives the keyboard defaults in both styles and clamps sizes', () => {
        expect(keyLook({}, true, false)).toMatchObject({ key: 'var(--md-sys-color-surface)', text: 'var(--md-sys-color-on-surface)', fontSize: 18, gap: 6, radius: 8 });
        expect(keyLook({}, false, true).background).toBe('#121212');
        expect(keyLook({ keyboardFontSize: 500, keyboardKeyGap: -3 }, false, false)).toMatchObject({ fontSize: 64, gap: 0 });
    });
});
