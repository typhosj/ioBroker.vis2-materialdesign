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

    // The hidden native input showed the browser's arrow over the M3 switch while the empty widget
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
                const inputs = html.match(/<input[^>]*>/g) ?? [];
                expect(inputs, `${kind}/${designStyle}`).toHaveLength(1);
                expect(inputs[0], `${kind}/${designStyle}`).toContain('cursor:inherit');
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
            act(() => { container.querySelector('input')!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
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
