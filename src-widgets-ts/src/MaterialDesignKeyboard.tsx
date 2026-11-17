import React from 'react';
import { createPortal } from 'react-dom';

import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import { m3ColorExplicit } from './MaterialDesignButtons';
import { applyKey, autoShift, chooseLayout, decimalChar, keyMapFor, NUMBER_ROWS, textRows, type EditResult, type KeyDef, type KeyMap, type Layout, type Special } from './keyboard';
import { createInfo, designStyle, designStyleClasses, legacyInk, legacySurface, ownCssVariables, squarePreview, visLocale, VisWidget, boolValue as b, numberValue as n, textValue as s, type RenderProps } from './widgetUtils';

export type Field = HTMLInputElement | HTMLTextAreaElement;
type Shift = 'off' | 'once' | 'lock';
interface Rect { left: number; top: number; width: number; height: number }
interface Colors { background: string; key: string; text: string; special: string }

export const WORDS_KEY = 'vis2-materialdesign-keyboard-words';
/** `data-mdkb-inputmode` holds the page's own inputmode while the widget has set `none`. */
const MARK = 'mdkbInputmode';
const SKIP_TYPES = new Set(['hidden', 'checkbox', 'radio', 'range', 'file', 'color', 'date', 'time', 'datetime-local', 'month', 'week', 'button', 'submit', 'reset', 'image']);
const ARIA: Record<Special, string> = {
    shift: 'ariaKeyShift', backspace: 'ariaKeyBackspace', enter: 'ariaKeyEnter', close: 'ariaKeyClose',
    symbols: 'ariaKeySymbols', letters: 'ariaKeyLetters', space: 'ariaKeySpace', decimal: 'ariaKeyDecimal',
};
const FLEX: Partial<Record<Special, number>> = { space: 4, shift: 1.5, backspace: 1.5, enter: 1.5, symbols: 1.5, letters: 1.5 };

export function isServable(el: unknown): el is Field {
    if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
    if (!(el instanceof HTMLInputElement)) return false;
    return !SKIP_TYPES.has(el.type.toLowerCase()) && !el.readOnly && !el.disabled;
}

