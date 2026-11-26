import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignRoundSlider from './MaterialDesignRoundSlider';
import MaterialDesignSlider from './MaterialDesignSlider';
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
const lockIcon = (tree: React.ReactNode) => find(tree, el => el.props['data-lock-icon'] !== undefined);

beforeEach(() => vi.useFakeTimers());
afterEach(() => { resetPins(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe.each([
    ['Slider', MaterialDesignSlider],
    ['Round Slider', MaterialDesignRoundSlider],
])('%s lock (upstream #112)', (_name, Widget) => {
    const make = (rxData: Record<string, unknown>) => {
        const setValue = vi.fn();
        const w = new Widget(fixture<ConstructorParameters<typeof Widget>[0]>({ context: { setValue } }));
        w.state = fixture<typeof w.state>({ rxData: { oid: 'test.0.n', lockEnabled: true, autoLockAfter: 3, ...rxData }, data: rxData, values: { 'test.0.n.val': 10 } });
        const tree = () => w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({}));
        const layer = () => find(tree(), el => typeof el.props.onPointerDown === 'function')!;
        const pointer = { pointerId: 1, clientX: 50, clientY: 50, currentTarget: { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: vi.fn(), getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }) }, stopPropagation: vi.fn(), preventDefault: vi.fn() };
        const call = (name: string) => (layer().props[name] as (e: unknown) => void)(pointer);
        return { w, setValue, tree, layer, call };
    };

    it('locked: a tap unlocks, the gesture writes nothing, the lock icon shows', () => {
        const s = make({});
        expect(lockIcon(s.tree())).toBeDefined();
        s.call('onPointerDown');
        s.call('onPointerMove');
        s.call('onPointerUp');
        vi.advanceTimersByTime(500);
        expect(s.setValue).not.toHaveBeenCalled();
        expect(lockIcon(s.tree())).toBeUndefined();
    });

    it('a drag holds the lock open past its time', () => {
        const s = make({});
        s.call('onPointerDown');
        s.call('onPointerUp');
        s.call('onPointerDown');
        vi.advanceTimersByTime(5000);
        expect(lockIcon(s.tree())).toBeUndefined();
        s.call('onPointerUp');
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('a cancelled drag releases the hold', () => {
        const s = make({});
        s.call('onPointerDown');
        s.call('onPointerUp');
        s.call('onPointerDown');
        vi.advanceTimersByTime(5000);
        s.call('onPointerCancel');
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('a cancelled unlocking gesture does not swallow the next drag', () => {
        const s = make({});
        s.call('onPointerDown');
        s.call('onPointerCancel');
        s.call('onPointerDown');
        s.call('onPointerMove');
        vi.advanceTimersByTime(500);
        expect(s.setValue).toHaveBeenCalled();
    });

    it('a locked press that never gets its pointerup does not break the next drag', () => {
        const s = make({});
        s.call('onPointerDown');
        s.call('onPointerDown');
        s.call('onPointerMove');
        s.call('onPointerUp');
        vi.advanceTimersByTime(500);
        expect(s.setValue).toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        expect(lockIcon(s.tree())).toBeDefined();
    });

    it('with a PIN the tap opens the pad', () => {
        const s = make({ lockPin: '12' });
        s.call('onPointerDown');
        expect(find(s.tree(), isPad)).toBeDefined();
    });

    it('arrow keys do nothing while locked', () => {
        const s = make({});
        const keyed = find(s.tree(), el => typeof el.props.onKeyDown === 'function')!;
        (keyed.props.onKeyDown as (e: unknown) => void)({ key: 'ArrowRight', preventDefault: vi.fn(), stopPropagation: vi.fn() });
        vi.advanceTimersByTime(500);
        expect(s.setValue).not.toHaveBeenCalled();
    });

    it('read-only wins: no lock icon, a tap asks nothing and swallows nothing', () => {
        const s = make({ readOnly: 'true', lockPin: '12' });
        expect(lockIcon(s.tree())).toBeUndefined();
        s.call('onPointerDown');
        expect(find(s.tree(), isPad)).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('unmounting clears the relock timer', () => {
        const s = make({});
        s.call('onPointerDown');
        s.w.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Round Slider read only and working', () => {
    const track = (rxData: Record<string, unknown>, working?: unknown) => {
        const w = new MaterialDesignRoundSlider(fixture<ConstructorParameters<typeof MaterialDesignRoundSlider>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { oid: 'test.0.n', 'oid-working': 'test.0.w', ...rxData }, data: rxData, values: { 'test.0.n.val': 10, 'test.0.w.val': working } });
        const tree = w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({}));
        return { group: find(tree, el => el.type === 'g'), label: find(tree, el => el.props.className === 'labelValue') };
    };

    it.each([
        ['read only', { readOnly: true }, undefined],
        ['read only bound to "true"', { readOnly: 'true' }, undefined],
        ['working', {}, true],
        ['working as number', {}, 1],
    ])('dims the track and the knob when %s, not the value', (_case, rxData, working) => {
        const s = track(rxData, working);
        expect(s.group?.props.opacity).toBe(0.38);
        expect((s.label?.props.style as React.CSSProperties).opacity).toBeUndefined();
    });

    it.each([
        ['active', {}, undefined],
        ['read only off', { readOnly: false }, undefined],
        ['read only bound to "false"', { readOnly: 'false' }, undefined],
        ['working false', {}, false],
        ['working empty', {}, ''],
        ['working "false"', {}, 'false'],
    ])('keeps full strength when %s', (_case, rxData, working) => {
        expect(track(rxData, working).group?.props.opacity).toBeUndefined();
    });
});
