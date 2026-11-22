import React from 'react';
import { createPortal } from 'react-dom';

import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { clampTo, keyLook, type KeyLook as Look } from './keyLook';
import { applyKey, autoShift, chooseLayout, currentWord, decimalChar, forget, keyMapFor, learn, moveCaret, numberRows, panOffset, parseWords, replaceWord, suggest, suggestionOrder, textRows, wordsIn, type EditResult, type KeyDef, type KeyMap, type Layout, type Special, type Words } from './keyboard';
import { createInfo, designStyle, designStyleClasses, ownCssVariables, passWrapperClicks, setStateValue, squarePreview, stateValue, visLocale, VisWidget, boolValue as b, numberValue as n, textValue as s, type RenderProps } from './widgetUtils';

export type Field = HTMLInputElement | HTMLTextAreaElement;
type Shift = 'off' | 'once' | 'lock';
interface Rect { left: number; top: number; width: number; height: number }
interface KeyInfo {
    aria: string;
    icon?: string;
    label?: string;
    flex?: number;
    /** The keydown name, and where the caret goes when nobody handles it. */
    arrow?: { key: string; move: 'left' | 'right' | 'start' | 'end' };
    /** Painted in the key color, not the special key color. */
    charLook?: true;
}

export const WORDS_KEY = 'vis2-materialdesign-keyboard-words';
/** `data-mdkb-inputmode` holds the page's own inputmode while the widget has set `none`. */
const MARK = 'mdkbInputmode';
/** `data-mdkb-type` holds the type of a number field while the widget serves it as `text`. */
const TYPE_MARK = 'mdkbType';
const SKIP_TYPES = new Set(['hidden', 'checkbox', 'radio', 'range', 'file', 'color', 'date', 'time', 'datetime-local', 'month', 'week', 'button', 'submit', 'reset', 'image']);
const KEYS: Record<Special, KeyInfo> = {
    shift: { aria: 'ariaKeyShift', icon: 'apple-keyboard-shift', flex: 1.5 },
    backspace: { aria: 'ariaKeyBackspace', icon: 'backspace-outline', flex: 1.5 },
    enter: { aria: 'ariaKeyEnter', icon: 'keyboard-return', flex: 1.5 },
    close: { aria: 'ariaKeyClose', icon: 'keyboard-close' },
    symbols: { aria: 'ariaKeySymbols', label: '?123', flex: 1.5 },
    letters: { aria: 'ariaKeyLetters', label: 'ABC', flex: 1.5 },
    space: { aria: 'ariaKeySpace', flex: 4, charLook: true },
    decimal: { aria: 'ariaKeyDecimal', charLook: true },
    left: { aria: 'ariaKeyLeft', icon: 'arrow-left', arrow: { key: 'ArrowLeft', move: 'left' } },
    right: { aria: 'ariaKeyRight', icon: 'arrow-right', arrow: { key: 'ArrowRight', move: 'right' } },
    up: { aria: 'ariaKeyUp', icon: 'arrow-up', arrow: { key: 'ArrowUp', move: 'start' } },
    down: { aria: 'ariaKeyDown', icon: 'arrow-down', arrow: { key: 'ArrowDown', move: 'end' } },
};

export function isServable(el: unknown): el is Field {
    if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
    if (!(el instanceof HTMLInputElement)) return false;
    return !SKIP_TYPES.has(el.type.toLowerCase()) && !el.readOnly && !el.disabled;
}

export function originalInputMode(el: Field): string {
    return el.dataset[MARK] ?? el.getAttribute('inputmode') ?? '';
}

export function originalType(el: Field): string {
    return el.dataset[TYPE_MARK] ?? (el instanceof HTMLInputElement ? el.type : 'text');
}

// Trap: React 19 re-sets `type` on every update of a controlled input, which would turn the field
// back into a number field. The own property swallows that until `restore` deletes it.
export function serveAsText(el: HTMLInputElement): void {
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'type');
    native?.set?.call(el, 'text');
    Object.defineProperty(el, 'type', { configurable: true, get: () => native?.get?.call(el) as string, set: () => undefined });
}

