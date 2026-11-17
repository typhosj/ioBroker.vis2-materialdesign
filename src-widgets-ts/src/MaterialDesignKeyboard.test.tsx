import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignKeyboard, { isServable, originalInputMode } from './MaterialDesignKeyboard';
import { ownCssVariables } from './widgetUtils';

function fixture<T>(value: unknown): T {
    return value as T;
}

const setValue = vi.fn();
const socket = { subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() };
const props = { id: 'wkb', context: { setValue, socket } };
const renderProps = fixture<Parameters<MaterialDesignKeyboard['renderWidgetBody']>[0]>(props);

function keyboard(rxData: Record<string, unknown> = {}, values: Record<string, unknown> = {}, editMode = false): MaterialDesignKeyboard {
    const w = new MaterialDesignKeyboard(fixture<ConstructorParameters<typeof MaterialDesignKeyboard>[0]>({ ...props, editMode }));
    fixture<{ state: unknown }>(w).state = { rxData: { keyboardLanguage: 'de', keyboardAnimation: 'none', keyboardSuggestions: false, ...rxData }, values };
    return w;
}

let container: HTMLDivElement;
let root: Root;
let current: MaterialDesignKeyboard;
/** Extra content of the view; a function is called on every render (for a widget inside it). */
type Extra = React.ReactNode | (() => React.ReactNode);
let currentExtra: Extra = null;

/** A view with fields inside widgets w1 and w2, a checkbox, a read-only and a number field. */
function mount(w: MaterialDesignKeyboard, extra: Extra = currentExtra): void {
    current = w;
    currentExtra = extra;
    act(() =>
        root.render(
            <div id="visview_test">
                <div id="w1"><input aria-label="title" /></div>
                <div id="w2"><input aria-label="place" inputMode="decimal" /></div>
                <input aria-label="check" type="checkbox" />
                <input aria-label="fixed" readOnly />
                <input aria-label="amount" type="number" />
                {typeof extra === 'function' ? extra() : extra}
                {w.renderWidgetBody(renderProps)}
            </div>,
        ),
    );
}
// The test base class has a no-op forceUpdate, so every step re-renders explicitly.
const rerender = (): void => mount(current, currentExtra);
const field = (label: string): HTMLInputElement => document.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
const panel = (): HTMLElement | null => document.body.querySelector('[aria-label="keyboardAria"]');
const key = (name: string): HTMLButtonElement => panel()?.querySelector(`[data-key="${name}"]`) as HTMLButtonElement;
function press(name: string): void {
    act(() => { key(name).dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
}
function release(name: string): void {
    act(() => { key(name)?.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); });
    rerender();
}
function tap(...names: string[]): void {
    for (const name of names) { press(name); release(name); }
}
function focus(el: HTMLElement): void { act(() => el.focus()); rerender(); }
function blur(el: HTMLElement): void { act(() => el.blur()); rerender(); }
function start(w: MaterialDesignKeyboard, extra: Extra = null): void {
    mount(w, extra);
    act(() => w.componentDidMount());
}

beforeEach(() => {
    setValue.mockClear();
    currentExtra = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => current?.componentWillUnmount());
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
});

describe('served fields', () => {
    it('serves text fields and textareas, not buttons, pickers, read-only or disabled fields', () => {
        const make = (html: string): Element => { const box = document.createElement('div'); box.innerHTML = html; return box.firstElementChild as Element; };
        expect(isServable(make('<input>'))).toBe(true);
        expect(isServable(make('<input type="search">'))).toBe(true);
        expect(isServable(make('<textarea></textarea>'))).toBe(true);
        for (const html of ['<input type="checkbox">', '<input type="date">', '<input type="time">', '<input type="hidden">', '<input type="range">', '<input readonly>', '<input disabled>', '<textarea readonly></textarea>', '<button></button>', '<div></div>']) {
            expect(isServable(make(html))).toBe(false);
        }
        expect(isServable(null)).toBe(false);
    });

    it('sets inputmode none on served fields, keeps the original and restores it on unmount', () => {
        start(keyboard());
        expect(field('title').getAttribute('inputmode')).toBe('none');
        expect(field('place').getAttribute('inputmode')).toBe('none');
        expect(originalInputMode(field('place'))).toBe('decimal');
        expect(originalInputMode(field('title'))).toBe('');
        expect(field('check').hasAttribute('inputmode')).toBe(false);
        expect(field('fixed').hasAttribute('inputmode')).toBe(false);
        act(() => current.componentWillUnmount());
        expect(field('place').getAttribute('inputmode')).toBe('decimal');
        expect(field('title').hasAttribute('inputmode')).toBe(false);
        expect(field('title').hasAttribute('data-mdkb-inputmode')).toBe(false);
    });

    it('serves only the listed widgets', () => {
        start(keyboard({ keyboardFields: 'w1' }));
        expect(field('title').getAttribute('inputmode')).toBe('none');
        expect(field('place').getAttribute('inputmode')).toBe('decimal');
        focus(field('place'));
        expect(panel()).toBeNull();
    });

    it('also takes a field that appears later', async () => {
        start(keyboard());
        mount(current, <input aria-label="late" />);
        // MutationObserver callbacks run as microtasks.
        await act(async () => { await Promise.resolve(); });
        expect(field('late').getAttribute('inputmode')).toBe('none');
    });

    it('changes nothing in the editor and shows the keys inline', () => {
        start(keyboard({}, {}, true));
        expect(field('title').hasAttribute('inputmode')).toBe(false);
        const inline = container.querySelector('[aria-label="keyboardAria"]');
        expect(inline).not.toBeNull();
    });
});

