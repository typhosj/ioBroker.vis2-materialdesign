import React from 'react';
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

    // The switched-on M3 handle must never take the track's on-color: with colorSwitchTrue applied to
    // both, the control rendered as one filled oval with no visible handle.
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

    // M3 grows the handle to 28 px while pressed and can put a check inside the selected one.
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
        // Unselected: no icon (M3 shows one there only in the two-icon variant), 16 -> 28 scale.
        expect(render({ oid: 'test.0.mode', designStyle: 'material3', md3SwitchIcon: true }, false)).toContain('--mdw-switch-pressed-scale:1.75');
        expect(render({ oid: 'test.0.mode', designStyle: 'material3', md3SwitchIcon: true }, false)).not.toContain('<svg');
        expect(render({ oid: 'test.0.mode', designStyle: 'material3' }, true)).not.toContain('<svg');
    });

    // A read-only checkbox announced itself as operable and, in M3, looked exactly like an enabled one.
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
        // Legacy keeps its look: the attribute is there, the dimming is not.
        const legacy = render({ oid: 'test.0.flag', readOnly: true });
        expect(legacy).toContain('aria-disabled="true"');
        expect(legacy).not.toContain('opacity:0.38');
    });
});
