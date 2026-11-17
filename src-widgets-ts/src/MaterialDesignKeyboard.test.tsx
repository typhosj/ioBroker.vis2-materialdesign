import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignKeyboard, { isServable, originalInputMode, scrollParent } from './MaterialDesignKeyboard';
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

function box(el: Element, left: number, top: number, width: number, height: number): void {
    (el as HTMLElement).getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) });
}
const placeholder = (): HTMLElement => container.querySelector('.materialdesign-keyboard') as HTMLElement;
const view = (): HTMLElement => container.querySelector('#visview_test') as HTMLElement;
const rx = (): Record<string, unknown> => fixture<{ state: { rxData: Record<string, unknown> } }>(current).state.rxData;

describe('placement', () => {
    it('sits where the editor placed it', () => {
        start(keyboard());
        box(placeholder(), 10, 400, 600, 200);
        focus(field('title'));
        expect(panel()?.style.top).toBe('400px');
        expect(panel()?.style.left).toBe('10px');
        expect(panel()?.style.width).toBe('600px');
        expect(panel()?.style.position).toBe('fixed');
    });

    it('spans the view at its bottom or top, and the screen at its bottom', () => {
        start(keyboard({ keyboardPosition: 'viewBottom' }));
        box(placeholder(), 10, 50, 300, 200);
        box(view(), 100, 0, 800, 700);
        focus(field('title'));
        expect([panel()?.style.left, panel()?.style.top, panel()?.style.width]).toEqual(['100px', '500px', '800px']);
        blur(field('title'));

        rx().keyboardPosition = 'viewTop';
        focus(field('title'));
        expect(panel()?.style.top).toBe('0px');
        blur(field('title'));

        rx().keyboardPosition = 'screenBottom';
        focus(field('title'));
        expect(panel()?.style.top).toBe(`${window.innerHeight - 200}px`);
        expect(panel()?.style.width).toBe(`${window.innerWidth}px`);
    });

    it('keeps a view taller than the window inside the window', () => {
        start(keyboard({ keyboardPosition: 'viewBottom' }));
        box(placeholder(), 0, 0, 300, 200);
        box(view(), 0, -100, 800, window.innerHeight + 500);
        focus(field('title'));
        expect(panel()?.style.top).toBe(`${window.innerHeight - 200}px`);
    });

    it('keeps a view that starts above the window at the top of the window', () => {
        start(keyboard({ keyboardPosition: 'viewTop' }));
        box(placeholder(), 0, 0, 300, 200);
        box(view(), 0, -100, 800, 700);
        focus(field('title'));
        expect(panel()?.style.top).toBe('0px');
    });

    it('falls back to the editor rectangle for an unknown position', () => {
        start(keyboard({ keyboardPosition: 'nowhere' }));
        box(placeholder(), 10, 400, 600, 200);
        focus(field('title'));
        expect([panel()?.style.left, panel()?.style.top]).toEqual(['10px', '400px']);
    });

    it('measures again after a resize', () => {
        start(keyboard());
        box(placeholder(), 0, 400, 600, 200);
        focus(field('title'));
        box(placeholder(), 0, 300, 600, 200);
        act(() => { window.dispatchEvent(new Event('resize')); });
        rerender();
        expect(panel()?.style.top).toBe('300px');
    });

    it('does nothing on a resize while hidden and after unmount', () => {
        start(keyboard());
        act(() => { window.dispatchEvent(new Event('resize')); });
        rerender();
        expect(panel()).toBeNull();
        box(placeholder(), 0, 400, 600, 200);
        focus(field('title'));
        act(() => current.componentWillUnmount());
        box(placeholder(), 0, 111, 600, 200);
        act(() => { window.dispatchEvent(new Event('resize')); });
        rerender();
        expect(panel()).toBeNull();
    });
});