describe('showing and hiding', () => {
    it('stays hidden until a served field has the focus', () => {
        start(keyboard());
        expect(panel()).toBeNull();
        focus(field('check'));
        expect(panel()).toBeNull();
        focus(field('title'));
        expect(panel()).not.toBeNull();
    });

    it('stays open between served fields and hides on leaving them', () => {
        start(keyboard());
        focus(field('title'));
        focus(field('place'));
        expect(panel()).not.toBeNull();
        blur(field('place'));
        expect(panel()).toBeNull();
    });

    it('cancels the pointer and mouse press on a key so a browser keeps the focus in the field', () => {
        start(keyboard());
        focus(field('title'));
        const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
        const mouse = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        act(() => { key('a').dispatchEvent(down); });
        act(() => { key('a').dispatchEvent(mouse); });
        expect(down.defaultPrevented).toBe(true);
        expect(mouse.defaultPrevented).toBe(true);
        // jsdom never moves the focus on a press, so this alone proves nothing about browsers.
        expect(document.activeElement).toBe(field('title'));
    });
});

describe('typing', () => {
    it('types into a real Input widget, capitalises the start and commits on Enter', () => {
        const inputProps = { id: 'w3', context: { setValue } };
        const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>(inputProps));
        fixture<{ state: unknown }>(input).state = { rxData: { oid: 'x.0.title', inputType: 'text' }, values: {} };
        // Rendered fresh on every mount, so the controlled field shows the Input's own value.
        start(keyboard(), () => <div id="w3">{input.renderWidgetBody(fixture<Parameters<MaterialDesignInput['renderWidgetBody']>[0]>(inputProps))}</div>);
        const el = document.querySelector('#w3 input') as HTMLInputElement;
        focus(el);
        tap('h', 'i');
        expect(el.value).toBe('Hi');
        tap('enter');
        expect(setValue).toHaveBeenLastCalledWith('x.0.title', 'Hi');
        expect(panel()).toBeNull();
    });

    it('deletes, shifts once, locks on a double tap and switches to symbols', () => {
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'backspace');
        expect(field('title').value).toBe('a');
        tap('shift', 'b', 'c');
        expect(field('title').value).toBe('aBc');
        tap('shift', 'shift', 'd', 'e');
        expect(field('title').value).toBe('aBcDE');
        tap('shift', 'f');
        expect(field('title').value).toBe('aBcDEf');
        tap('symbols');
        expect(key('q')).toBeNull();
        tap('€', 'letters');
        expect(field('title').value).toBe('aBcDEf€');
        expect(key('q')).not.toBeNull();
    });

    it('inserts at the caret', () => {
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'c');
        act(() => field('title').setSelectionRange(1, 1));
        tap('b');
        expect(field('title').value).toBe('abc');
        expect(field('title').selectionStart).toBe(2);
    });

    it('shows the number pad for number fields and writes a dot there', () => {
        start(keyboard());
        focus(field('amount'));
        expect(key('q')).toBeNull();
        tap('1', 'decimal');
        // The number field itself reports '' for "1."; the keyboard keeps the typed text.
        expect(field('amount').value).toBe('');
        tap('5');
        expect(field('amount').value).toBe('1.5');
        tap('backspace', 'backspace', 'backspace', '-', '3');
        expect(field('amount').value).toBe('-3');
        focus(field('place'));
        tap('decimal');
        expect(field('place').value).toBe(',');
    });

    it('forgets the kept number text when another field gets the focus', () => {
        start(keyboard());
        focus(field('amount'));
        tap('-');
        focus(field('title'));
        focus(field('amount'));
        act(() => { field('amount').value = '7'; });
        tap('2');
        expect(field('amount').value).toBe('72');
    });

    it('repeats backspace while held', () => {
        vi.useFakeTimers();
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c', 'd', 'e', 'f');
        press('backspace');
        act(() => { vi.advanceTimersByTime(499); });
        expect(field('title').value).toBe('abcde');
        act(() => { vi.advanceTimersByTime(101); });
        expect(field('title').value).toBe('abc');
        release('backspace');
        act(() => { vi.advanceTimersByTime(500); });
        expect(field('title').value).toBe('abc');
    });
});