export function scrollParent(el: Element): HTMLElement {
    for (let node = el.parentElement; node; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
    }
    return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

type Input = 'touch' | 'pen' | 'mouse' | 'keyboard' | null;
let lastInput: Input = null;
let trackers = 0;

export function noteInput(type: Input): void {
    lastInput = type;
}

const isTouch = (event: Event): boolean => {
    const type = (event as Partial<PointerEvent>).pointerType;
    return type === 'touch' || type === 'pen';
};

// Trap: the widget dispatches synthetic keydowns (Enter, arrows) that must not count as keyboard
// use, hence the isTrusted check.
const notePointer = (event: PointerEvent): void => {
    if (event.isTrusted) noteInput(isTouch(event) ? (event.pointerType as Input) : 'mouse');
};
const noteKey = (event: KeyboardEvent): void => {
    if (event.isTrusted) noteInput('keyboard');
};

/** One pair of document listeners for all keyboards; the last one to stop removes them. */
function trackInput(on: boolean): void {
    trackers = Math.max(0, trackers + (on ? 1 : -1));
    if (on && trackers === 1) {
        document.addEventListener('pointerdown', notePointer, true);
        document.addEventListener('keydown', noteKey, true);
    } else if (!on && trackers === 0) {
        document.removeEventListener('pointerdown', notePointer, true);
        document.removeEventListener('keydown', noteKey, true);
    }
}

function touchInput(): boolean {
    if (lastInput) return lastInput === 'touch' || lastInput === 'pen';
    try {
        return !!window.matchMedia?.('(pointer: coarse)').matches;
    } catch {
        return false;
    }
}

const KEYFRAMES = '@keyframes mdkb-slide-up{from{transform:translateY(100%)}}@keyframes mdkb-slide-down{from{transform:translateY(-100%)}}@keyframes mdkb-fade{from{opacity:0}}';

/** `ß` would become `SS`; a key keeps its character when upper case changes the length. */
const upper = (text: string): string => {
    const result = text.toUpperCase();
    return result.length === text.length ? result : text;
};

const opt = (name: string, values: string[]): { value: string; label: string }[] => values.map(value => ({ value, label: `${name}_${value}` }));

const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            { name: 'keyboardFields', label: 'keyboardFields', type: 'text', default: '' },
            { name: 'keyboardLayout', label: 'keyboardLayout', type: 'select', options: opt('keyboardLayout', ['auto', 'text', 'number']), default: 'auto' },
            { name: 'keyboardLanguage', label: 'keyboardLanguage', type: 'select', options: opt('keyboardLanguage', ['auto', 'de', 'en']), default: 'auto' },
            { name: 'keyboardAutoCapitalize', label: 'keyboardAutoCapitalize', type: 'checkbox', default: true },
            { name: 'keyboardEnter', label: 'keyboardEnter', type: 'select', options: opt('keyboardEnter', ['close', 'next', 'stay']), default: 'close' },
            { name: 'keyboardArrows', label: 'keyboardArrows', type: 'checkbox', default: false },
            { name: 'keyboardShowOn', label: 'keyboardShowOn', type: 'select', options: opt('keyboardShowOn', ['touch', 'always']), default: 'touch' },
        ],
    },
    {
        name: 'keyboardPlacement',
        label: 'group_keyboardPlacement',
        fields: [
            { name: 'keyboardPosition', label: 'keyboardPosition', type: 'select', options: opt('keyboardPosition', ['editor', 'viewBottom', 'viewTop', 'screenBottom']), default: 'editor' },
            { name: 'keyboardShowMode', label: 'keyboardShowMode', type: 'select', options: opt('keyboardShowMode', ['overlay', 'pan', 'pad']), default: 'overlay' },
            { name: 'keyboardAnimation', label: 'keyboardAnimation', type: 'select', options: opt('keyboardAnimation', ['none', 'slide', 'fade']), default: 'slide' },
            { name: 'keyboardAnimationMs', label: 'keyboardAnimationMs', type: 'number', default: 150, min: 0, max: 2000 },
        ],
    },
    {
        name: 'keyboardWords',
        label: 'group_keyboardWords',
        fields: [
            { name: 'keyboardSuggestions', label: 'keyboardSuggestions', type: 'checkbox', default: true },
            { name: 'keyboardSuggestionCount', label: 'keyboardSuggestionCount', type: 'number', default: 3, min: 1, max: 10 },
            { name: 'keyboardSuggestionOrder', label: 'keyboardSuggestionOrder', type: 'select', options: opt('keyboardSuggestionOrder', ['frecency', 'frequent', 'recent']), default: 'frecency' },
            { name: 'keyboardWordsOid', label: 'keyboardWordsOid', type: 'id' },
        ],
    },
    {
        name: 'keyboardLook',
        label: 'group_keyboardLook',
        fields: [
            ...['keyboardBackground', 'keyboardKeyColor', 'keyboardKeyTextColor', 'keyboardSpecialKeyColor'].map(name => ({ name, label: name, type: 'color' as const })),
            { name: 'keyboardFontSize', label: 'keyboardFontSize', type: 'number', default: 18, min: 8, max: 64 },
            { name: 'keyboardKeyGap', label: 'keyboardKeyGap', type: 'number', default: 6, min: 0, max: 32 },
            { name: 'keyboardKeyRadius', label: 'keyboardKeyRadius', type: 'number', default: 8, min: 0, max: 64 },
        ],
    },
];

