import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createToggleControlClass } from './MaterialDesignToggleControls';

afterEach(() => {
    vi.useRealTimers();
});

describe('shared checkbox/switch behavior', () => {
    it('writes configured value-mode values and blocks read-only writes', () => {
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control({ context: { setValue } } as never);
        control.state = {
            rxData: { oid: 'test.0.mode', toggleType: 'value', valueOn: 'on', valueOff: 'off' },
            values: { 'test.0.mode.val': 'off' },
        } as never;
        const tree = control.renderWidgetBody({} as never) as React.ReactElement<{ onClick: () => void }>;
        tree.props.onClick();
        expect(setValue).toHaveBeenCalledWith('test.0.mode', 'on');

        control.state = { rxData: { oid: 'test.0.mode', readOnly: true }, values: {} } as never;
        (control.renderWidgetBody({} as never) as React.ReactElement<{ onClick: () => void }>).props.onClick();
        expect(setValue).toHaveBeenCalledOnce();
    });

    it('requires one click to unlock and clears the relock timer on unmount', () => {
        vi.useFakeTimers();
        const setValue = vi.fn();
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'checkbox' });
        const control = new Control({ context: { setValue } } as never);
        control.state = { rxData: { oid: 'test.0.locked', lockEnabled: true, autoLockAfter: 1 }, values: {} } as never;

        (control.renderWidgetBody({} as never) as React.ReactElement<{ onClick: () => void }>).props.onClick();
        expect(setValue).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(1);

        (control.renderWidgetBody({} as never) as React.ReactElement<{ onClick: () => void }>).props.onClick();
        expect(setValue).toHaveBeenCalledWith('test.0.locked', true);
        control.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
