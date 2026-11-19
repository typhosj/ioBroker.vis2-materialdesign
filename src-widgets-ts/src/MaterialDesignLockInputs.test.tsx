import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignSelect from './MaterialDesignSelect';
import { resetPins } from './widgetLock';

function fixture<T>(value: unknown): T { return value as T; }
type El = React.ReactElement<Record<string, unknown>>;
function find(node: React.ReactNode, test: (el: El) => boolean): El | undefined {
    if (Array.isArray(node)) return node.map(child => find(child, test)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const el = node as El;
    return test(el) ? el : find(el.props.children as React.ReactNode, test);
}
const isPad = (el: El) => typeof el.type === 'function' && (el.type as { name?: string }).name === 'PinPad';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { resetPins(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Input lock (upstream #112)', () => {
    const make = (rxData: Record<string, unknown>) => {
        const setValue = vi.fn();
        const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: { setValue } }));
        input.state = fixture<typeof input.state>({ rxData: { oid: 'test.0.t', lockEnabled: true, autoLockAfter: 3, ...rxData }, data: rxData, values: { 'test.0.t.val': 'abc' } });
        const tree = () => input.renderWidgetBody(fixture<Parameters<typeof input.renderWidgetBody>[0]>({}));
        const field = () => find(tree(), el => el.type === 'input')!;
        return { input, setValue, tree, field };
    };

    it('locked: readonly with a lock icon, blur and Enter write nothing', () => {
        const w = make({});
        expect(w.field().props.readOnly).toBe(true);
        expect(find(w.tree(), el => el.props['data-lock-icon'] !== undefined)).toBeDefined();
        (w.field().props.onBlur as (e: unknown) => void)({ target: { value: 'x' } });
        (w.field().props.onKeyDown as (e: unknown) => void)({ key: 'Enter', currentTarget: { value: 'x' } });
        expect(w.setValue).not.toHaveBeenCalled();
    });

    it('a tap unlocks and focuses the field', () => {
        const w = make({});
        const focus = vi.fn();
        (w.input as unknown as { inputRef: { current: { focus: () => void } } }).inputRef.current = { focus };
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        expect(w.field().props.readOnly).toBe(false);
        vi.runOnlyPendingTimers?.();
        expect(focus).toHaveBeenCalled();
    });

    it('stays unlocked while focused past the lock time, relocks after blur', () => {
        const w = make({});
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        (w.field().props.onFocus as () => void)();
        vi.advanceTimersByTime(5000);
        expect(w.field().props.readOnly).toBe(false);
        (w.field().props.onBlur as (e: unknown) => void)({ target: { value: 'new' } });
        expect(w.setValue).toHaveBeenCalledWith('test.0.t', 'new');
        expect(w.field().props.readOnly).toBe(true);
    });

    it('with a PIN the tap opens the pad', () => {
        const w = make({ lockPin: '12' });
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        expect(find(w.tree(), isPad)).toBeDefined();
        expect(w.field().props.readOnly).toBe(true);
    });

    it('the pad sits in a wrapper that stops click and key events from reaching ancestors', () => {
        const w = make({ lockPin: '12' });
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        const wrapper = find(w.tree(), el => el.type === 'span' && !!find(el.props.children as React.ReactNode, isPad))!;
        for (const name of ['onClick', 'onKeyDown']) {
            const stopPropagation = vi.fn();
            (wrapper.props[name] as (e: unknown) => void)({ stopPropagation });
            expect(stopPropagation).toHaveBeenCalled();
        }
    });

    it('read-only wins over the lock', () => {
        const w = make({ readOnly: 'true' });
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        expect(w.field().props.readOnly).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('read-only with the lock enabled shows no lock icon and a tap is left alone', () => {
        const w = make({ readOnly: 'true' });
        expect(find(w.tree(), el => el.props['data-lock-icon'] !== undefined)).toBeUndefined();
        const preventDefault = vi.fn();
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault });
        expect(preventDefault).not.toHaveBeenCalled();
    });

    it('a field focused while locked is held once the tap unlocks it', () => {
        const w = make({});
        const el = { blur: () => undefined, focus: () => undefined } as unknown as HTMLInputElement;
        (w.input as unknown as { inputRef: { current: unknown } }).inputRef.current = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (w.field().props.onFocus as () => void)();
            (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
            vi.advanceTimersByTime(5000);
            expect(w.field().props.readOnly).toBe(false);
            (w.field().props.onBlur as (e: unknown) => void)({ target: { value: 'v' } });
            expect(w.field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });

    it('an autofocused field is blurred and focused again by the unlocking tap, without a commit, and stays held', () => {
        const w = make({});
        const calls: string[] = [];
        const el = {
            blur: () => { calls.push('blur'); (w.field().props.onBlur as (e: unknown) => void)({ target: { value: 'abc' } }); },
            focus: () => { calls.push('focus'); (w.field().props.onFocus as () => void)(); },
        };
        (w.input as unknown as { inputRef: { current: unknown } }).inputRef.current = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (w.field().props.onFocus as () => void)();
            (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
            vi.advanceTimersByTime(10);
            expect(calls).toEqual(['blur', 'focus']);
            expect(w.setValue).not.toHaveBeenCalled();
            vi.advanceTimersByTime(5000);
            expect(w.field().props.readOnly).toBe(false);
            (w.field().props.onBlur as (e: unknown) => void)({ target: { value: 'abc' } });
            expect(w.field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });

    it('the material picker holds the lock while the dialog is open; every close releases it', () => {
        for (const close of ['onCancel', 'onConfirm']) {
            const w = make({ inputType: 'date', pickerStyle: 'material' });
            (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
            (find(w.tree(), el => el.props['aria-haspopup'] === 'dialog')!.props.onClick as () => void)();
            vi.advanceTimersByTime(5000);
            expect(w.field().props.readOnly).toBe(false);
            const dialog = find(w.tree(), el => typeof el.props.onConfirm === 'function')!;
            (dialog.props[close] as (v?: unknown) => void)(close === 'onConfirm' ? "2026-11-10" : undefined);
            expect(w.field().props.readOnly).toBe(true);
            w.input.componentWillUnmount();
        }
    });

    it('unmounting clears the relock timer', () => {
        const w = make({});
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        vi.advanceTimersByTime(10);
        w.input.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Select / Autocomplete lock', () => {
    const items = { listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' };
    const select = (rxData: Record<string, unknown>, values: Record<string, unknown> = {}) => {
        const w = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { lockEnabled: true, autoLockAfter: 3, ...items, ...rxData }, data: rxData, values });
        const tree = () => w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({}));
        const button = () => find(tree(), el => el.type === 'button')!;
        const isOpen = () => (w as unknown as { open: boolean }).open;
        return { w, tree, button, isOpen };
    };
    const lockIcon = (tree: React.ReactNode) => find(tree, el => el.props['data-lock-icon'] !== undefined);
    const autocomplete = (rxData: Record<string, unknown>) => {
        const w = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { lockEnabled: true, autoLockAfter: 3, inputMode: 'write', ...items, ...rxData }, data: rxData, values: {} });
        const tree = () => w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({}));
        const field = () => find(tree(), el => el.type === 'input')!;
        return { w, tree, field };
    };

    it('a locked Select shows the lock and the first tap unlocks and opens the menu', () => {
        const s = select({});
        expect(lockIcon(s.tree())).toBeDefined();
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(true);
    });

    it('the menu holds the lock open; closing it relocks after the time', () => {
        const s = select({});
        (s.button().props.onClick as () => void)();
        vi.advanceTimersByTime(5000);
        expect(lockIcon(s.tree())).toBeUndefined();
        (s.w as unknown as { closeMenu: () => void }).closeMenu();
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('with a PIN the Select opens the pad, not the menu', () => {
        const s = select({ lockPin: '12' });
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(false);
        expect(find(s.tree(), isPad)).toBeDefined();
    });

    it('the pad sits in a wrapper that stops click and key events from reaching ancestors', () => {
        const s = select({ lockPin: '12' });
        (s.button().props.onClick as () => void)();
        const wrapper = find(s.tree(), el => el.type === 'span' && !!find(el.props.children as React.ReactNode, isPad))!;
        for (const name of ['onClick', 'onKeyDown']) {
            const stopPropagation = vi.fn();
            (wrapper.props[name] as (e: unknown) => void)({ stopPropagation });
            expect(stopPropagation).toHaveBeenCalled();
        }
    });

    it('read-only wins: no lock icon, a tap opens nothing and asks nothing', () => {
        const s = select({ readOnly: 'true', lockPin: '12' });
        expect(lockIcon(s.tree())).toBeUndefined();
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(false);
        expect(find(s.tree(), isPad)).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('a locked Autocomplete is readonly; a tap unlocks and focuses', () => {
        const a = autocomplete({});
        expect(a.field().props.readOnly).toBe(true);
        (a.field().props.onFocus as () => void)();
        expect((a.w as unknown as { open: boolean }).open).toBe(false);
        const focus = vi.fn();
        (a.w as unknown as { inputRef: { focus: () => void } }).inputRef = { focus };
        (a.field().props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
        expect(a.field().props.readOnly).toBe(false);
        vi.advanceTimersByTime(10);
        expect(focus).toHaveBeenCalled();
    });

    it('a locked Autocomplete ignores keys; read-only shows no lock and a tap does nothing', () => {
        const a = autocomplete({});
        const preventDefault = vi.fn();
        (a.field().props.onKeyDown as (e: unknown) => void)({ key: 'ArrowDown', preventDefault });
        expect(preventDefault).not.toHaveBeenCalled();
        const r = autocomplete({ readOnly: 'true' });
        expect(lockIcon(r.tree())).toBeUndefined();
        (r.field().props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('an Autocomplete focused while locked is held once the tap unlocks it, and relocks on blur', () => {
        const a = autocomplete({});
        const el = { blur: () => undefined, focus: () => undefined };
        (a.w as unknown as { inputRef: unknown }).inputRef = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (a.field().props.onFocus as () => void)();
            (a.field().props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
            vi.advanceTimersByTime(5000);
            expect(a.field().props.readOnly).toBe(false);
            (a.field().props.onBlur as () => void)();
            expect(a.field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });

    const clearButton = (tree: React.ReactNode) => find(tree, el => el.props['aria-label'] === 'ariaClearInput')!;
    const clearOnClick = (tree: React.ReactNode) => (clearButton(tree).props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
    const clear = { oid: 'test.0.s', clearIconShow: true };
    const picked = { 'test.0.s.val': 1 };

    it('clearing while the menu is open closes it and lets the widget relock', () => {
        const s = select(clear, picked);
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(true);
        clearOnClick(s.tree());
        expect(s.isOpen()).toBe(false);
        vi.advanceTimersByTime(5000);
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('clearing with openOnClear opens the menu and holds the lock until it closes', () => {
        const s = select({ ...clear, openOnClear: true }, picked);
        (s.button().props.onClick as () => void)();
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(false);
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(true);
        (s.button().props.onClick as () => void)();
        expect(s.isOpen()).toBe(false);
        clearOnClick(s.tree());
        expect(s.isOpen()).toBe(true);
        vi.advanceTimersByTime(5000);
        expect(lockIcon(s.tree())).toBeUndefined();
        (s.w as unknown as { closeMenu: () => void }).closeMenu();
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('a pointerdown on the locked Autocomplete keeps the focus off the readonly field, unlocks, then focuses', () => {
        const a = autocomplete({});
        const focus = vi.fn();
        (a.w as unknown as { inputRef: unknown }).inputRef = { focus };
        const preventDefault = vi.fn();
        (a.field().props.onPointerDown as (e: unknown) => void)({ preventDefault });
        expect(preventDefault).toHaveBeenCalled();
        expect(a.field().props.readOnly).toBe(false);
        expect(focus).not.toHaveBeenCalled();
        vi.advanceTimersByTime(10);
        expect(focus).toHaveBeenCalledTimes(1);
        // The pointerdown of an already unlocked field is left alone.
        (a.field().props.onPointerDown as (e: unknown) => void)({ preventDefault });
        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('an Autocomplete focused while locked is blurred and focused again by the unlocking tap, and stays held', () => {
        const a = autocomplete({});
        const calls: string[] = [];
        const el = {
            blur: () => { calls.push('blur'); (a.field().props.onBlur as () => void)(); },
            focus: () => { calls.push('focus'); (a.field().props.onFocus as () => void)(); },
        };
        (a.w as unknown as { inputRef: unknown }).inputRef = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (a.field().props.onFocus as () => void)();
            (a.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
            vi.advanceTimersByTime(10);
            expect(calls).toEqual(['blur', 'focus']);
            vi.advanceTimersByTime(5000);
            expect(a.field().props.readOnly).toBe(false);
            (a.field().props.onBlur as () => void)();
            expect(a.field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });

    it('unmounting clears the relock timer', () => {
        const s = select({});
        (s.button().props.onClick as () => void)();
        s.w.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Autocomplete lock after Escape', () => {
    it('a focused unlocked field stays unlocked after Escape past the lock time; blur locks it', () => {
        const w = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { lockEnabled: true, autoLockAfter: 3, inputMode: 'write', listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' }, data: {}, values: {} });
        const field = () => find(w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({})), el => el.type === 'input')!;
        const el = { blur: () => undefined, focus: () => undefined };
        (w as unknown as { inputRef: unknown }).inputRef = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (field().props.onFocus as () => void)();
            (field().props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
            (field().props.onKeyDown as (e: unknown) => void)({ key: 'Escape', stopPropagation: () => undefined });
            vi.advanceTimersByTime(5000);
            expect(field().props.readOnly).toBe(false);
            (field().props.onBlur as () => void)();
            expect(field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });
});

describe('Autocomplete lock, Escape after the lock time', () => {
    it('a field held past the lock time stays unlocked through Escape; blur locks it', () => {
        const w = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { lockEnabled: true, autoLockAfter: 3, inputMode: 'write', listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' }, data: {}, values: {} });
        const field = () => find(w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({})), el => el.type === 'input')!;
        const el = { blur: () => undefined, focus: () => undefined };
        (w as unknown as { inputRef: unknown }).inputRef = el;
        Object.defineProperty(document, 'activeElement', { configurable: true, get: () => el });
        try {
            (field().props.onFocus as () => void)();
            (field().props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
            vi.advanceTimersByTime(5000);
            expect(field().props.readOnly).toBe(false);
            (field().props.onKeyDown as (e: unknown) => void)({ key: 'Escape', stopPropagation: () => undefined });
            expect(field().props.readOnly).toBe(false);
            (field().props.onBlur as () => void)();
            expect(field().props.readOnly).toBe(true);
        } finally {
            delete (document as unknown as Record<string, unknown>).activeElement;
        }
    });
});
