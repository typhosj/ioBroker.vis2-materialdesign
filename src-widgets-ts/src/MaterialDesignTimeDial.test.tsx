import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TimeDial from './MaterialDesignTimeDial';
import { DIAL_CENTER, INNER_RADIUS, OUTER_RADIUS } from './timeDialGeometry';

let container: HTMLDivElement;
let root: Root;
let onChange: Mock<(value: string) => void>;

function Harness({ initial, hour12 }: { initial: string; hour12: boolean }): React.JSX.Element {
    const [value, setValue] = useState(initial);
    return (
        <TimeDial
            hour12={hour12}
            onChange={next => {
                onChange(next);
                setValue(next);
            }}
            value={value}
        />
    );
}

const mount = (initial: string, hour12 = false): void => act(() => root.render(<Harness hour12={hour12} initial={initial} />));
const q = <T extends Element>(selector: string): T => {
    const found = container.querySelector<T>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
};
const click = (el: Element): void => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const key = (el: Element, k: string): void => act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); });
const button = (label: string): HTMLButtonElement => q(`button[aria-label="${label}"]`);
const byText = (text: string): HTMLButtonElement => {
    const found = Array.from(container.querySelectorAll('button')).find(b => b.textContent === text);
    if (!found) throw new Error(`no button ${text}`);
    return found;
};

// jsdom has no layout: give the SVG the size of the dial so pointer maths maps 1:1.
function tap(x: number, y: number): void {
    const svg = q<SVGSVGElement>('svg');
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 256, height: 256, right: 256, bottom: 256, x: 0, y: 0, toJSON: () => ({}) });
    act(() => {
        svg.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));
        svg.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: x, clientY: y }));
    });
}

beforeEach(() => {
    onChange = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe('TimeDial header', () => {
    it('shows 24 h without a period', () => {
        mount('19:45');
        expect(button('pickerHour').textContent).toBe('19');
        expect(button('pickerMinute').textContent).toBe('45');
        expect(container.textContent).not.toContain('PM');
    });

    it('shows 12 h with the period pressed', () => {
        mount('19:45', true);
        expect(button('pickerHour').textContent).toBe('07');
        expect(byText('PM').getAttribute('aria-pressed')).toBe('true');
        expect(byText('AM').getAttribute('aria-pressed')).toBe('false');
    });

    it('switches the period', () => {
        mount('19:45', true);
        click(byText('AM'));
        expect(onChange).toHaveBeenLastCalledWith('07:45');
        click(byText('PM'));
        expect(onChange).toHaveBeenLastCalledWith('19:45');
    });
});

describe('TimeDial keyboard', () => {
    it('changes and wraps the hour', () => {
        mount('23:45');
        key(q('[role="slider"]'), 'ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith('00:45');
        key(q('[role="slider"]'), 'ArrowDown');
        expect(onChange).toHaveBeenLastCalledWith('23:45');
    });

    it('changes and wraps the minute in minute mode', () => {
        mount('19:59');
        click(button('pickerMinute'));
        expect(button('pickerMinute').getAttribute('aria-pressed')).toBe('true');
        key(q('[role="slider"]'), 'ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith('19:00');
    });

    it('reports the value to assistive technology', () => {
        mount('07:05', true);
        expect(q('[role="slider"]').getAttribute('aria-valuenow')).toBe('7');
        expect(q('[aria-live="polite"]').textContent).toBe('07:05 AM');
    });
});

describe('TimeDial pointer', () => {
    it('picks an inner-ring hour in 24 h and moves on to minutes', () => {
        mount('19:45');
        tap(DIAL_CENTER + INNER_RADIUS, DIAL_CENTER); // 3 o'clock, inner ring
        expect(onChange).toHaveBeenLastCalledWith('15:45');
        expect(button('pickerMinute').getAttribute('aria-pressed')).toBe('true');
        tap(DIAL_CENTER, DIAL_CENTER + OUTER_RADIUS); // 6 o'clock in minute mode
        expect(onChange).toHaveBeenLastCalledWith('15:30');
    });

    it('stops following the pointer after the browser cancels the drag', () => {
        mount('19:45');
        const svg = q<SVGSVGElement>('svg');
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 256, height: 256, right: 256, bottom: 256, x: 0, y: 0, toJSON: () => ({}) });
        const fire = (type: string, x: number, y: number): void =>
            act(() => { svg.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y })); });
        fire('pointerdown', DIAL_CENTER + OUTER_RADIUS, DIAL_CENTER); // 3 o'clock
        expect(onChange).toHaveBeenLastCalledWith('03:45');
        fire('pointercancel', DIAL_CENTER + OUTER_RADIUS, DIAL_CENTER);
        fire('pointermove', DIAL_CENTER, DIAL_CENTER + OUTER_RADIUS); // 6 o'clock
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('picks 12 AM as hour 0 in 12 h', () => {
        mount('07:45', true);
        tap(DIAL_CENTER, DIAL_CENTER - OUTER_RADIUS);
        expect(onChange).toHaveBeenLastCalledWith('00:45');
    });

    it('picks 12 PM as hour 12 in 12 h', () => {
        mount('19:45', true);
        tap(DIAL_CENTER, DIAL_CENTER - OUTER_RADIUS);
        expect(onChange).toHaveBeenLastCalledWith('12:45');
    });
});