const running = new Set<MaterialDesignKeyboard>();

export default class MaterialDesignKeyboard extends VisWidget {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Keyboard', 'On-screen Keyboard', attrs, ['keyboardLook']),
            visPrev: squarePreview('F030C'),
            visDefaultStyle: { width: 640, height: 280 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignKeyboard.getWidgetInfo();
    }

    private placeholder: HTMLDivElement | null = null;
    private wrapper: HTMLElement | null = null;
    /** The value the target had when it got the focus, or when its words were last learned. */
    private known: { el: Field; value: string } | null = null;
    private target: Field | null = null;
    private scope: Element | null = null;
    private rect: Rect | null = null;
    private observer: MutationObserver | null = null;
    private listening = false;
    /** The fields carry `inputmode="none"`; with `touch` only from the first touch or pen input on. */
    private serving = false;
    private symbols = false;
    private shift: Shift = 'off';
    private lastShiftTap = 0;
    private pressed: string | null = null;
    private repeatTimer: number | undefined;
    // Known limit: while a field without selection API has the focus, a value written into it from
    // outside is not seen until the focus moves to another field.
    // Known limit: a field without selection API (`type="email"`) reports `''` for text it cannot
    // parse, so the typed text is kept here instead.
    private draft: { el: Field; text: string } | null = null;
    private panned: { el: HTMLElement; transform: string; transition: string; offset: number } | null = null;
    private padded: { el: HTMLElement; paddingBottom: string } | null = null;
    private wordsCache: Words = {};
    private wordsSeen: unknown = Symbol('unread');
    private suggestionTimer: number | undefined;
    private suggestionForgotten = false;

    private data(): Record<string, unknown> {
        return this.state.rxData as unknown as Record<string, unknown>;
    }

    private fieldIds(): string[] {
        return s(this.data().keyboardFields).split(/[\s,;]+/).filter(Boolean);
    }

    // Ignores keyboards in nested views: decide with serves(), never with claims() alone.
    private claims(el: unknown): el is Field {
        if (!isServable(el) || !this.scope?.contains(el)) return false;
        const ids = this.fieldIds();
        return !ids.length || ids.some(id => document.getElementById(id)?.contains(el));
    }

    private serves(el: unknown): el is Field {
        if (!this.claims(el)) return false;
        // The innermost keyboard wins, or a field in a Dialog View would open two keyboards.
        for (const other of running) {
            if (other !== this && other.scope && other.scope !== this.scope && this.scope!.contains(other.scope) && other.claims(el)) return false;
        }
        return true;
    }

    private servedFields(): Field[] {
        return this.scope ? Array.from(this.scope.querySelectorAll('input, textarea')).filter((el): el is Field => this.serves(el)) : [];
    }

    private startServing(): void {
        this.serving = true;
        this.suppress();
    }

    private readonly suppress = (): void => {
        if (!this.serving) return;
        for (const el of this.servedFields()) {
            if (el.dataset[MARK] !== undefined) continue;
            el.dataset[MARK] = el.getAttribute('inputmode') ?? '';
            el.setAttribute('inputmode', 'none');
            // The Fire OS / Chromium WebView ignores inputmode="none" on type="number" but honours it on
            // text. A remounted element is caught by the MutationObserver.
            if (el instanceof HTMLInputElement && el.type === 'number') {
                el.dataset[TYPE_MARK] = 'number';
                serveAsText(el);
            }
        }
    };