describe('room for the field', () => {
    it('moves the view up just enough with "pan" and back on hiding', () => {
        start(keyboard({ keyboardShowMode: 'pan' }));
        view().style.transform = 'scale(1)';
        box(placeholder(), 0, 400, 600, 200);
        box(field('title'), 0, 470, 200, 30);
        focus(field('title'));
        expect(view().style.transform).toBe('scale(1) translateY(-108px)');
        blur(field('title'));
        expect(view().style.transform).toBe('scale(1)');
    });

    it('does not move the view when the field is visible', () => {
        start(keyboard({ keyboardShowMode: 'pan' }));
        box(placeholder(), 0, 400, 600, 200);
        box(field('title'), 0, 100, 200, 30);
        focus(field('title'));
        expect(view().style.transform).toBe('');
    });

    it('moves nothing with "overlay" or an unknown mode', () => {
        for (const mode of ['overlay', 'bogus']) {
            start(keyboard({ keyboardShowMode: mode }));
            box(placeholder(), 0, 400, 600, 200);
            box(field('title'), 0, 470, 200, 30);
            focus(field('title'));
            expect(view().style.transform).toBe('');
            expect(view().style.paddingBottom).toBe('');
            blur(field('title'));
            act(() => current.componentWillUnmount());
        }
    });

    it('follows the next field without adding up the offset', () => {
        start(keyboard({ keyboardShowMode: 'pan' }));
        box(placeholder(), 0, 400, 600, 200);
        box(field('title'), 0, 470, 200, 30);
        focus(field('title'));
        // The view moved up by 108, so the second field's rectangle is already shifted.
        box(field('place'), 0, 420 - 108, 200, 30);
        focus(field('place'));
        expect(view().style.transform).toBe('translateY(-58px)');
    });

    it('pads the scrolling ancestor and scrolls with "pad"', () => {
        let scrolled = 0;
        const scroller = <div data-testid="scroller" style={{ overflowY: 'scroll' }}><input aria-label="inner" /></div>;
        start(keyboard({ keyboardShowMode: 'pad' }), scroller);
        const el = container.querySelector('[data-testid="scroller"]') as HTMLElement;
        Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => scrolled, set: (v: number) => { scrolled = v; } });
        box(placeholder(), 0, 400, 600, 200);
        box(field('inner'), 0, 470, 200, 30);
        focus(field('inner'));
        expect(el.style.paddingBottom).toBe('200px');
        expect(scrolled).toBe(108);
        blur(field('inner'));
        expect(el.style.paddingBottom).toBe('');
    });

    it('puts the transform back when unmounted while panned', () => {
        start(keyboard({ keyboardShowMode: 'pan' }));
        view().style.transform = 'scale(1)';
        box(placeholder(), 0, 400, 600, 200);
        box(field('title'), 0, 470, 200, 30);
        focus(field('title'));
        expect(view().style.transform).not.toBe('scale(1)');
        act(() => current.componentWillUnmount());
        expect(view().style.transform).toBe('scale(1)');
        expect(view().style.transition).toBe('');
    });

    it('puts the padding back when unmounted while padded', () => {
        const scroller = <div data-testid="scroller" style={{ overflowY: 'scroll', paddingBottom: '3px' }}><input aria-label="inner" /></div>;
        start(keyboard({ keyboardShowMode: 'pad' }), scroller);
        const el = container.querySelector('[data-testid="scroller"]') as HTMLElement;
        box(placeholder(), 0, 400, 600, 200);
        box(field('inner'), 0, 470, 200, 30);
        focus(field('inner'));
        expect(el.style.paddingBottom).toBe('200px');
        act(() => current.componentWillUnmount());
        expect(el.style.paddingBottom).toBe('3px');
    });

    it('finds the scrolling ancestor or falls back to the document', () => {
        const outer = document.createElement('div');
        outer.style.overflowY = 'auto';
        const inner = document.createElement('input');
        outer.appendChild(inner);
        document.body.appendChild(outer);
        expect(scrollParent(inner)).toBe(outer);
        const lone = document.createElement('input');
        document.body.appendChild(lone);
        expect(scrollParent(lone)).toBe(document.scrollingElement ?? document.documentElement);
        expect(scrollParent(document.createElement('input'))).toBe(document.scrollingElement ?? document.documentElement);
        outer.remove();
        lone.remove();
    });
});

describe('animation', () => {
    it('slides in by default, from above at the top, fades or stays still', () => {
        start(keyboard({ keyboardAnimation: 'slide' }));
        focus(field('title'));
        expect(panel()?.style.animation).toContain('mdkb-slide-up 150ms');
        blur(field('title'));
        rx().keyboardPosition = 'viewTop';
        focus(field('title'));
        expect(panel()?.style.animation).toContain('mdkb-slide-down 150ms');
        blur(field('title'));
        Object.assign(rx(), { keyboardAnimation: 'fade', keyboardAnimationMs: 300 });
        focus(field('title'));
        expect(panel()?.style.animation).toContain('mdkb-fade 300ms');
        blur(field('title'));
        rx().keyboardAnimation = 'none';
        focus(field('title'));
        expect(panel()?.style.animation).toBeFalsy();
    });

    it('does not animate for a duration of 0 or less', () => {
        start(keyboard({ keyboardAnimation: 'slide', keyboardAnimationMs: 0 }));
        focus(field('title'));
        expect(panel()?.style.animation).toBeFalsy();
        blur(field('title'));
        rx().keyboardAnimationMs = -50;
        focus(field('title'));
        expect(panel()?.style.animation).toBeFalsy();
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
