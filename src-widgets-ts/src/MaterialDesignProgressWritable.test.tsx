import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignProgress, { progressKeysFlipped, progressPointerValue, type ProgressData } from './MaterialDesignProgress';
import MaterialDesignProgressCircular from './MaterialDesignProgressCircular';

function fixture<T>(value: unknown): T { return value as T; }
type El = React.ReactElement<Record<string, unknown>>;
function find(node: React.ReactNode, test: (el: El) => boolean): El | undefined {
    if (Array.isArray(node)) return node.map(child => find(child, test)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const el = node as El;
    return test(el) ? el : find(el.props.children as React.ReactNode, test);
}

describe('progressPointerValue (upstream #160)', () => {
    it.each([
        [0, {}, 0], [0.5, {}, 50], [1, {}, 100], [0.234, {}, 23],
        [-0.5, {}, 0], [1.5, {}, 100], [Number.NaN, {}, 0],
        [0.25, { reverse: true }, 75], [0.25, { invertValue: true }, 75], [0.25, { reverse: true, invertValue: true }, 25],
        [0.5, { min: 10, max: 30 }, 20], [0.33, { min: 0, max: 10, step: 2.5 }, 2.5], [0.3, { min: 0, max: 1, step: 0.1 }, 0.3],
        [0.5, { step: 0 }, 50], [0.5, { step: -5 }, 50], [0.5, { min: '', max: '' }, 50],
    ])('fraction %d with %j -> %d', (fraction, data, value) => {
        expect(progressPointerValue(fraction, data as ProgressData)).toBe(value);
    });
});

describe('writable Progress (upstream #160)', () => {
    const make = (rxData: Record<string, unknown>, editMode = false, value: unknown = 20) => {
        const setValue = vi.fn();
        const widget = new MaterialDesignProgress(fixture<ConstructorParameters<typeof MaterialDesignProgress>[0]>({ context: { setValue }, editMode }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': value } });
        widget.forceUpdate = vi.fn();
        const bar = () => find(widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({})), el => el.props.role === 'slider' || el.props.role === 'progressbar')!;
        const pointer = (x: number, y = 0) => ({ clientX: x, clientY: y, pointerId: 1, currentTarget: { getBoundingClientRect: () => ({ left: 100, top: 50, width: 200, height: 20 }), setPointerCapture: vi.fn() } });
        const call = (name: string, event: unknown) => (bar().props[name] as (e: unknown) => void)(event);
        const fill = () => (find(widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({})), el => String(el.props.className).includes('v-progress-linear__determinate'))!.props.style as { width: string }).width;
        return { setValue, bar, pointer, call, fill, widget };
    };

    it('stays a plain progress bar without the option', () => {
        const p = make({});
        expect(p.bar().props.role).toBe('progressbar');
        expect(p.bar().props.onPointerDown).toBeUndefined();
    });

    it.each([['the editor', { progressWritable: true }, true], ['an indeterminate bar', { progressWritable: true, progressIndeterminate: true }, false], ['no object id', { progressWritable: true, oid: '' }, false]])('stays read-only in %s', (_name, rxData, editMode) => {
        expect(make(rxData, editMode).bar().props.role).toBe('progressbar');
    });

    it('a drag follows the pointer and writes once on release', () => {
        const p = make({ progressWritable: true });
        expect(p.bar().props.role).toBe('slider');
        p.call('onPointerDown', p.pointer(150));
        expect(p.fill()).toBe('25%');
        p.call('onPointerMove', p.pointer(250));
        expect(p.fill()).toBe('75%');
        expect(p.setValue).not.toHaveBeenCalled();
        p.call('onPointerUp', p.pointer(250));
        expect(p.setValue).toHaveBeenCalledExactlyOnceWith('test.0.level', 75);
        p.call('onPointerUp', p.pointer(250));
        expect(p.setValue).toHaveBeenCalledOnce();
    });

    it('a move without a press and a cancelled drag write nothing', () => {
        const p = make({ progressWritable: true });
        p.call('onPointerMove', p.pointer(250));
        p.call('onPointerDown', p.pointer(150));
        p.call('onPointerCancel', p.pointer(150));
        p.call('onPointerUp', p.pointer(150));
        expect(p.setValue).not.toHaveBeenCalled();
        expect(p.fill()).toBe('20%');
    });

    it('a rotated bar reads the pointer from top to bottom', () => {
        const p = make({ progressWritable: true, progressRotate: 'yesRotate' });
        p.call('onPointerDown', p.pointer(0, 55));
        p.call('onPointerUp', p.pointer(0, 55));
        expect(p.setValue).toHaveBeenCalledWith('test.0.level', 25);
    });

    it('arrow keys step from the stored value inside min and max', () => {
        const p = make({ progressWritable: true, step: 5, max: 22 });
        const preventDefault = vi.fn();
        p.call('onKeyDown', { key: 'ArrowRight', preventDefault });
        p.call('onKeyDown', { key: 'End', preventDefault });
        p.call('onKeyDown', { key: 'a', preventDefault });
        expect(p.setValue.mock.calls).toEqual([['test.0.level', 22], ['test.0.level', 22]]);
        expect(preventDefault).toHaveBeenCalledTimes(2);
    });

    it('a release redraws the stored value, also when no state change follows', () => {
        const p = make({ progressWritable: true });
        p.call('onPointerDown', p.pointer(250));
        const redraws = vi.mocked(p.widget.forceUpdate).mock.calls.length;
        p.call('onPointerUp', p.pointer(250));
        expect(vi.mocked(p.widget.forceUpdate).mock.calls.length).toBe(redraws + 1);
        expect(p.fill()).toBe('20%');
    });

    it.each([[{}, 'horizontal'], [{ progressRotate: 'yesRotate' }, 'vertical'], [{ progressRotate: 'noRotate' }, 'horizontal']])('%j announces the orientation %s', (rxData, orientation) => {
        expect(make({ progressWritable: true, ...rxData }).bar().props['aria-orientation']).toBe(orientation);
    });

    it('arrow keys move the fill the way they point on a reversed bar', () => {
        const p = make({ progressWritable: true, reverse: true, step: 5 });
        p.call('onKeyDown', { key: 'ArrowRight', preventDefault: vi.fn() });
        p.call('onKeyDown', { key: 'ArrowLeft', preventDefault: vi.fn() });
        p.call('onKeyDown', { key: 'PageUp', preventDefault: vi.fn() });
        expect(p.setValue.mock.calls).toEqual([['test.0.level', 15], ['test.0.level', 25], ['test.0.level', 70]]);
    });
});

describe('progressKeysFlipped', () => {
    it.each([
        [{}, false], [{ reverse: true }, true], [{ invertValue: true }, true], [{ reverse: true, invertValue: true }, false],
        [{ progressRotate: 'yesRotate' }, true], [{ progressRotate: 'yesRotate', reverse: true }, false],
        [{ progressRotate: 'yesRotate', invertValue: true }, false], [{ progressRotate: 'yesRotate', reverse: true, invertValue: true }, true],
        [{ progressRotate: 'noRotate', reverse: true }, true],
    ])('%j -> %s', (data, flipped) => {
        expect(progressKeysFlipped(data as ProgressData)).toBe(flipped);
    });
});

describe('striped Progress bar rendering', () => {
    const fillStyle = (rxData: Record<string, unknown>) => {
        const widget = new MaterialDesignProgress(fixture<ConstructorParameters<typeof MaterialDesignProgress>[0]>({ context: {}, editMode: false }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': 60 } });
        const el = find(widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({})), e => String(e.props.className).includes('v-progress-linear__determinate'))!;
        return { className: String(el.props.className), style: el.props.style as React.CSSProperties };
    };

    it('draws the stripes as an image over the bar color in a square tile', () => {
        const { style } = fillStyle({ progressStriped: true, colorProgress: '#123456' });
        expect(style.background).toBeUndefined();
        expect(style.backgroundColor).toBe('#123456');
        expect(style.backgroundImage).toMatch(/^linear-gradient\(135deg, /);
        expect(style.backgroundSize).toBe('40px 40px');
    });

    it('keeps the stripes on an indeterminate bar together with its animation class', () => {
        const { className, style } = fillStyle({ progressStriped: true, progressIndeterminate: true, colorProgress: '#123456' });
        expect(className).toContain('materialdesign-progress--indeterminate');
        expect(style.backgroundImage).toMatch(/^linear-gradient\(/);
    });

    it('draws a plain bar without an image', () => {
        expect(fillStyle({ colorProgress: '#123456' }).style).toMatchObject({ backgroundColor: '#123456', backgroundImage: 'none' });
    });
});

describe('Progress label over the bar', () => {
    const render = (rxData: Record<string, unknown>, value: unknown = 60) => {
        const widget = new MaterialDesignProgress(fixture<ConstructorParameters<typeof MaterialDesignProgress>[0]>({ context: {}, editMode: false }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', textAlign: 'center', ...rxData }, values: { 'test.0.level.val': value } });
        const tree = widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({}));
        const bar = find(tree, e => String(e.props.className).includes('v-progress-linear__determinate'))!;
        const onBar = find(bar.props.children as React.ReactNode, e => String(e.props.className).includes('v-progress-linear__content'));
        const onTrack = find(tree, e => String(e.props.className).includes('v-progress-linear__content'));
        return { bar, onBar, onTrack, style: (el: El | undefined) => el?.props.style as React.CSSProperties | undefined };
    };

    it.each([
        ['M3 theme color', { designStyle: 'material3' }, 'var(--md-sys-color-on-primary)', 'var(--md-sys-color-on-surface)'],
        ['Classic default', {}, '#ffffff', '#000'],
        ['light own bar color', { colorProgress: '#ffee00' }, '#1d1b20', '#000'],
        ['condition color', { colorProgress: '#ffee00', colorOneCondition: 50, colorOne: '#003366' }, '#ffffff', '#000'],
        ['unparseable bar color', { colorProgress: 'yellow' }, '#000', '#000'],
        ['explicit text color', { colorProgress: '#ffee00', textColor: '#ff0000' }, '#ff0000', '#ff0000'],
    ])('text on the bar contrasts with it: %s', (_case, rxData, onBar, onTrack) => {
        const r = render(rxData);
        expect(r.style(r.onBar)?.color).toBe(onBar);
        expect(r.style(r.onTrack)?.color).toBe(onTrack);
        expect(r.onBar?.props['aria-hidden']).toBe('true');
        expect(r.style(r.bar)?.overflow).toBe('hidden');
    });

    it('lines the bar copy up with the full track, also reversed', () => {
        const plain = render({}, 25);
        expect(plain.style(plain.onBar)).toMatchObject({ position: 'absolute', top: 0, insetInlineStart: '0%', width: '400%' });
        const reversed = render({ reverse: true }, 25);
        expect(reversed.style(reversed.onBar)).toMatchObject({ insetInlineStart: '-300%', width: '400%' });
    });

    it('draws no bar copy for an empty bar, a hidden label or an indeterminate bar', () => {
        expect(render({}, 0).onBar).toBeUndefined();
        expect(render({ showValueLabel: false }).onBar).toBeUndefined();
        expect(render({ progressIndeterminate: true }).onBar).toBeUndefined();
    });
});

describe('Progress Circular text on the inner color', () => {
    const color = (rxData: Record<string, unknown>) => {
        const widget = new MaterialDesignProgressCircular(fixture<ConstructorParameters<typeof MaterialDesignProgressCircular>[0]>({ context: {}, editMode: false }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': 60 } });
        const info = find(widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({})), e => e.props.className === 'v-progress-circular__info')!;
        return (info.props.style as React.CSSProperties).color;
    };

    it.each([
        ['no inner color, Classic', {}, '#000'],
        ['no inner color, M3', { designStyle: 'material3' }, 'var(--md-sys-color-on-surface)'],
        ['dark inner color', { innerColor: '#003366' }, '#ffffff'],
        ['light inner color in M3', { designStyle: 'material3', innerColor: '#ffee00' }, '#1d1b20'],
        ['unparseable inner color', { innerColor: 'navy' }, '#000'],
        ['unresolved theme token', { innerColor: '#mdwTheme:colors.x' }, '#000'],
        ['explicit text color', { innerColor: '#003366', textColor: '#ff0000' }, '#ff0000'],
    ])('%s', (_case, rxData, expected) => {
        expect(color(rxData)).toBe(expected);
    });
});