    private restore(): void {
        this.scope?.querySelectorAll<HTMLElement>('[data-mdkb-inputmode]').forEach(el => {
            const original = el.dataset[MARK] ?? '';
            if (original) el.setAttribute('inputmode', original);
            else el.removeAttribute('inputmode');
            delete el.dataset[MARK];
            if (el.dataset[TYPE_MARK] !== undefined) {
                // Own property first, or the assignment below would be swallowed.
                Reflect.deleteProperty(el, 'type');
                (el as HTMLInputElement).type = el.dataset[TYPE_MARK];
                delete el.dataset[TYPE_MARK];
            }
        });
    }

    private attach(): void {
        if (this.props.editMode || this.listening || typeof document === 'undefined') return;
        this.listening = true;
        trackInput(true);
        this.scope = this.placeholder?.closest('[id^="visview_"]') ?? document.body;
        running.add(this);
        if (s(this.data().keyboardShowOn, 'touch') !== 'touch' || touchInput()) this.startServing();
        this.observer = new MutationObserver(this.suppress);
        this.observer.observe(this.scope, { childList: true, subtree: true });
        // Capture runs before the browser moves the focus, so `inputmode` is set in time.
        document.addEventListener('pointerdown', this.onPointerDown, true);
        document.addEventListener('focusin', this.onFocusIn, true);
        document.addEventListener('focusout', this.onFocusOut, true);
        window.addEventListener('resize', this.onWindowResize);
        if (this.serves(document.activeElement)) this.focusOn(document.activeElement);
    }

    private detach(): void {
        this.stopSwallow();
        if (!this.listening) return;
        this.listening = false;
        running.delete(this);
        trackInput(false);
        this.observer?.disconnect();
        this.observer = null;
        document.removeEventListener('pointerdown', this.onPointerDown, true);
        document.removeEventListener('focusin', this.onFocusIn, true);
        document.removeEventListener('focusout', this.onFocusOut, true);
        window.removeEventListener('resize', this.onWindowResize);
        this.hide();
        this.restore();
        this.serving = false;
        this.scope = null;
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.attach();
    }

    componentDidUpdate(prevProps: typeof this.props, prevState: typeof this.state): void {
        super.componentDidUpdate(prevProps, prevState);
        if (this.props.editMode) this.detach();
        else this.attach();
    }

    componentWillUnmount(): void {
        this.detach();
        super.componentWillUnmount();
    }

    private readonly onFocusIn = (event: FocusEvent): void => {
        if (this.serves(event.target)) this.focusOn(event.target);
    };

    /** A tap into a field that already has the focus fires no focusin, so it opens the keyboard here. */
    private readonly onPointerDown = (event: PointerEvent): void => {
        if (!isTouch(event)) return;
        if (!this.serving) this.startServing();
        const el = event.target;
        if (!this.target && this.serves(el) && el === document.activeElement) this.focusOn(el, true);
    };

    private focusOn(el: Field, touched = touchInput()): void {
        const wasHidden = !this.target;
        // Checked only while closed: a mouse click into another served field keeps an open keyboard.
        if (wasHidden && s(this.data().keyboardShowOn, 'touch') === 'touch' && !touched) return;
        if (this.draft?.el !== el) this.draft = null;
        if (this.target !== el) this.known = { el, value: this.currentValue(el) };
        this.target = el;
        this.symbols = false;
        this.refreshShift();
        if (wasHidden) this.rect = this.measure();
        this.makeRoom();
        this.forceUpdate();
    }

    private readonly onFocusOut = (event: FocusEvent): void => {
        const el = this.target;
        if (!el || event.target !== el) return;
        this.learnFrom(el);
        // Moving straight into another served field: its focusin takes over.
        if (this.serves(event.relatedTarget)) return;
        this.hide();
        this.forceUpdate();
    };

    private measure(): Rect {
        const own = this.placeholder?.getBoundingClientRect();
        const height = own?.height ?? 0;
        const position = s(this.data().keyboardPosition, 'editor');
        if (position === 'screenBottom') return { left: 0, top: window.innerHeight - height, width: window.innerWidth, height };
        const view = position === 'viewBottom' || position === 'viewTop' ? this.scope?.getBoundingClientRect() : undefined;
        if (view) {
            // A view taller than the window would put the keyboard off screen.
            const top = position === 'viewTop' ? Math.max(0, view.top) : Math.min(view.bottom, window.innerHeight) - height;
            return { left: view.left, top, width: view.width, height };
        }
        return { left: own?.left ?? 0, top: own?.top ?? 0, width: own?.width ?? 0, height };
    }

    private animationMs(): number {
        return clampTo(n(this.data().keyboardAnimationMs, 150), 0, 2000);
    }

