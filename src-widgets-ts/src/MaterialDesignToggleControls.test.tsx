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
});
