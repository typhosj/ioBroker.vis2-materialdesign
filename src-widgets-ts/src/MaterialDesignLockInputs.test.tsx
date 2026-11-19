import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignInput from './MaterialDesignInput';
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

    it('unmounting clears the relock timer', () => {
        const w = make({});
        (w.field().props.onPointerDown as (e: unknown) => void)({ preventDefault: () => undefined });
        vi.advanceTimersByTime(10);
        w.input.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