    private animationStyle(): React.CSSProperties {
        const data = this.data();
        const kind = s(data.keyboardAnimation, 'slide');
        const ms = this.animationMs();
        if (kind === 'none' || !ms) return {};
        const name = kind === 'fade' ? 'mdkb-fade' : s(data.keyboardPosition) === 'viewTop' ? 'mdkb-slide-down' : 'mdkb-slide-up';
        return { animation: `${name} ${ms}ms ease-out` };
    }

    private makeRoom(): void {
        const el = this.target;
        const rect = this.rect;
        if (!el || !rect) return;
        const mode = s(this.data().keyboardShowMode, 'overlay');
        const field = el.getBoundingClientRect();
        // The field's rectangle already includes the current offset.
        const shift = this.panned?.offset ?? 0;
        const top = field.top + shift;
        const bottom = field.bottom + shift;
        const lift = panOffset(bottom, rect.top);
        // Moving up only helps a field the keyboard covers and that stays on screen: below a keyboard
        // at the top of the view, or under it, moving up would only push the field out of sight.
        const need = top < rect.top + rect.height && top - lift >= 0 ? lift : 0;
        if (mode === 'pan' && this.scope instanceof HTMLElement) {
            const view = this.scope;
            const offset = need;
            this.panned ??= { el: view, transform: view.style.transform, transition: view.style.transition, offset: 0 };
            this.panned.offset = offset;
            view.style.transition = `transform ${this.animationMs()}ms`;
            view.style.transform = offset ? `${this.panned.transform} translateY(-${offset}px)`.trim() : this.panned.transform;
        } else if (mode === 'pad') {
            const scroller = scrollParent(el);
            if (need && this.padded?.el !== scroller) {
                this.unpad();
                this.padded = { el: scroller, paddingBottom: scroller.style.paddingBottom };
                scroller.style.paddingBottom = `${rect.height}px`;
            }
            scroller.scrollTop += need;
        }
    }

    private unpan(): void {
        if (!this.panned) return;
        this.panned.el.style.transform = this.panned.transform;
        this.panned.el.style.transition = this.panned.transition;
        this.panned = null;
    }

    private unpad(): void {
        if (!this.padded) return;
        this.padded.el.style.paddingBottom = this.padded.paddingBottom;
        this.padded = null;
    }

    private readonly onWindowResize = (): void => {
        if (!this.target) return;
        // Measured unpanned: in "editor" position the placeholder moves with the view.
        this.unpan();
        this.rect = this.measure();
        this.makeRoom();
        this.forceUpdate();
    };

    private hide(): void {
        this.unpan();
        this.unpad();
        this.stopRepeat();
        this.cancelSuggestionPress();
        this.target = null;
        this.rect = null;
        this.symbols = false;
        this.draft = null;
    }

    private layoutFor(el: Field | null): Layout {
        return chooseLayout(this.data().keyboardLayout, el ? originalType(el) : 'text', el ? originalInputMode(el) : '');
    }

    private keyMap(): KeyMap {
        return keyMapFor(this.data().keyboardLanguage, visLocale());
    }

    /** `type="number"` and `type="email"` have no selection API; reading it can throw. */
    private selection(el: Field): [number | null, number | null] {
        try {
            return [el.selectionStart, el.selectionEnd];
        } catch {
            return [null, null];
        }
    }

    private currentValue(el: Field): string {
        return this.draft?.el === el ? this.draft.text : el.value;
    }

