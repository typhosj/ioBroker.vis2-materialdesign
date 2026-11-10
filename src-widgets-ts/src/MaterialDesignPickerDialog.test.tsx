import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PickerDialog, { type PickerDialogProps } from './MaterialDesignPickerDialog';

let container: HTMLDivElement;
let root: Root;
const onConfirm = vi.fn();
const onCancel = vi.fn();

const colors = { background: '#243949', accent: '#9bdcf3', text: '#eef6fb', onAccent: '#003643' };

function mount(overrides: Partial<PickerDialogProps> = {}): void {
    act(() =>
        root.render(
            <PickerDialog
                colors={colors}
                dark
                initialValue="2026-11-10"
                onCancel={onCancel}
                onConfirm={onConfirm}
                spec={{ kind: 'date', locale: 'de-DE', hour12: false }}
                today={{ year: 2026, month: 11, day: 10 }}
                {...overrides}
            />,
        ),
    );
}

const dialog = (): HTMLElement => {
    const found = document.body.querySelector<HTMLElement>('[role="dialog"]');
    if (!found) throw new Error('no dialog');
    return found;
};
const byText = (text: string): HTMLButtonElement => {
    const found = Array.from(dialog().querySelectorAll('button')).find(b => b.textContent === text);
    if (!found) throw new Error(`no button ${text}`);
    return found;
};
const click = (el: Element): void => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const key = (el: Element, k: string, shiftKey = false): void =>
    act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true })); });

beforeEach(() => {
    onConfirm.mockClear();
    onCancel.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe('PickerDialog semantics', () => {
    it('renders a labelled modal dialog outside the widget, in the M3 token scope', () => {
        mount();
        const d = dialog();
        expect(container.contains(d)).toBe(false);
        expect(d.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(d.getAttribute('aria-labelledby') || '')?.textContent).toBe('pickerSelectDate');
        const scrim = d.parentElement as HTMLElement;
        expect(scrim.className).toContain('mdw-style-material3');
        expect(scrim.className).toContain('mdw-dark');
    });

    it('gives every button an accessible name', () => {
        mount();
        const unnamed = Array.from(dialog().querySelectorAll('button')).filter(b => !(b.getAttribute('aria-label') || b.textContent?.trim()));
        expect(unnamed).toHaveLength(0);
    });

    it('passes the colours as variables', () => {
        mount();
        expect(dialog().style.getPropertyValue('--mdw-picker-accent')).toBe('#9bdcf3');
        expect(dialog().style.getPropertyValue('--mdw-picker-bg')).toBe('#243949');
    });

    it('focuses the selected day on open', () => {
        mount();
        expect((document.activeElement as HTMLElement).getAttribute('data-iso')).toBe('2026-11-10');
    });

    it('focuses the dial for a time', () => {
        mount({ spec: { kind: 'time', locale: 'de-DE', hour12: false }, initialValue: '19:45' });
        expect((document.activeElement as HTMLElement).getAttribute('role')).toBe('slider');
        expect(document.getElementById(dialog().getAttribute('aria-labelledby') || '')?.textContent).toBe('pickerSelectTime');
    });
});

describe('PickerDialog actions', () => {
    it('confirms the unchanged value with OK', () => {
        mount();
        click(byText('pickerOk'));
        expect(onConfirm).toHaveBeenCalledWith('2026-11-10');
    });

    it('confirms a changed day with OK', () => {
        mount();
        click(dialog().querySelector('[data-iso="2026-11-24"]') as Element);
        expect(onConfirm).not.toHaveBeenCalled();
        click(byText('pickerOk'));
        expect(onConfirm).toHaveBeenCalledWith('2026-11-24');
    });

    const press = (down: Element, up: Element): void =>
        act(() => {
            down.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
            up.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

    it('cancels with the button, Escape and a scrim tap, but not a tap inside', () => {
        mount();
        click(byText('pickerCancel'));
        key(dialog(), 'Escape');
        press(dialog(), dialog());
        expect(onCancel).toHaveBeenCalledTimes(2);
        const scrim = dialog().parentElement as HTMLElement;
        act(() => { scrim.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); });
        expect(onCancel).toHaveBeenCalledTimes(2); // not before the click: no ghost click underneath
        press(scrim, scrim);
        expect(onCancel).toHaveBeenCalledTimes(3);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not cancel when a press inside ends over the scrim', () => {
        mount();
        press(dialog(), dialog().parentElement as HTMLElement);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('keeps Escape and the Tab trap after a click on non-focusable content', () => {
        mount();
        const d = dialog();
        expect(d.getAttribute('tabindex')).toBe('-1');
        d.focus(); // what a click on the heading does to a tabindex=-1 container
        key(d, 'Tab', true);
        expect(document.activeElement).toBe(byText('pickerOk'));
        d.focus();
        key(d, 'Escape');
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('keeps Tab inside the dialog', () => {
        mount();
        const ok = byText('pickerOk');
        ok.focus();
        key(ok, 'Tab');
        const focusables = Array.from(dialog().querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'));
        expect(focusables.some(el => el.getAttribute('data-iso') === '2026-11-03')).toBe(false); // roving focus: only the selected day
        expect(document.activeElement).toBe(focusables[0]);
        key(focusables[0], 'Tab', true);
        expect(document.activeElement).toBe(ok);
    });
});