describe('Enter and close', () => {
    it('moves to the next served field and closes after the last', () => {
        start(keyboard({ keyboardEnter: 'next', keyboardFields: 'w1 w2' }));
        focus(field('title'));
        tap('enter');
        expect(document.activeElement).toBe(field('place'));
        tap('enter');
        expect(document.activeElement).toBe(document.body);
        expect(panel()).toBeNull();
    });

    it('keeps focus and keyboard with "stay"', () => {
        start(keyboard({ keyboardEnter: 'stay' }));
        focus(field('title'));
        tap('enter');
        expect(document.activeElement).toBe(field('title'));
        expect(panel()).not.toBeNull();
    });

    it('closes with the close key', () => {
        start(keyboard());
        focus(field('title'));
        tap('close');
        expect(document.activeElement).toBe(document.body);
        expect(panel()).toBeNull();
    });
});

describe('cleanup', () => {
    it('stops listening and observing after unmount', async () => {
        start(keyboard());
        act(() => current.componentWillUnmount());
        act(() => field('title').focus());
        rerender();
        expect(panel()).toBeNull();
        mount(current, <input aria-label="later" />);
        await act(async () => { await Promise.resolve(); });
        expect(field('later').hasAttribute('inputmode')).toBe(false);
    });

    it('stops a held backspace on unmount', () => {
        vi.useFakeTimers();
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c', 'd');
        press('backspace');
        act(() => current.componentWillUnmount());
        act(() => { vi.advanceTimersByTime(2000); });
        expect(field('title').value).toBe('abc');
    });

    it('survives a second unmount and a field removed before it', () => {
        start(keyboard());
        const gone = field('place');
        gone.remove();
        expect(() => act(() => current.componentWillUnmount())).not.toThrow();
        expect(() => act(() => current.componentWillUnmount())).not.toThrow();
        expect(field('title').hasAttribute('inputmode')).toBe(false);
    });
});

describe('keyboardFields list', () => {
    it('serves nothing for an unknown id', () => {
        start(keyboard({ keyboardFields: 'nope' }));
        expect(field('title').getAttribute('inputmode')).toBeNull();
        focus(field('title'));
        expect(panel()).toBeNull();
    });

    it('accepts mixed separators', () => {
        start(keyboard({ keyboardFields: 'w1, ;w2' }));
        expect(field('title').getAttribute('inputmode')).toBe('none');
        expect(field('place').getAttribute('inputmode')).toBe('none');
        expect(field('amount').hasAttribute('inputmode')).toBe(false);
    });
});

describe('textarea', () => {
    const area = (): HTMLTextAreaElement => document.querySelector('[aria-label="notes"]') as HTMLTextAreaElement;
    const withArea = (): React.ReactNode => <textarea aria-label="notes" />;

    it('types, replaces a selection and blurs on Enter', () => {
        start(keyboard({ keyboardAutoCapitalize: false }), withArea);
        focus(area());
        tap('a', 'b', 'c');
        expect(area().value).toBe('abc');
        act(() => area().setSelectionRange(0, 2));
        tap('x');
        expect(area().value).toBe('xc');
        expect(area().selectionStart).toBe(1);
        tap('enter');
        expect(document.activeElement).toBe(document.body);
        expect(panel()).toBeNull();
    });
});

describe('ownCssVariables', () => {
    it('copies only custom properties', () => {
        const host = document.createElement('div');
        host.style.setProperty('--md-sys-color-primary', '#123456');
        host.style.color = 'red';
        expect(ownCssVariables(host)).toEqual({ '--md-sys-color-primary': '#123456' });
        expect(ownCssVariables(null)).toEqual({});
    });
});