/** The inputmode the page gave the field, from before the widget set `none`. */
export function originalInputMode(el: Field): string {
    return el.dataset[MARK] ?? el.getAttribute('inputmode') ?? '';
}

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
        ],
    },
    {
        name: 'keyboardLook',
        label: 'group_keyboardLook',
        fields: [
            ...['keyboardBackground', 'keyboardKeyColor', 'keyboardKeyTextColor', 'keyboardSpecialKeyColor'].map(name => ({ name, label: name, type: 'color' as const })),
            { name: 'keyboardFontSize', label: 'keyboardFontSize', type: 'number', default: 18, min: 8 },
            { name: 'keyboardKeyGap', label: 'keyboardKeyGap', type: 'number', default: 6, min: 0 },
            { name: 'keyboardKeyRadius', label: 'keyboardKeyRadius', type: 'number', default: 8, min: 0 },
        ],
    },
];

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

    private readonly placeholderRef = React.createRef<HTMLDivElement>();
    private target: Field | null = null;
    private scope: Element | null = null;
    private rect: Rect | null = null;
    private observer: MutationObserver | null = null;
    private listening = false;
    private symbols = false;
    private shift: Shift = 'off';
    private lastShiftTap = 0;
    private pressed: string | null = null;
    private repeatTimer: number | undefined;
    // Known limit: while a field without selection API has the focus, a value written into it from
    // outside is not seen until the focus moves to another field.
    /** Text typed into a field without selection API; such a field reports `''` for `1.` or `-`. */
    private draft: { el: Field; text: string } | null = null;

    private data(): Record<string, unknown> {
        return this.state.rxData as unknown as Record<string, unknown>;
    }

    private fieldIds(): string[] {
        return s(this.data().keyboardFields).split(/[\s,;]+/).filter(Boolean);
    }

    /** Served: servable, inside the own view, and inside a listed widget when there is a list. */
    private serves(el: unknown): el is Field {
        if (!isServable(el) || !this.scope?.contains(el)) return false;
        const ids = this.fieldIds();
        return !ids.length || ids.some(id => document.getElementById(id)?.contains(el));
    }

    private servedFields(): Field[] {
        return this.scope ? Array.from(this.scope.querySelectorAll('input, textarea')).filter((el): el is Field => this.serves(el)) : [];
    }

    private readonly suppress = (): void => {
        for (const el of this.servedFields()) {
            if (el.dataset[MARK] !== undefined) continue;
            el.dataset[MARK] = el.getAttribute('inputmode') ?? '';
            el.setAttribute('inputmode', 'none');
        }
    };

    private restore(): void {
        this.scope?.querySelectorAll<HTMLElement>('[data-mdkb-inputmode]').forEach(el => {
            const original = el.dataset[MARK] ?? '';
            if (original) el.setAttribute('inputmode', original);
            else el.removeAttribute('inputmode');
            delete el.dataset[MARK];
        });
    }

    private attach(): void {
        if (this.props.editMode || this.listening || typeof document === 'undefined') return;
        this.listening = true;
        this.scope = this.placeholderRef.current?.closest('[id^="visview_"]') ?? document.body;
        this.suppress();
        this.observer = new MutationObserver(this.suppress);
        this.observer.observe(this.scope, { childList: true, subtree: true });
        document.addEventListener('focusin', this.onFocusIn, true);
        document.addEventListener('focusout', this.onFocusOut, true);
    }

    private detach(): void {
        if (!this.listening) return;
        this.listening = false;
        this.observer?.disconnect();
        this.observer = null;
        document.removeEventListener('focusin', this.onFocusIn, true);
        document.removeEventListener('focusout', this.onFocusOut, true);
        this.hide();
        this.restore();
        this.scope = null;
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.attach();
    }

    componentDidUpdate(prevProps: typeof this.props, prevState: typeof this.state): void {
        super.componentDidUpdate(prevProps, prevState);
        this.attach();
    }

    componentWillUnmount(): void {
        this.detach();
        super.componentWillUnmount();
    }

    private readonly onFocusIn = (event: FocusEvent): void => {
        if (!this.serves(event.target)) return;
        const wasHidden = !this.target;
        if (this.draft?.el !== event.target) this.draft = null;
        this.target = event.target;
        this.symbols = false;
        this.refreshShift();
        if (wasHidden) this.rect = this.measure();
        this.forceUpdate();
    };

    private readonly onFocusOut = (event: FocusEvent): void => {
        const el = this.target;
        if (!el || event.target !== el) return;
        // Moving straight into another served field: its focusin takes over.
        if (this.serves(event.relatedTarget)) return;
        this.hide();
        this.forceUpdate();
    };

    private measure(): Rect {
        const own = this.placeholderRef.current?.getBoundingClientRect();
        return { left: own?.left ?? 0, top: own?.top ?? 0, width: own?.width ?? 0, height: own?.height ?? 0 };
    }

    private hide(): void {
        this.stopRepeat();
        this.target = null;
        this.rect = null;
        this.symbols = false;
        this.draft = null;
    }

    private layoutFor(el: Field | null): Layout {
        return chooseLayout(this.data().keyboardLayout, el instanceof HTMLInputElement ? el.type : 'text', el ? originalInputMode(el) : '');
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

    private valueOf(el: Field): string {
        return this.draft?.el === el ? this.draft.text : el.value;
    }

    /** The native setter plus an `input` event is what React-controlled fields listen to. */
    private write(el: Field, result: EditResult): void {
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
        const value = this.valueOf(el);
        const caret = this.selection(el)[0] ?? value.length;
        this.shift = b(this.data().keyboardAutoCapitalize, true) && this.layoutFor(el) === 'text' && autoShift(value, caret) ? 'once' : 'off';
    }

    private type(el: Field, text: string): void {
        const [start, end] = this.selection(el);
        this.write(el, applyKey(this.valueOf(el), start, end, { kind: 'char', text }));
        this.refreshShift();
    }

    private press(key: KeyDef): void {
        const el = this.target;
        if (!el || key === '') return;
        if (typeof key === 'string') {
            this.type(el, this.shift === 'off' ? key : key.toUpperCase());
            return;
        }
        switch (key.special) {
            case 'space':
                this.type(el, ' ');
                return;
            case 'decimal':
                this.type(el, decimalChar(this.keyMap(), el instanceof HTMLInputElement && el.type === 'number'));
                return;
            case 'backspace': {
                const [start, end] = this.selection(el);
                this.write(el, applyKey(this.valueOf(el), start, end, { kind: 'backspace' }));
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
        }
    }

    private enter(el: Field): void {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        const mode = s(this.data().keyboardEnter, 'close');
        if (mode === 'stay') return;
        if (mode === 'next') {
            const fields = this.servedFields();
            const next = fields[fields.indexOf(el) + 1];
            if (next) {
                next.focus();
                return;
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
        switch (special) {
            case 'shift': return this.shift === 'lock' ? '⇪' : '⇧';
            case 'backspace': return '⌫';
            case 'enter': return '↵';
            case 'close': return '⌄';
            case 'symbols': return '?123';
            case 'letters': return 'ABC';
            case 'space': return '';
            case 'decimal': return decimalChar(this.keyMap(), this.target instanceof HTMLInputElement && this.target.type === 'number');
        }
    }

    private renderKey(key: KeyDef, id: string, colors: Colors, fontSize: number, radius: number): React.JSX.Element {
        if (key === '') return <div aria-hidden="true" key={id} style={{ flex: 1 }} />;
        const special = typeof key === 'string' ? null : key.special;
        const label = typeof key !== 'string' ? this.keyLabel(key.special) : this.shift === 'off' ? key : key.toUpperCase();
        const active = special === 'shift' && this.shift !== 'off';
        return (
            <button
                aria-label={special ? VisWidget.t(ARIA[special]) : undefined}
                aria-pressed={special === 'shift' ? active : undefined}
                data-key={special ?? key}
                key={id}
                onPointerCancel={this.stopRepeat}
                onPointerDown={event => {
                    event.preventDefault();
                    this.pressed = id;
                    this.press(key);
                    if (special === 'backspace') this.startRepeat(key);
                    this.forceUpdate();
                }}
                onPointerLeave={this.stopRepeat}
                onPointerUp={this.stopRepeat}
                style={{
                    background: special ? colors.special : colors.key,
                    border: 0,
                    borderRadius: radius,
                    boxShadow: active ? 'inset 0 -3px 0 currentColor' : undefined,
                    color: colors.text,
                    filter: this.pressed === id ? 'brightness(0.85)' : undefined,
                    flex: (special && FLEX[special]) ?? 1,
                    fontSize,
                    minWidth: 0,
                    padding: 0,
                    touchAction: 'manipulation',
                    userSelect: 'none',
                }}
                tabIndex={-1}
                type="button"
            >
                {label}
            </button>
        );
    }

    private renderPanel(editor: boolean): React.JSX.Element {
        const data = this.data();
        const isDark = this.isDarkTheme();
        const isM3 = designStyle(data) === 'material3';
        const m3c = (saved: unknown, token: string, legacy: string): string => (isM3 && !m3ColorExplicit(saved) ? token : s(saved, legacy));
        const colors: Colors = {
            background: m3c(data.keyboardBackground, 'var(--md-sys-color-surface-container-high)', isDark ? '#121212' : '#eceff1'),
            key: m3c(data.keyboardKeyColor, 'var(--md-sys-color-surface-container-lowest)', legacySurface(isDark)),
            text: m3c(data.keyboardKeyTextColor, 'var(--md-sys-color-on-surface)', legacyInk(isDark)),
            special: m3c(data.keyboardSpecialKeyColor, 'var(--md-sys-color-secondary-container)', isDark ? '#3a3a3a' : '#cfd8dc'),
        };
        const gap = Math.max(0, n(data.keyboardKeyGap, 6));
        const fontSize = Math.max(8, n(data.keyboardFontSize, 18));
        const radius = Math.max(0, n(data.keyboardKeyRadius, 8));
        const rows = this.layoutFor(this.target) === 'number' ? NUMBER_ROWS : textRows(this.keyMap(), this.symbols);
        const place: React.CSSProperties = editor || !this.rect ? { inset: 0, position: 'absolute' } : { ...this.rect, position: 'fixed' };
        return (
            <div
                aria-label={VisWidget.t('keyboardAria')}
                className={`materialdesign-widget materialdesign-keyboard-panel${isM3 ? ` ${designStyleClasses(data, isDark)}` : ''}`}
                // A tap between two keys must not take the focus from the field either.
                onPointerDown={event => event.preventDefault()}
                role="group"
                style={{
                    ...ownCssVariables(this.refService?.current),
                    ...place,
                    background: colors.background,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap,
                    padding: gap,
                    zIndex: 10000,
                }}
            >
                {rows.map((row, r) => (
                    <div key={`row${r}`} style={{ display: 'flex', flex: 1, gap, minHeight: 0 }}>
                        {row.map((k, c) => this.renderKey(k, `${r}-${c}`, colors, fontSize, radius))}
                    </div>
                ))}
            </div>
        );
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const editor = !!this.props.editMode;
        const panel = editor || this.target ? this.renderPanel(editor) : null;
        return (
            <div className="materialdesign-widget materialdesign-keyboard" ref={this.placeholderRef} style={{ height: '100%', position: 'relative', width: '100%' }}>
                {panel && !editor ? createPortal(panel, document.body) : panel}
            </div>
        );
    }
}
