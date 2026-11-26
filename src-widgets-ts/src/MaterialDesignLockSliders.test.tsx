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

describe('Slider thumb label and tick styling', () => {
    const tree = (rxData: Record<string, unknown>) => {
        const w = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>({ context: { setValue: vi.fn() } }));
        w.state = fixture<typeof w.state>({ rxData: { oid: 'test.0.n', showThumbLabel: 'always', showTicks: 'always', tickLabels: 'a,b,c', ...rxData }, data: rxData, values: { 'test.0.n.val': 50 } });
        return w.renderWidgetBody(fixture<Parameters<typeof w.renderWidgetBody>[0]>({}));
    };
    const style = (node: React.ReactNode, className: string, nth = 0): React.CSSProperties => {
        const all: El[] = [];
        const walk = (child: React.ReactNode): void => {
            if (Array.isArray(child)) { child.forEach(walk); return; }
            if (!React.isValidElement(child)) return;
            const el = child as El;
            if (typeof el.props.className === 'string' && el.props.className.split(' ').includes(className)) all.push(el);
            walk(el.props.children as React.ReactNode);
        };
        walk(node);
        return all[nth].props.style as React.CSSProperties;
    };

    it.each([
        ['M3 theme color', { designStyle: 'material3' }, 'var(--md-sys-color-on-primary)'],
        ['Classic default', {}, '#ffffff'],
        ['light own knob color', { colorThumb: '#ffa000' }, '#1d1b20'],
        ['light thumb background', { thumbBackgroundColor: '#ffee00' }, '#1d1b20'],
        ['M3 with a light own knob color', { designStyle: 'material3', colorThumb: '#ffa000' }, '#1d1b20'],
        ['unparseable knob color', { colorThumb: 'yellow' }, '#FFFFFF'],
        ['explicit font color', { colorThumb: '#ffa000', thumbFontColor: '#ff0000' }, '#ff0000'],
        ['unresolved theme token', { thumbFontColor: '#mdwTheme:colors.x' }, '#ffffff'],
    ])('thumb label text: %s', (_case, rxData, color) => {
        expect(style(tree(rxData), 'v-slider__thumb-label').color).toBe(color);
    });

    it('applies thumb label font size and family, ignoring empty and non-positive sizes', () => {
        expect(style(tree({ thumbFontSize: 16, thumbFontFamily: 'Serif' }), 'v-slider__thumb-label')).toMatchObject({ fontSize: 16, fontFamily: 'Serif' });
        for (const thumbFontSize of ['', 0, -3, 'abc']) {
            const s = style(tree({ thumbFontSize }), 'v-slider__thumb-label');
            expect(s.fontSize).toBeUndefined();
            expect(s.fontFamily).toBeUndefined();
        }
    });

    it('colors filled and open ticks and styles the tick captions', () => {
        const t = tree({ tickColorBefore: '#00ff00', tickColorAfter: '#0000ff', tickTextColor: '#ff0000', tickFontSize: 9, tickFontFamily: 'Mono' });
        expect(style(t, 'v-slider__tick', 0).background).toBe('#00ff00');
        expect(style(t, 'v-slider__tick', 2).background).toBe('#0000ff');
        expect(style(t, 'v-slider__tick-label', 0)).toMatchObject({ color: '#ff0000', fontSize: 9, fontFamily: 'Mono' });
    });

    it('keeps the default tick look when the options are empty or theme tokens', () => {
        const t = tree({ tickColorBefore: '', tickColorAfter: '#mdwTheme:colors.x', tickFontSize: 0 });
        expect(style(t, 'v-slider__tick', 0).background).toBeUndefined();
        expect(style(t, 'v-slider__tick', 2).background).toBeUndefined();
        expect(style(t, 'v-slider__tick-label', 0)).toEqual({ color: undefined, fontFamily: undefined, fontSize: undefined });
    });
});