    /** The native setter plus an `input` event is what React-controlled fields listen to. */
    private write(el: Field, result: EditResult): void {
        const before = this.currentValue(el).length;
        // The native setter bypasses maxlength; an edit may still shorten or keep the length.
        if (el.maxLength >= 0 && result.value.length > el.maxLength && result.value.length > before) return;
        this.draft = this.selection(el)[0] === null ? { el, text: result.value } : null;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, result.value);
        try {
            el.setSelectionRange(result.caret, result.caret);
        } catch {
            // No selection API: the caret stays at the end anyway.
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    private refreshShift(): void {
        const el = this.target;
        if (!el || this.shift === 'lock') return;
        const value = this.currentValue(el);
        const caret = this.selection(el)[0] ?? value.length;
        this.shift = b(this.data().keyboardAutoCapitalize, true) && this.layoutFor(el) === 'text' && autoShift(value, caret) ? 'once' : 'off';
    }

    private type(el: Field, text: string): void {
        const [start, end] = this.selection(el);
        this.write(el, applyKey(this.currentValue(el), start, end, { kind: 'char', text }));
        this.refreshShift();
    }

    private press(key: KeyDef): void {
        const el = this.target;
        if (!el || key === '') return;
        if (typeof key === 'string') {
            this.type(el, this.shift === 'off' ? key : upper(key));
            return;
        }
        switch (key.special) {
            case 'space':
                this.type(el, ' ');
                return;
            case 'decimal':
                this.type(el, decimalChar(this.keyMap(), originalType(el) === 'number'));
                return;
            case 'backspace': {
                const [start, end] = this.selection(el);
                this.write(el, applyKey(this.currentValue(el), start, end, { kind: 'backspace' }));
                this.refreshShift();
                return;
            }
            case 'shift': {
                const now = Date.now();
                const quick = now - this.lastShiftTap < 400;
                this.shift = this.shift === 'off' ? 'once' : this.shift === 'once' && quick ? 'lock' : 'off';
                this.lastShiftTap = now;
                return;
            }
            case 'symbols':
            case 'letters':
                this.symbols = key.special === 'symbols';
                return;
            case 'enter':
                this.enter(el);
                return;
            case 'close':
                el.blur();
                return;
            case 'left':
            case 'right':
            case 'up':
            case 'down':
                this.arrow(el, key.special);
                return;
        }
    }

    private arrow(el: Field, special: Special): void {
        const { key, move } = KEYS[special].arrow!;
        const event = new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        if (event.defaultPrevented) return;
        const [start, end] = this.selection(el);
        const caret = moveCaret(this.currentValue(el), start, end, move);
        if (caret === null) return;
        try {
            el.setSelectionRange(caret, caret);
        } catch {
            // No selection API: nothing to move.
        }
        this.refreshShift();
    }

    private enter(el: Field): void {
        // Learned first: a widget may empty its field on Enter (Bring adds the article and clears
        // it), and the blur after it would find nothing.
        this.learnFrom(el);
        // keyCode/which for legacy widgets (Bring: keypress with which 13). As in the browser, a
        // cancelled keydown suppresses the keypress.
        const init = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
        if (el.dispatchEvent(new KeyboardEvent('keydown', init))) el.dispatchEvent(new KeyboardEvent('keypress', { ...init, charCode: 13 }));
        el.dispatchEvent(new KeyboardEvent('keyup', init));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        const mode = s(this.data().keyboardEnter, 'close');
        if (mode === 'stay') return;
        if (mode === 'next') {
            const fields = this.servedFields();
            const next = fields[fields.indexOf(el) + 1];
            if (next) {
                next.focus();
                if (document.activeElement === next) return;
            }
        }
        el.blur();
    }

    private startRepeat(key: KeyDef): void {
        this.stopRepeat();
        this.repeatTimer = window.setTimeout(() => {
            this.repeatTimer = window.setInterval(() => {
                this.press(key);
                this.forceUpdate();
            }, 50);
        }, 500);
    }

    private swallowTimer: number | undefined;

    // Trap: a key that hides the keyboard does so on pointerdown, so the panel is gone before the
    // click of the same tap arrives, and that click hits whatever lies below (a dialog overlay, a
    // button). pointerdown preventDefault does not suppress it. The capture listener on window runs
    // before React's root listener.
    private readonly swallowClick = (): void => {
        this.stopSwallow();
        window.addEventListener('click', this.eatClick, true);
        this.swallowTimer = window.setTimeout(this.stopSwallow, 600);
    };

    private readonly eatClick = (event: Event): void => {
        event.stopPropagation();
        event.preventDefault();
        this.stopSwallow();
    };

    private readonly stopSwallow = (): void => {
        window.removeEventListener('click', this.eatClick, true);
        window.clearTimeout(this.swallowTimer);
        this.swallowTimer = undefined;
    };

    private readonly stopRepeat = (): void => {
        if (this.repeatTimer !== undefined) {
            // Timeout and interval ids share one pool, so clearing both is safe.
            window.clearTimeout(this.repeatTimer);
            window.clearInterval(this.repeatTimer);
            this.repeatTimer = undefined;
        }
        if (this.pressed !== null) {
            this.pressed = null;
            this.forceUpdate();
        }
    };

    private keyLabel(special: Special): string {
        if (special === 'decimal') return decimalChar(this.keyMap(), !!this.target && originalType(this.target) === 'number');
        return KEYS[special].label ?? '';
    }

    private wordsOid(): string {
        return s(this.data().keyboardWordsOid);
    }

    private storedWords(): unknown {
        const oid = this.wordsOid();
        if (oid) return stateValue(this.state, oid);
        try {
            return window.localStorage.getItem(WORDS_KEY);
        } catch {
            return null;
        }
    }

    /** Parsed again only when the stored value changed; own writes stand until the state echoes them. */
    private readWords(): Words {
        const value = this.storedWords();
        if (value !== this.wordsSeen) {
            this.wordsSeen = value;
            this.wordsCache = parseWords(value);
        }
        return this.wordsCache;
    }

    // Known limit: two devices writing the state at almost the same moment can lose one count.
    private saveWords(words: Words): void {
        const json = JSON.stringify(words);
        const oid = this.wordsOid();
        this.wordsCache = words;
        if (oid) {
            setStateValue(this.props, oid, json);
            return;
        }
        try {
            window.localStorage.setItem(WORDS_KEY, json);
            this.wordsSeen = json;
        } catch {
            // No storage: the words last until the page reloads.
        }
    }

    private learnFrom(el: Field): void {
        if (!b(this.data().keyboardSuggestions, true)) return;
        if (originalType(el) === 'password' || this.layoutFor(el) === 'number') return;
        const value = this.currentValue(el);
        if (this.known?.el === el && this.known.value === value) return;
        if (this.known?.el === el) this.known.value = value;
        if (!wordsIn(value).length) return;
        this.saveWords(learn(this.readWords(), value, Date.now()));
    }

    private startSuggestionPress(word: string): void {
        this.cancelSuggestionPress();
        this.suggestionForgotten = false;
        this.suggestionTimer = window.setTimeout(() => {
            this.suggestionTimer = undefined;
            this.suggestionForgotten = true;
            this.saveWords(forget(this.readWords(), word));
            this.forceUpdate();
        }, 600);
    }

    private endSuggestionPress(word: string): void {
        const forgotten = this.suggestionForgotten;
        this.cancelSuggestionPress();
        const el = this.target;
        if (forgotten || !el) return;
        const value = this.currentValue(el);
        this.write(el, replaceWord(value, this.selection(el)[0] ?? value.length, word));
        this.refreshShift();
        this.forceUpdate();
    }

    private readonly cancelSuggestionPress = (): void => {
        if (this.suggestionTimer !== undefined) {
            window.clearTimeout(this.suggestionTimer);
            this.suggestionTimer = undefined;
        }
    };

    private renderSuggestions(look: Look): React.JSX.Element | null {
        const data = this.data();
        const el = this.target;
        if (!b(data.keyboardSuggestions, true) || this.layoutFor(el) === 'number') return null;
        const value = el ? this.currentValue(el) : '';
        const prefix = el ? currentWord(value, this.selection(el)[0] ?? value.length).word : '';
        const list = el ? suggest(this.readWords(), prefix, n(data.keyboardSuggestionCount, 3), suggestionOrder(data.keyboardSuggestionOrder)) : [];
        return (
            <div data-suggestions="" style={{ display: 'flex', flex: 1, gap: look.gap, minHeight: 0 }}>
                {list.map(word => (
                    <button
                        data-suggestion={word}
                        key={word}
                        onPointerCancel={this.cancelSuggestionPress}
                        onPointerDown={event => {
                            event.preventDefault();
                            this.startSuggestionPress(word);
                        }}
                        onPointerLeave={this.cancelSuggestionPress}
                        onPointerUp={() => this.endSuggestionPress(word)}
                        style={{ background: 'transparent', border: 0, borderRadius: look.radius, color: look.text, flex: 1, fontSize: look.fontSize, minWidth: 0, overflow: 'hidden', padding: '0 4px', textOverflow: 'ellipsis', touchAction: 'manipulation', userSelect: 'none', whiteSpace: 'nowrap' }}
                        tabIndex={-1}
                        type="button"
                    >
                        {word}
                    </button>
                ))}
            </div>
        );
    }

    private renderKey(key: KeyDef, id: string, look: Look, pad: boolean): React.JSX.Element {
        if (key === '') return <div aria-hidden="true" key={id} style={{ flex: 1 }} />;
        const special = typeof key === 'string' ? null : key.special;
        const info = special ? KEYS[special] : null;
        const label = typeof key !== 'string' ? this.keyLabel(key.special) : this.shift === 'off' ? key : upper(key);
        const active = special === 'shift' && this.shift !== 'off';
        const icon = special === 'shift' && this.shift === 'lock' ? 'apple-keyboard-caps' : info?.icon;
        return (
            <button
                aria-label={info ? VisWidget.t(info.aria) : undefined}
                aria-pressed={special === 'shift' ? active : undefined}
                data-key={special ?? key}
                key={id}
                onPointerCancel={this.stopRepeat}
                onPointerDown={event => {
                    event.preventDefault();
                    this.pressed = id;
                    const shown = !!this.target;
                    this.press(key);
                    if (shown && !this.target) this.swallowClick();
                    if (special === 'backspace' || info?.arrow) this.startRepeat(key);
                    this.forceUpdate();
                }}
                onPointerLeave={this.stopRepeat}
                onPointerUp={this.stopRepeat}
                style={{
                    background: info && !info.charLook ? look.special : look.key,
                    border: 0,
                    borderRadius: look.radius,
                    boxShadow: active ? 'inset 0 -3px 0 currentColor' : undefined,
                    color: look.text,
                    filter: this.pressed === id ? 'brightness(0.85)' : undefined,
                    // The number pad is a grid: a wider key would shift the columns of its row.
                    flex: pad ? 1 : (info?.flex ?? 1),
                    fontSize: look.fontSize,
                    minWidth: 0,
                    padding: 0,
                    touchAction: 'manipulation',
                    userSelect: 'none',
                }}
                tabIndex={-1}
                type="button"
            >
                {icon ? <span aria-hidden="true" style={{ display: 'inline-flex' }}>{renderIcon(icon, look.text, look.fontSize * 1.2)}</span> : label}
            </button>
        );
    }

    private renderPanel(editor: boolean): React.JSX.Element {
        const data = this.data();
        const isDark = this.isDarkTheme();
        const isM3 = designStyle(data) === 'material3';
        const look = keyLook(data, isM3, isDark);
        const arrows = b(data.keyboardArrows, false);
        const pad = this.layoutFor(this.target) === 'number';
        const rows = pad ? numberRows(arrows) : textRows(this.keyMap(), this.symbols, arrows);
        const place: React.CSSProperties = editor || !this.rect ? { inset: 0, position: 'absolute' } : { ...this.rect, position: 'fixed' };
        return (
            <div
                aria-label={VisWidget.t('keyboardAria')}
                className={`materialdesign-widget materialdesign-keyboard-panel${isM3 ? ` ${designStyleClasses(data, isDark)}` : ''}`}
                // A tap between two keys must not take the focus from the field either. Browsers move
                // the focus as the default action of mousedown; cancelling pointerdown does not reliably stop that.
                onMouseDown={event => event.preventDefault()}
                onPointerDown={event => event.preventDefault()}
                role="group"
                style={{
                    ...ownCssVariables(this.refService?.current),
                    ...place,
                    ...(editor ? {} : this.animationStyle()),
                    background: look.background,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: look.gap,
                    padding: look.gap,
                    // Trap: in the editor vis-2 selects a widget through an overlay above it; a raised
                    // panel would cover that overlay and the widget could not be clicked.
                    zIndex: editor ? undefined : 10000,
                }}
            >
                <style>{KEYFRAMES}</style>
                {this.renderSuggestions(look)}
                {rows.map((row, r) => (
                    <div key={`row${r}`} style={{ display: 'flex', flex: 1, gap: look.gap, minHeight: 0 }}>
                        {row.map((k, c) => this.renderKey(k, `${r}-${c}`, look, pad))}
                    </div>
                ))}
            </div>
        );
    }

    private clickThrough(element: HTMLDivElement | null): void {
        this.placeholder = element;
        if (!element && this.wrapper) this.wrapper.style.pointerEvents = '';
        this.wrapper = passWrapperClicks(element, this.props.editMode);
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const editor = !!this.props.editMode;
        const panel = editor || this.target ? this.renderPanel(editor) : null;
        return (
            <div className="materialdesign-widget materialdesign-keyboard" ref={element => this.clickThrough(element)} style={{ height: '100%', pointerEvents: editor ? undefined : 'none', position: 'relative', width: '100%' }}>
                {panel && !editor ? createPortal(panel, document.body) : panel}
            </div>
        );
    }
}
