import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createToggleControlClass } from './MaterialDesignToggleControls';

function fixture<T>(value: unknown): T { return value as T; }

afterEach(() => {
    vi.useRealTimers();
});

describe('shared checkbox/switch behavior', () => {
    it('writes configured value-mode values and blocks read-only writes', () => {
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue } }));
        control.state = fixture<typeof control.state>({
            rxData: { oid: 'test.0.mode', toggleType: 'value', valueOn: 'on', valueOff: 'off' },
            values: { 'test.0.mode.val': 'off' },
        });
        const tree = fixture<React.ReactElement<{ onClick: () => void }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})));
        tree.props.onClick();
        expect(setValue).toHaveBeenCalledWith('test.0.mode', 'on');

        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.mode', readOnly: true }, values: {} });
        fixture<React.ReactElement<{ onClick: () => void }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))).props.onClick();
        expect(setValue).toHaveBeenCalledOnce();
    });

    it('requires one click to unlock and clears the relock timer on unmount', () => {
        vi.useFakeTimers();
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'checkbox' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue } }));
        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.locked', lockEnabled: true, autoLockAfter: 1 }, values: {} });

        fixture<React.ReactElement<{ onClick: () => void }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))).props.onClick();
        expect(setValue).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(1);

        fixture<React.ReactElement<{ onClick: () => void }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))).props.onClick();
        expect(setValue).toHaveBeenCalledWith('test.0.locked', true);
        control.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    // With colorSwitchTrue on both, the control rendered as one filled oval with no visible handle.
    it('keeps the M3 handle distinct from the track when only the on-color is saved', () => {
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue: vi.fn() } }));
        control.state = fixture<typeof control.state>({
            rxData: { oid: 'test.0.mode', designStyle: 'material3', colorSwitchTrue: '#44739e' },
            values: { 'test.0.mode.val': true },
        });
        const html = renderToStaticMarkup(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})));
        expect(html).toContain('background:#44739e');
        expect(html).toContain('background:var(--md-sys-color-on-primary)');
    });

    it('carries the pressed-handle scale and shows the handle icon only when configured and on', () => {
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue: vi.fn() } }));
        const render = (rxData: Record<string, unknown>, value: unknown): string => {
            control.state = fixture<typeof control.state>({ rxData, values: { 'test.0.mode.val': value } });
            return renderToStaticMarkup(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})));
        };
        const on = render({ oid: 'test.0.mode', designStyle: 'material3', md3SwitchIcon: true }, true);
        expect(on).toContain('--mdw-switch-pressed-scale:1.1666666666666667');
        expect(on).toContain('<svg');
        expect(render({ oid: 'test.0.mode', designStyle: 'material3', md3SwitchIcon: true }, false)).toContain('--mdw-switch-pressed-scale:1.75');
        expect(render({ oid: 'test.0.mode', designStyle: 'material3', md3SwitchIcon: true }, false)).not.toContain('<svg');
        expect(render({ oid: 'test.0.mode', designStyle: 'material3' }, true)).not.toContain('<svg');
    });

    // A read-only checkbox announced itself as operable and looked enabled in M3.
    it('marks a read-only checkbox disabled and dims it in M3', () => {
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'checkbox' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue: vi.fn() } }));
        const render = (rxData: Record<string, unknown>): string => {
            control.state = fixture<typeof control.state>({ rxData, values: {} });
            return renderToStaticMarkup(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})));
        };
        const m3 = render({ oid: 'test.0.flag', designStyle: 'material3', readOnly: true });
        expect(m3).toContain('aria-disabled="true"');
        expect(m3).toContain('opacity:0.38');
        const legacy = render({ oid: 'test.0.flag', readOnly: true });
        expect(legacy).toContain('aria-disabled="true"');
        expect(legacy).not.toContain('opacity:0.38');
    });

    // A hidden native input showed the browser's arrow over the M3 switch while the empty widget
    // edges showed the hand, and the cursor set under "CSS common" never got through (issue #28).
    it('shows the hand over the control itself and lets the widget cursor style win', () => {
        const render = (kind: 'switch' | 'checkbox', rxData: Record<string, unknown>, rxStyle?: Record<string, unknown>): React.ReactElement<{ style: React.CSSProperties }> => {
            const Control = createToggleControlClass({ id: 'test', name: 'Test', kind });
            const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue: vi.fn() } }));
            control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.flag', ...rxData }, rxStyle, values: {} });
            return fixture<React.ReactElement<{ style: React.CSSProperties }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})));
        };
        for (const kind of ['switch', 'checkbox'] as const) {
            for (const designStyle of ['material3', 'legacy']) {
                const html = renderToStaticMarkup(render(kind, { designStyle }));
                // No hidden native input is left to show its own cursor over the control.
                expect(html, `${kind}/${designStyle}`).not.toContain('<input');
            }
        }
        expect(render('switch', { designStyle: 'material3' }).props.style.cursor).toBe('pointer');
        expect(render('switch', { designStyle: 'material3' }, { cursor: 'copy' }).props.style.cursor).toBe('copy');
        expect(render('checkbox', {}, { cursor: 'copy' }).props.style.cursor).toBe('copy');
        // The label used to set its own hand and kept it over a custom cursor.
        expect(renderToStaticMarkup(render('switch', { designStyle: 'material3', labelFalse: 'Licht' }, { cursor: 'copy' }))).not.toContain('cursor:pointer');
        expect(render('switch', { readOnly: true }).props.style.cursor).toBe('default');
        expect(render('switch', { readOnly: true }, { cursor: 'copy' }).props.style.cursor).toBe('copy');
        // An emptied or missing field, or a binding that produced no text, keeps the widget's own cursor.
        for (const cursor of ['', '  ', null, undefined, 5]) {
            expect(render('switch', {}, { cursor }).props.style.cursor, String(cursor)).toBe('pointer');
        }
        expect(render('switch', {}, {}).props.style.cursor).toBe('pointer');

        // An inert label shows the arrow, unless the widget cursor says otherwise.
        const inert = (rxStyle?: Record<string, unknown>): string => renderToStaticMarkup(render('switch', { labelFalse: 'Licht', labelClickActive: false }, rxStyle));
        expect(inert()).toMatch(/cursor:default[^>]*>Licht/);
        expect(inert({ cursor: 'copy' })).toMatch(/cursor:copy[^>]*>Licht/);
        expect(inert({ cursor: '  ' })).toMatch(/cursor:default[^>]*>Licht/);
    });

    // "activate label click" only changed the cursor: the click handler sits on the whole widget, so
    // a click on the label still switched (and unlocked) the control. VIS 1 made the label inert.
    it('ignores clicks on the label while label click is off', () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const clicks = (kind: 'switch' | 'checkbox', rxData: Record<string, unknown>): { label: number; control: number } => {
            const setValue = vi.fn();
            const Control = createToggleControlClass({ id: 'test', name: 'Test', kind });
            const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue } }));
            control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.flag', labelFalse: 'Licht', ...rxData }, values: {} });
            act(() => root.render(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))));
            const label = Array.from(container.querySelectorAll('span')).find(span => span.textContent === 'Licht');
            if (!label) throw new Error('missing label');
            act(() => { label.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
            const viaLabel = setValue.mock.calls.length;
            act(() => { container.querySelector('[role=switch], [role=checkbox]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
            return { label: viaLabel, control: setValue.mock.calls.length - viaLabel };
        };
        try {
            for (const kind of ['switch', 'checkbox'] as const) {
                for (const designStyle of ['material3', 'legacy']) {
                    const tag = `${kind}/${designStyle}`;
                    expect(clicks(kind, { designStyle, labelClickActive: false }), tag).toEqual({ label: 0, control: 1 });
                    // VIS 1 projects carry the option as a string.
                    expect(clicks(kind, { designStyle, labelClickActive: 'false' }), tag).toEqual({ label: 0, control: 1 });
                    expect(clicks(kind, { designStyle, labelClickActive: true }), tag).toEqual({ label: 1, control: 1 });
                    // Unset, emptied or a binding that produced nothing keeps the default: label clicks work.
                    for (const value of [undefined, null, '']) {
                        expect(clicks(kind, { designStyle, labelClickActive: value }), `${tag}/${String(value)}`).toEqual({ label: 1, control: 1 });
                    }
                }
            }
            // A locked control is not unlocked from an inert label either.
            expect(clicks('switch', { labelClickActive: false, lockEnabled: true }), 'locked').toEqual({ label: 0, control: 0 });
        } finally {
            act(() => root.unmount());
            container.remove();
        }
    });
});

