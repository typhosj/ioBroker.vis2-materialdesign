(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignKeyboard, { isServable, noteInput, originalInputMode, scrollParent } from './MaterialDesignKeyboard';
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
    fixture<{ state: unknown }>(w).state = { rxData: { keyboardLanguage: 'de', keyboardAnimation: 'none', keyboardSuggestions: false, keyboardShowOn: 'always', ...rxData }, values };
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

describe('show on', () => {
    const touchy = (): MaterialDesignKeyboard => keyboard({ keyboardShowOn: 'touch' });
    const media = (matches: boolean | null): void => {
        vi.stubGlobal('matchMedia', matches === null ? undefined : (query: string) => ({ matches: matches && query === '(pointer: coarse)' }));
    };
    beforeEach(() => { noteInput(null); media(null); });
    afterEach(() => { vi.unstubAllGlobals(); noteInput(null); });

    it('opens after touch or pen input', () => {
        for (const type of ['touch', 'pen'] as const) {
            start(touchy());
            noteInput(type);
            focus(field('title'));
            expect(panel()).not.toBeNull();
            act(() => current.componentWillUnmount());
        }
    });

    it('stays closed after mouse or keyboard input', () => {
        start(touchy());
        noteInput('mouse');
        focus(field('title'));
        expect(panel()).toBeNull();
        blur(field('title'));
        noteInput('keyboard');
        focus(field('title'));
        expect(panel()).toBeNull();
    });

    it('decides by a coarse pointer when no input was seen', () => {
        media(true);
        start(touchy());
        focus(field('title'));
        expect(panel()).not.toBeNull();
        blur(field('title'));
        media(false);
        focus(field('title'));
        expect(panel()).toBeNull();
    });

    it('treats a missing or throwing matchMedia as no touch', () => {
        start(touchy());
        focus(field('title'));
        expect(panel()).toBeNull();
        blur(field('title'));
        vi.stubGlobal('matchMedia', () => { throw new Error('no'); });
        focus(field('title'));
        expect(panel()).toBeNull();
    });

    it('also decides for a field that already has the focus when the widget attaches', () => {
        noteInput('mouse');
        mount(touchy());
        act(() => field('title').focus());
        act(() => current.componentDidMount());
        rerender();
        expect(panel()).toBeNull();
    });

    it('opens on every focus with "always"', () => {
        start(keyboard({ keyboardShowOn: 'always' }));
        noteInput('mouse');
        focus(field('title'));
        expect(panel()).not.toBeNull();
    });

    it('keeps the keyboard when a mouse click moves into another served field', () => {
        start(touchy());
        noteInput('touch');
        focus(field('title'));
        noteInput('mouse');
        focus(field('place'));
        expect(panel()).not.toBeNull();
    });

    it('takes no untrusted input events into account', () => {
        start(touchy());
        noteInput('touch');
        act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })); });
        act(() => { document.dispatchEvent(new MouseEvent('pointerdown')); });
        focus(field('title'));
        expect(panel()).not.toBeNull();
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
        expect(field('amount').value).toBe('1.');
        tap('5');
        expect(field('amount').value).toBe('1.5');
        tap('backspace', 'backspace', 'backspace', '-');
        expect(field('amount').value).toBe('-');
        tap('3');
        expect(field('amount').value).toBe('-3');
        focus(field('place'));
        tap('decimal');
        expect(field('place').value).toBe(',');
    });

    it('forgets the kept text of a field without selection API when another field gets the focus', () => {
        start(keyboard(), <input aria-label="mail" type="email" />);
        focus(field('mail'));
        tap('a');
        focus(field('title'));
        focus(field('mail'));
        act(() => { field('mail').value = 'x'; });
        tap('b');
        expect(field('mail').value).toBe('xb');
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

describe('ghost click after the keyboard hides', () => {
    const clicked = vi.fn();
    const overlay = (): HTMLElement => document.querySelector('[data-testid="overlay"]') as HTMLElement;
    const click = (): void => { act(() => { overlay().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }); };
    const extra = <div data-testid="overlay" onClick={clicked} />;
    beforeEach(() => clicked.mockClear());

    it('swallows the click that follows the close key, once', () => {
        start(keyboard(), extra);
        focus(field('title'));
        press('close');
        rerender();
        expect(panel()).toBeNull();
        click();
        expect(clicked).not.toHaveBeenCalled();
        click();
        expect(clicked).toHaveBeenCalledTimes(1);
    });

    it('stops swallowing after 600 ms', () => {
        vi.useFakeTimers();
        start(keyboard(), extra);
        focus(field('title'));
        press('close');
        act(() => { vi.advanceTimersByTime(600); });
        click();
        expect(clicked).toHaveBeenCalledTimes(1);
    });

    it('swallows the click after Enter in close mode and after next on the last field', () => {
        start(keyboard({ keyboardEnter: 'close' }), extra);
        focus(field('title'));
        press('enter');
        click();
        expect(clicked).not.toHaveBeenCalled();
        act(() => current.componentWillUnmount());
        start(keyboard({ keyboardEnter: 'next', keyboardFields: 'w1' }), extra);
        focus(field('title'));
        press('enter');
        click();
        expect(clicked).not.toHaveBeenCalled();
    });

    it('does not swallow after keys that leave the keyboard open', () => {
        start(keyboard({ keyboardEnter: 'stay' }), extra);
        focus(field('title'));
        press('a');
        click();
        expect(clicked).toHaveBeenCalledTimes(1);
        press('enter');
        click();
        expect(clicked).toHaveBeenCalledTimes(2);
    });

    it('does not swallow after Enter moved on to another field', () => {
        start(keyboard({ keyboardEnter: 'next', keyboardFields: 'w1 w2' }), extra);
        focus(field('title'));
        press('enter');
        click();
        expect(clicked).toHaveBeenCalledTimes(1);
    });

    it('removes the pending swallow on unmount', () => {
        start(keyboard(), extra);
        focus(field('title'));
        press('close');
        act(() => current.componentWillUnmount());
        click();
        expect(clicked).toHaveBeenCalledTimes(1);
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
        const rectOf = vi.fn(() => ({ left: 0, top: 400, width: 600, height: 200, right: 600, bottom: 600, x: 0, y: 400, toJSON: () => ({}) }));
        placeholder().getBoundingClientRect = rectOf;
        act(() => { window.dispatchEvent(new Event('resize')); });
        rerender();
        expect(panel()).toBeNull();
        expect(rectOf).not.toHaveBeenCalled();
        focus(field('title'));
        expect(rectOf).toHaveBeenCalledTimes(1);
        act(() => current.componentWillUnmount());
        act(() => { window.dispatchEvent(new Event('resize')); });
        rerender();
        expect(panel()).toBeNull();
        expect(rectOf).toHaveBeenCalledTimes(1);
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

describe('word suggestions', () => {
    // Node 25+ ships its own Web Storage, so patch the prototype of the object the widget writes to.
    const storageProto = (): Storage => Object.getPrototypeOf(window.localStorage);
    beforeEach(() => window.localStorage.clear());
    const stored = (): Record<string, { w: string; n: number }> => JSON.parse(window.localStorage.getItem('vis2-materialdesign-keyboard-words') ?? '{}');
    const typeInto = (label: string, text: string): void => {
        focus(field(label));
        act(() => { field(label).value = text; });
        rerender();
    };
    const suggestion = (word: string): HTMLButtonElement => panel()?.querySelector(`[data-suggestion="${word}"]`) as HTMLButtonElement;
    const shown = (): (string | null)[] => Array.from(panel()?.querySelectorAll('[data-suggestion]') ?? []).map(b => b.textContent);
    const seed = (count: number): void => {
        const words: Record<string, unknown> = {};
        for (let i = 0; i < count; i++) words[`wort${String.fromCharCode(97 + i)}`] = { w: `Wort${String.fromCharCode(97 + i)}`, n: 20 - i, t: 1 };
        window.localStorage.setItem('vis2-materialdesign-keyboard-words', JSON.stringify(words));
    };

    it('learns on leaving a text field, into this browser', () => {
        start(keyboard({ keyboardSuggestions: true }));
        typeInto('title', 'Arzt Termin');
        blur(field('title'));
        expect(stored().arzt).toMatchObject({ w: 'Arzt', n: 1 });
        expect(stored().termin).toMatchObject({ w: 'Termin', n: 1 });
    });

    it('learns on Enter with "stay", but never from passwords, number pads or with suggestions off', () => {
        start(keyboard({ keyboardSuggestions: true, keyboardEnter: 'stay' }), <input aria-label="secret" type="password" />);
        typeInto('title', 'Fest');
        tap('enter');
        expect(stored().fest?.n).toBe(1);
        typeInto('secret', 'Geheimwort');
        blur(field('secret'));
        typeInto('place', 'Zahlwort');
        blur(field('place'));
        expect(stored().geheimwort).toBeUndefined();
        expect(stored().zahlwort).toBeUndefined();

        rx().keyboardSuggestions = false;
        typeInto('title', 'Nichts');
        blur(field('title'));
        expect(stored().nichts).toBeUndefined();
    });

    it('writes to the state and keeps two learns before the echo', () => {
        start(keyboard({ keyboardSuggestions: true, keyboardWordsOid: 'x.0.words' }, { 'x.0.words.val': '{"arzt":{"w":"Arzt","n":4,"t":1}}' }));
        typeInto('title', 'Arzt');
        blur(field('title'));
        typeInto('title', 'Kita');
        blur(field('title'));
        const last = JSON.parse(setValue.mock.lastCall?.[1] as string);
        expect(setValue.mock.lastCall?.[0]).toBe('x.0.words');
        expect(last.arzt.n).toBe(5);
        expect(last.kita.n).toBe(1);
        expect(window.localStorage.getItem('vis2-materialdesign-keyboard-words')).toBeNull();
    });

    it('shows the most typed words, filters by the started word and fills in a tap', () => {
        window.localStorage.setItem('vis2-materialdesign-keyboard-words', JSON.stringify({
            arzt: { w: 'Arzt', n: 5, t: 1 }, arbeit: { w: 'Arbeit', n: 2, t: 1 }, müll: { w: 'Müll', n: 9, t: 1 },
        }));
        start(keyboard({ keyboardSuggestions: true, keyboardSuggestionCount: 2 }));
        focus(field('title'));
        expect(shown()).toEqual(['Müll', 'Arzt']);
        tap('a', 'r');
        expect(field('title').value).toBe('Ar');
        expect(suggestion('Arzt')).not.toBeNull();
        act(() => { suggestion('Arzt').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
        act(() => { suggestion('Arzt').dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); });
        rerender();
        expect(field('title').value).toBe('Arzt ');
    });

    it('removes a word on a long press without filling it in', () => {
        vi.useFakeTimers();
        window.localStorage.setItem('vis2-materialdesign-keyboard-words', JSON.stringify({ tippfehler: { w: 'Tippfehler', n: 1, t: 1 } }));
        start(keyboard({ keyboardSuggestions: true }));
        focus(field('title'));
        act(() => { suggestion('Tippfehler').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
        act(() => { vi.advanceTimersByTime(600); });
        act(() => { suggestion('Tippfehler')?.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); });
        rerender();
        expect(stored().tippfehler).toBeUndefined();
        expect(field('title').value).toBe('');
        expect(suggestion('Tippfehler')).toBeNull();
    });

    it('shows no bar on the number pad and none when switched off', () => {
        start(keyboard({ keyboardSuggestions: true }));
        focus(field('amount'));
        expect(panel()?.querySelector('[data-suggestions]')).toBeNull();
        focus(field('title'));
        expect(panel()?.querySelector('[data-suggestions]')).not.toBeNull();
        blur(field('title'));
        rx().keyboardSuggestions = false;
        focus(field('title'));
        expect(panel()?.querySelector('[data-suggestions]')).toBeNull();
    });

    it('survives a storage that throws', () => {
        const spy = vi.spyOn(storageProto(), 'getItem').mockImplementation(() => { throw new Error('blocked'); });
        start(keyboard({ keyboardSuggestions: true }));
        focus(field('title'));
        expect(panel()).not.toBeNull();
        spy.mockRestore();
    });

    it('still closes and learns nothing when writing the storage throws', () => {
        const spy = vi.spyOn(storageProto(), 'setItem').mockImplementation(() => { throw new Error('full'); });
        start(keyboard({ keyboardSuggestions: true }));
        typeInto('title', 'Arzt');
        expect(() => blur(field('title'))).not.toThrow();
        expect(panel()).toBeNull();
        spy.mockRestore();
        expect(stored().arzt).toBeUndefined();
    });

    it('gives no suggestions and no error for a state that is not a word list', () => {
        for (const value of ['not json', null, undefined, 42, '[1,2]', '{"a":1}']) {
            start(keyboard({ keyboardSuggestions: true, keyboardWordsOid: 'x.0.words' }, { 'x.0.words.val': value }));
            focus(field('title'));
            expect(panel()).not.toBeNull();
            expect(shown()).toEqual([]);
            blur(field('title'));
            act(() => current.componentWillUnmount());
        }
    });

    it('keeps the count between 1 and 10 and falls back to 3', () => {
        seed(12);
        start(keyboard({ keyboardSuggestions: true, keyboardSuggestionCount: 0 }));
        focus(field('title'));
        expect(shown()).toHaveLength(1);
        blur(field('title'));
        for (const [count, expected] of [[50, 10], ['abc', 3], [undefined, 3], [4, 4]] as const) {
            rx().keyboardSuggestionCount = count;
            focus(field('title'));
            expect(shown()).toHaveLength(expected);
            blur(field('title'));
        }
    });

    it('does not forget a word when the press is cancelled before 600 ms, and not after unmount', () => {
        vi.useFakeTimers();
        seed(1);
        start(keyboard({ keyboardSuggestions: true }));
        focus(field('title'));
        act(() => { suggestion('Worta').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
        act(() => { vi.advanceTimersByTime(599); });
        act(() => { suggestion('Worta').dispatchEvent(new MouseEvent('pointercancel', { bubbles: true })); });
        act(() => { vi.advanceTimersByTime(2000); });
        expect(stored().worta).toBeDefined();

        act(() => { suggestion('Worta').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
        act(() => current.componentWillUnmount());
        act(() => { vi.advanceTimersByTime(2000); });
        expect(stored().worta).toBeDefined();
    });
});

describe('click-through', () => {
    it('lets taps through the invisible rectangle at runtime, not in the editor, and gives the wrapper back', () => {
        start(keyboard());
        expect(placeholder().style.pointerEvents).toBe('none');
        expect(view().style.pointerEvents).toBe('none');
        const wrapper = view();
        act(() => root.unmount());
        expect(wrapper.style.pointerEvents).toBe('');
        root = createRoot(container);
        start(keyboard({}, {}, true));
        expect(placeholder().style.pointerEvents).toBe('');
        expect(view().style.pointerEvents).toBe('');
    });
});

describe('room only where the keyboard is', () => {
    it('does not push up a field below a keyboard at the top of the view', () => {
        start(keyboard({ keyboardShowMode: 'pan', keyboardPosition: 'viewTop' }));
        box(placeholder(), 0, 0, 600, 200);
        box(view(), 0, 0, 800, 700);
        box(field('title'), 0, 400, 200, 30);
        focus(field('title'));
        expect(view().style.transform).toBe('');
    });

    it('does not pad or scroll for a field below a keyboard at the top of the view', () => {
        let scrolled = 0;
        const scroller = <div data-testid="scroller" style={{ overflowY: 'scroll' }}><input aria-label="inner" /></div>;
        start(keyboard({ keyboardShowMode: 'pad', keyboardPosition: 'viewTop' }), scroller);
        const el = container.querySelector('[data-testid="scroller"]') as HTMLElement;
        Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => scrolled, set: (v: number) => { scrolled = v; } });
        box(placeholder(), 0, 0, 600, 200);
        box(view(), 0, 0, 800, 700);
        box(field('inner'), 0, 400, 200, 30);
        focus(field('inner'));
        expect(el.style.paddingBottom).toBe('');
        expect(scrolled).toBe(0);
    });

    it('does not push a field under a keyboard at the top of the view off the screen', () => {
        start(keyboard({ keyboardShowMode: 'pan', keyboardPosition: 'viewTop' }));
        box(placeholder(), 0, 0, 600, 200);
        box(view(), 0, 0, 800, 700);
        box(field('title'), 0, 100, 200, 30);
        focus(field('title'));
        expect(view().style.transform).toBe('');
    });

    it('does not move a field that is entirely above a keyboard at the bottom', () => {
        start(keyboard({ keyboardShowMode: 'pan' }));
        box(placeholder(), 0, 400, 600, 200);
        box(field('title'), 0, 300, 200, 30);
        focus(field('title'));
        expect(view().style.transform).toBe('');
    });
});

describe('a field focused before the keyboard started', () => {
    it('gets the keyboard and the system keyboard stays closed for it', () => {
        const w = keyboard();
        mount(w);
        act(() => field('title').focus());
        act(() => w.componentDidMount());
        rerender();
        expect(panel()).not.toBeNull();
        expect(field('title').getAttribute('inputmode')).toBe('none');
    });

    it('ignores a focused field it does not serve', () => {
        const w = keyboard();
        mount(w);
        act(() => field('check').focus());
        act(() => w.componentDidMount());
        rerender();
        expect(panel()).toBeNull();
    });
});

describe('editMode switch', () => {
    it('detaches when the widget goes into the editor', () => {
        start(keyboard());
        expect(field('title').getAttribute('inputmode')).toBe('none');
        const remove = vi.spyOn(document, 'removeEventListener');
        fixture<{ props: unknown }>(current).props = { ...props, editMode: true };
        act(() => current.componentDidUpdate(fixture<typeof current.props>(props), current.state));
        expect(field('title').hasAttribute('inputmode')).toBe(false);
        expect(remove).toHaveBeenCalledWith('focusin', expect.anything(), true);
        remove.mockRestore();
    });
});

describe('number fields are served as text', () => {
    const own = (): HTMLInputElement => document.querySelector('[aria-label="own"]') as HTMLInputElement;
    const ownField = <input aria-label="own" readOnly type="number" />;

    it('switches a served number field to text with a mark, keeps inputmode none, no readonly', () => {
        start(keyboard());
        expect(field('amount').type).toBe('text');
        expect(field('amount').getAttribute('data-mdkb-type')).toBe('number');
        expect(field('amount').getAttribute('inputmode')).toBe('none');
        expect(field('amount').readOnly).toBe(false);
        expect(field('amount').hasAttribute('data-mdkb-readonly')).toBe(false);
        expect(field('title').type).toBe('text');
        expect(field('title').hasAttribute('data-mdkb-type')).toBe(false);
        expect(isServable(field('amount'))).toBe(true);
    });

    it('still shows the number pad, learns nothing and writes a dot with the German key map', () => {
        window.localStorage.clear();
        start(keyboard({ keyboardSuggestions: true, keyboardLanguage: 'de' }));
        focus(field('amount'));
        expect(key('q')).toBeNull();
        tap('decimal');
        expect(field('amount').value).toBe('.');
        expect(key('decimal').textContent).toBe('.');
        tap('1');
        blur(field('amount'));
        expect(window.localStorage.getItem('vis2-materialdesign-keyboard-words')).toBeNull();
    });

    it('types into a real Input widget of type number and commits it', () => {
        const inputProps = { id: 'w4', context: { setValue } };
        const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>(inputProps));
        fixture<{ state: unknown }>(input).state = { rxData: { oid: 'x.0.num', inputType: 'number' }, values: {} };
        start(keyboard(), () => <div id="w4">{input.renderWidgetBody(fixture<Parameters<MaterialDesignInput['renderWidgetBody']>[0]>(inputProps))}</div>);
        const el = document.querySelector('#w4 input') as HTMLInputElement;
        expect(el.type).toBe('text');
        focus(el);
        tap('1', 'decimal', '5');
        expect(el.value).toBe('1.5');
        tap('enter');
        expect(setValue.mock.lastCall?.[0]).toBe('x.0.num');
        expect(setValue.mock.lastCall?.[1]).toBe(1.5);
    });

    it('writes nothing for a lone minus', () => {
        const inputProps = { id: 'w4', context: { setValue } };
        const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>(inputProps));
        fixture<{ state: unknown }>(input).state = { rxData: { oid: 'x.0.num', inputType: 'number' }, values: {} };
        start(keyboard(), () => <div id="w4">{input.renderWidgetBody(fixture<Parameters<MaterialDesignInput['renderWidgetBody']>[0]>(inputProps))}</div>);
        const el = document.querySelector('#w4 input') as HTMLInputElement;
        focus(el);
        tap('-', 'enter');
        expect(setValue).not.toHaveBeenCalled();
    });

    it('restores type and removes the mark on unmount and on the switch to the editor', () => {
        start(keyboard());
        act(() => current.componentWillUnmount());
        expect(field('amount').type).toBe('number');
        expect(field('amount').hasAttribute('data-mdkb-type')).toBe(false);

        act(() => root.unmount());
        root = createRoot(container);
        start(keyboard());
        expect(field('amount').type).toBe('text');
        fixture<{ props: unknown }>(current).props = { ...props, editMode: true };
        act(() => current.componentDidUpdate(fixture<typeof current.props>(props), current.state));
        expect(field('amount').type).toBe('number');
        expect(field('amount').hasAttribute('data-mdkb-type')).toBe(false);
    });

    it('does not serve or touch a number field the page made read-only', () => {
        start(keyboard(), ownField);
        expect(isServable(own())).toBe(false);
        expect(own().type).toBe('number');
        expect(own().hasAttribute('data-mdkb-type')).toBe(false);
        focus(own());
        expect(panel()).toBeNull();
        act(() => current.componentWillUnmount());
        expect(own().type).toBe('number');
        expect(own().readOnly).toBe(true);
    });

    it('also takes a number field that appears later', async () => {
        start(keyboard());
        mount(current, <input aria-label="late" type="number" />);
        await act(async () => { await Promise.resolve(); });
        expect(field('late').type).toBe('text');
        expect(field('late').getAttribute('data-mdkb-type')).toBe('number');
    });

    describe('under React 19, which assigns type on every update', () => {
        const ownType = (el: HTMLElement): PropertyDescriptor | undefined => Object.getOwnPropertyDescriptor(el, 'type');

        it('keeps a served number field as text when type is assigned again', () => {
            start(keyboard());
            field('amount').type = 'number';
            expect(field('amount').type).toBe('text');
            expect(field('amount').getAttribute('type')).toBe('text');
            focus(field('amount'));
            tap('1', 'decimal');
            expect(field('amount').value).toBe('1.');
            field('amount').type = 'number';
            expect(field('amount').value).toBe('1.');
            expect(isServable(field('amount'))).toBe(true);
        });

        it('removes the guard on unmount and on the switch to the editor', () => {
            start(keyboard());
            expect(ownType(field('amount'))).toBeDefined();
            act(() => current.componentWillUnmount());
            expect(ownType(field('amount'))).toBeUndefined();
            expect(field('amount').type).toBe('number');
            field('amount').type = 'text';
            expect(field('amount').type).toBe('text');

            act(() => root.unmount());
            root = createRoot(container);
            start(keyboard());
            fixture<{ props: unknown }>(current).props = { ...props, editMode: true };
            act(() => current.componentDidUpdate(fixture<typeof current.props>(props), current.state));
            expect(ownType(field('amount'))).toBeUndefined();
            expect(field('amount').type).toBe('number');
            field('amount').type = 'text';
            expect(field('amount').type).toBe('text');
        });

        it('guards a number field that appears later and leaves text fields alone', async () => {
            start(keyboard());
            mount(current, <input aria-label="late" type="number" />);
            await act(async () => { await Promise.resolve(); });
            field('late').type = 'number';
            expect(field('late').type).toBe('text');
            expect(ownType(field('title'))).toBeUndefined();
        });
    });
});

describe('typing limits and keys', () => {
    const area = (): HTMLTextAreaElement => document.querySelector('[aria-label="notes"]') as HTMLTextAreaElement;

    it('drops a character beyond maxLength but still replaces a selection and deletes at the limit', () => {
        start(keyboard({ keyboardAutoCapitalize: false }));
        field('title').maxLength = 3;
        focus(field('title'));
        tap('a', 'b', 'c', 'd');
        expect(field('title').value).toBe('abc');
        act(() => field('title').setSelectionRange(0, 1));
        tap('x');
        expect(field('title').value).toBe('xbc');
        act(() => field('title').setSelectionRange(3, 3));
        tap('backspace');
        expect(field('title').value).toBe('xb');
        tap('y', 'z');
        expect(field('title').value).toBe('xby');
    });

    it('applies maxLength to a textarea and a limit of 0 blocks everything', () => {
        start(keyboard({ keyboardAutoCapitalize: false }), () => <textarea aria-label="notes" maxLength={2} />);
        focus(area());
        tap('a', 'b', 'c');
        expect(area().value).toBe('ab');
        field('title').maxLength = 0;
        focus(field('title'));
        tap('a');
        expect(field('title').value).toBe('');
    });

    it('is unlimited without maxLength', () => {
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c', 'd', 'e', 'f');
        expect(field('title').value).toBe('abcdef');
    });

    it('keeps ß instead of typing and showing SS when shifted', () => {
        start(keyboard());
        focus(field('title'));
        expect(key('a').textContent).toBe('A');
        expect(key('ß').textContent).toBe('ß');
        tap('ß');
        expect(field('title').value).toBe('ß');
    });

    it('closes when "next" lands on a field that cannot take the focus', () => {
        start(keyboard({ keyboardEnter: 'next', keyboardFields: 'w1 w2' }));
        field('place').focus = () => {};
        focus(field('title'));
        tap('enter');
        expect(document.activeElement).toBe(document.body);
        expect(panel()).toBeNull();
    });
});

describe('learning only what was typed', () => {
    beforeEach(() => window.localStorage.clear());
    const stored = (): Record<string, { w: string; n: number }> => JSON.parse(window.localStorage.getItem('vis2-materialdesign-keyboard-words') ?? '{}');
    const typeInto = (label: string, text: string): void => {
        focus(field(label));
        act(() => { field(label).value = text; });
        rerender();
    };

    it('counts a word once for Enter and the blur that follows it', () => {
        for (const mode of ['close', 'stay']) {
            window.localStorage.clear();
            start(keyboard({ keyboardSuggestions: true, keyboardEnter: mode }));
            typeInto('title', 'Arzt');
            tap('enter');
            if (mode === 'stay') blur(field('title'));
            expect(stored().arzt?.n).toBe(1);
            act(() => current.componentWillUnmount());
            field('title').value = '';
        }
    });

    it('learns nothing from a prefilled field that was left unchanged', () => {
        start(keyboard({ keyboardSuggestions: true }));
        field('title').value = 'Alt';
        focus(field('title'));
        blur(field('title'));
        expect(stored().alt).toBeUndefined();
    });

    it('learns a prefilled field once when it was edited', () => {
        start(keyboard({ keyboardSuggestions: true }));
        field('title').value = 'Alt';
        typeInto('title', 'Alt Neu');
        blur(field('title'));
        expect(stored().alt?.n).toBe(1);
        expect(stored().neu?.n).toBe(1);
    });

    it('does not fill in a suggestion beyond maxLength', () => {
        window.localStorage.setItem('vis2-materialdesign-keyboard-words', JSON.stringify({ arzt: { w: 'Arzt', n: 5, t: 1 } }));
        start(keyboard({ keyboardSuggestions: true }));
        field('title').maxLength = 3;
        focus(field('title'));
        act(() => { field('title').value = 'Ar'; });
        rerender();
        const word = panel()?.querySelector('[data-suggestion="Arzt"]') as HTMLButtonElement;
        act(() => { word.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })); });
        act(() => { word.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); });
        rerender();
        expect(field('title').value).toBe('Ar');
    });
});

describe('icons on the special keys', () => {
    it('shows an icon and keeps the label on shift, backspace, enter and close', () => {
        start(keyboard());
        focus(field('title'));
        for (const [name, icon, label] of [['shift', 'apple-keyboard-shift', 'ariaKeyShift'], ['backspace', 'backspace-outline', 'ariaKeyBackspace'], ['enter', 'keyboard-return', 'ariaKeyEnter'], ['close', 'keyboard-close', 'ariaKeyClose']]) {
            expect(key(name).querySelector(`.mdi-${icon}`)).not.toBeNull();
            expect(key(name).querySelector(`[aria-hidden="true"] .mdi-${icon}`)).not.toBeNull();
            expect(key(name).getAttribute('aria-label')).toBe(label);
            expect(key(name).textContent).toBe('');
        }
    });

    it('shows the caps icon while shift is locked and keeps text on the other special keys', () => {
        start(keyboard({ keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('shift', 'shift');
        expect(key('shift').querySelector('.mdi-apple-keyboard-caps')).not.toBeNull();
        expect(key('shift').querySelector('.mdi-apple-keyboard-shift')).toBeNull();
        tap('symbols');
        expect(key('letters').textContent).toBe('ABC');
        tap('letters');
        expect(key('symbols').textContent).toBe('?123');
        focus(field('amount'));
        expect(key('decimal').textContent).toBe('.');
    });
});

describe('arrow keys', () => {
    const arrows = ['left', 'up', 'down', 'right'];

    it('are absent by default and present with the option, on the letters and on the number pad', () => {
        start(keyboard());
        focus(field('title'));
        for (const name of arrows) expect(key(name)).toBeNull();
        focus(field('amount'));
        for (const name of arrows) expect(key(name)).toBeNull();
        blur(field('amount'));
        rx().keyboardArrows = true;
        focus(field('title'));
        for (const [name, icon, label] of [['left', 'arrow-left', 'ariaKeyLeft'], ['up', 'arrow-up', 'ariaKeyUp'], ['down', 'arrow-down', 'ariaKeyDown'], ['right', 'arrow-right', 'ariaKeyRight']]) {
            expect(key(name).querySelector(`.mdi-${icon}`)).not.toBeNull();
            expect(key(name).querySelector(`[aria-hidden="true"] .mdi-${icon}`)).not.toBeNull();
            expect(key(name).getAttribute('aria-label')).toBe(label);
        }
        focus(field('amount'));
        for (const name of arrows) expect(key(name)).not.toBeNull();
        expect(panel()?.querySelectorAll('button')).toHaveLength(19);
    });

    it('move the caret left and right without changing the value', () => {
        start(keyboard({ keyboardArrows: true, keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c');
        tap('left', 'left');
        expect(field('title').selectionStart).toBe(1);
        tap('x');
        expect(field('title').value).toBe('axbc');
        tap('right', 'right', 'right', 'right');
        expect(field('title').selectionStart).toBe(4);
        expect(field('title').value).toBe('axbc');
        expect(setValue).not.toHaveBeenCalled();
    });

    it('send a keydown first and leave the caret alone when it is handled', () => {
        start(keyboard({ keyboardArrows: true, keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b');
        const seen: string[] = [];
        const handler = (event: KeyboardEvent): void => { seen.push(event.key); event.preventDefault(); };
        field('title').onkeydown = handler;
        tap('left', 'up');
        field('title').onkeydown = null;
        expect(seen).toEqual(['ArrowLeft', 'ArrowUp']);
        expect(field('title').selectionStart).toBe(2);
    });

    it('go to the start and the end of a plain field with up and down', () => {
        start(keyboard({ keyboardArrows: true, keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c', 'up');
        expect(field('title').selectionStart).toBe(0);
        tap('down');
        expect(field('title').selectionStart).toBe(3);
        expect(field('title').value).toBe('abc');
    });

    it('do nothing in a field without selection API and never learn', () => {
        window.localStorage.clear();
        start(keyboard({ keyboardArrows: true, keyboardSuggestions: true }), <input aria-label="mail" type="email" />);
        focus(field('mail'));
        tap('a');
        expect(() => tap('left', 'up', 'down', 'right')).not.toThrow();
        expect(field('mail').value).toBe('A');
        expect(window.localStorage.getItem('vis2-materialdesign-keyboard-words')).toBeNull();
        field('mail').value = '';
    });

    it('repeat while held', () => {
        vi.useFakeTimers();
        start(keyboard({ keyboardArrows: true, keyboardAutoCapitalize: false }));
        focus(field('title'));
        tap('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
        press('left');
        act(() => { vi.advanceTimersByTime(499); });
        expect(field('title').selectionStart).toBe(7);
        act(() => { vi.advanceTimersByTime(101); });
        expect(field('title').selectionStart).toBe(5);
        release('left');
        act(() => { vi.advanceTimersByTime(500); });
        expect(field('title').selectionStart).toBe(5);
        expect(field('title').value).toBe('abcdefgh');
    });

    it('move through a real Autocomplete list and Enter picks the highlighted item', () => {
        const id = 'w5';
        const autoProps = { id, context: { setValue } };
        const auto = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>(autoProps));
        fixture<{ state: unknown }>(auto).state = { rxData: { oid: 'x.0.room', inputMode: 'write', listDataMethod: 'valueList', valueList: '1;2;3', valueListLabels: 'Wohnzimmer;Kueche;Bad' }, values: {} };
        start(keyboard({ keyboardArrows: true, keyboardEnter: 'stay' }), () => <div id={id}>{auto.renderWidgetBody(fixture<Parameters<MaterialDesignAutocomplete['renderWidgetBody']>[0]>(autoProps))}</div>);
        const el = document.querySelector(`#${id} input`) as HTMLInputElement;
        focus(el);
        tap('down', 'down');
        expect(el.getAttribute('aria-activedescendant')).toBe(`${id}-option-1`);
        tap('up');
        expect(el.getAttribute('aria-activedescendant')).toBe(`${id}-option-0`);
        tap('down', 'enter');
        expect(setValue).toHaveBeenLastCalledWith('x.0.room', '2');
    });
});
