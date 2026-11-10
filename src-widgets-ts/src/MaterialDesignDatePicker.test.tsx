import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DatePicker, { monthGrid } from './MaterialDesignDatePicker';

const today = { year: 2026, month: 11, day: 10 };
let container: HTMLDivElement;
let root: Root;
let onChange: Mock<(value: string) => void>;

function Harness({ initial, weekStartDay = 1 }: { initial: string; weekStartDay?: number }): React.JSX.Element {
    const [value, setValue] = useState(initial);
    return (
        <DatePicker
            locale="de-DE"
            onChange={next => {
                onChange(next);
                setValue(next);
            }}
            today={today}
            value={value}
            weekStartDay={weekStartDay}
        />
    );
}

function mount(initial: string, weekStartDay = 1): void {
    act(() => root.render(<Harness initial={initial} weekStartDay={weekStartDay} />));
}

const q = <T extends Element>(selector: string): T => {
    const found = container.querySelector<T>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
};
const click = (el: Element): void => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const key = (el: Element, k: string): void => act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); });
const yearButton = (): HTMLButtonElement => q('button[aria-expanded]');
const monthLabel = (): string => yearButton().textContent || '';

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

describe('monthGrid', () => {
    it('pads November 2026 (starts on a Sunday) for a Monday week', () => {
        const rows = monthGrid(2026, 11, 1);
        expect(rows[0]).toEqual([null, null, null, null, null, null, 1]);
        expect(rows).toHaveLength(6);
        expect(rows[5]).toEqual([30, null, null, null, null, null, null]);
    });

    it('needs no padding for a Sunday week in November 2026', () => {
        const rows = monthGrid(2026, 11, 0);
        expect(rows[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(rows).toHaveLength(5);
    });

    it('handles February in a common year', () => {
        const rows = monthGrid(2026, 2, 1);
        expect(rows.flat().filter(day => day !== null)).toHaveLength(28);
    });
});

describe('DatePicker', () => {
    it('starts the week on the given day and names it in the locale', () => {
        mount('2026-11-10');
        expect(container.querySelector('[role="columnheader"]')?.getAttribute('aria-label')).toBe('Montag');
        mount('2026-11-10', 0);
        expect(container.querySelector('[role="columnheader"]')?.getAttribute('aria-label')).toBe('Sonntag');
    });

    it('marks today and makes the selected day the focusable one', () => {
        mount('2026-11-24');
        expect(q('[data-iso="2026-11-10"]').getAttribute('aria-current')).toBe('date');
        expect(q('[data-iso="2026-11-24"]').getAttribute('data-autofocus')).toBe('true');
        expect(q('[data-iso="2026-11-24"]').getAttribute('tabindex')).toBe('0');
        expect(q('[data-iso="2026-11-23"]').getAttribute('tabindex')).toBe('-1');
    });

    it('selects a tapped day', () => {
        mount('2026-11-10');
        click(q('[data-iso="2026-11-24"]'));
        expect(onChange).toHaveBeenLastCalledWith('2026-11-24');
    });

    it('moves with the arrow keys across a month boundary', () => {
        mount('2026-11-30');
        key(q('[data-iso="2026-11-30"]'), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith('2026-12-01');
        expect(monthLabel()).toContain('Dezember 2026');
        key(q('[data-iso="2026-12-01"]'), 'ArrowUp');
        expect(onChange).toHaveBeenLastCalledWith('2026-11-24');
    });

    it('moves a month with Page Up and clamps the day', () => {
        mount('2026-03-31');
        key(q('[data-iso="2026-03-31"]'), 'PageUp');
        expect(onChange).toHaveBeenLastCalledWith('2026-02-28');
    });

    it('jumps to week start and end with Home and End', () => {
        mount('2026-11-10'); // a Tuesday
        key(q('[data-iso="2026-11-10"]'), 'Home');
        expect(onChange).toHaveBeenLastCalledWith('2026-11-09');
        key(q('[data-iso="2026-11-09"]'), 'End');
        expect(onChange).toHaveBeenLastCalledWith('2026-11-15');
    });

    it('pages months without changing the selection', () => {
        mount('2026-11-10');
        click(q('[aria-label="ariaPreviousMonth"]'));
        expect(monthLabel()).toContain('Oktober 2026');
        click(q('[aria-label="ariaNextMonth"]'));
        click(q('[aria-label="ariaNextMonth"]'));
        expect(monthLabel()).toContain('Dezember 2026');
        expect(onChange).not.toHaveBeenCalled();
        // the selected day is not in view, so day 1 takes the focus slot
        expect(q('[data-iso="2026-12-01"]').getAttribute('tabindex')).toBe('0');
    });

    it('moves from the focused day after paging, not from the selection', () => {
        mount('2026-11-10');
        click(q('[aria-label="ariaNextMonth"]'));
        key(q('[data-iso="2026-12-01"]'), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith('2026-12-02');
        expect(monthLabel()).toContain('Dezember 2026');
    });

    it('names the year button with its visible month label first', () => {
        mount('2026-11-10');
        expect(yearButton().getAttribute('aria-label')).toBe('November 2026, ariaChooseYear');
    });

    it('switches the year through the year list', () => {
        mount('2026-11-10');
        click(yearButton());
        const year = Array.from(container.querySelectorAll('button')).find(b => b.textContent === '2030');
        if (!year) throw new Error('no 2030');
        click(year);
        expect(monthLabel()).toContain('November 2030');
        expect(onChange).not.toHaveBeenCalled();
    });
});