describe('read-only from a binding', () => {
    it.each([
        ['false', true],
        ['0', true],
        ['', true],
        ['true', false],
        ['1', false],
    ])('readOnly %j writes: %s', (readOnly, writes) => {
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue } }));
        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.mode', readOnly }, values: {} });
        fixture<React.ReactElement<{ onClick: () => void }>>(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))).props.onClick();
        expect(setValue.mock.calls.length).toBe(writes ? 1 : 0);
    });
});

// The widget was a role=button around a role=switch/checkbox around a focusable native checkbox:
// three announced roles and two tab stops for one control.
describe('one interactive control per switch or checkbox', () => {
    const FOCUSABLE = '[tabindex]:not([tabindex="-1"]), input:not([tabindex="-1"]), button, select, textarea, a[href]';
    const ROLES = '[role=switch], [role=checkbox], [role=button]';
    const cases = (['switch', 'checkbox'] as const).flatMap(kind =>
        ['legacy', 'material3'].flatMap(designStyle =>
            [true, false].flatMap(checked =>
                [false, true].flatMap(readOnly =>
                    [false, true].map(locked => ({ kind, designStyle, checked, readOnly, locked, tag: `${kind}/${designStyle}/${checked ? 'on' : 'off'}${readOnly ? '/readOnly' : ''}${locked ? '/locked' : ''}` }))))));

    function mount(kind: 'switch' | 'checkbox', rxData: Record<string, unknown>, value: unknown): { container: HTMLElement; setValue: ReturnType<typeof vi.fn>; unmount: () => void } {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue } }));
        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.flag', ...rxData }, values: { 'test.0.flag.val': value } });
        act(() => root.render(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}))));
        return { container, setValue, unmount: () => { act(() => root.unmount()); container.remove(); } };
    }

    it.each(cases)('exposes exactly one focusable $tag control with its role, state and name', ({ kind, designStyle, checked, readOnly, locked }) => {
        const nesting = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { container, unmount } = mount(kind, { designStyle, readOnly, lockEnabled: locked, labelFalse: 'Licht', labelTrue: 'Licht an' }, checked);
        try {
            const stops = container.querySelectorAll(FOCUSABLE);
            expect(stops).toHaveLength(1);
            const [control] = Array.from(stops);
            expect(control.getAttribute('role')).toBe(kind);
            expect(control.getAttribute('aria-checked')).toBe(String(checked));
            expect(control.getAttribute('aria-disabled')).toBe(readOnly ? 'true' : null);
            expect(control.getAttribute('tabindex')).toBe('0');
            expect(container.querySelector('input')).toBeNull();
            for (const element of Array.from(container.querySelectorAll(ROLES))) {
                expect(element.querySelector(ROLES), 'nested role').toBeNull();
            }
            const labelledBy = control.getAttribute('aria-labelledby') ?? '';
            expect(container.querySelector(`[id="${labelledBy}"]`)?.textContent).toBe(checked ? 'Licht an' : 'Licht');
            expect(control.hasAttribute('aria-label')).toBe(false);
            expect(nesting).not.toHaveBeenCalled();
        } finally {
            unmount();
            nesting.mockRestore();
        }
    });

    it.each(['switch', 'checkbox'] as const)('names a %s without visible label text from the widget name or the hidden label', kind => {
        for (const rxData of [{}, { labelPosition: 'off' }, { labelFalse: '   ' }]) {
            const { container, unmount } = mount(kind, rxData, false);
            try {
                const control = container.querySelector(`[role=${kind}]`)!;
                expect(control.getAttribute('aria-label'), JSON.stringify(rxData)).toBe('Test');
                expect(control.hasAttribute('aria-labelledby')).toBe(false);
            } finally { unmount(); }
        }
        const { container, unmount } = mount(kind, { labelPosition: 'off', labelFalse: 'Licht' }, false);
        try {
            expect(container.querySelector(`[role=${kind}]`)!.getAttribute('aria-label')).toBe('Licht');
        } finally { unmount(); }
    });

    it.each(cases)('$tag: Space and Enter write the state, read-only and locked do not', ({ kind, designStyle, checked, readOnly, locked }) => {
        // A fresh mount per key: the first activation of a locked control unlocks it, the next one writes.
        for (const key of [' ', 'Enter']) {
            const { container, setValue, unmount } = mount(kind, { designStyle, readOnly, lockEnabled: locked }, checked);
            try {
                const control = container.querySelector<HTMLElement>(`[role=${kind}]`)!;
                act(() => { control.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true })); });
                expect(setValue, `${key}: other key`).not.toHaveBeenCalled();
                act(() => { control.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
                expect(setValue.mock.calls, key).toEqual(readOnly || locked ? [] : [['test.0.flag', !checked]]);
            } finally { unmount(); }
        }
    });
});