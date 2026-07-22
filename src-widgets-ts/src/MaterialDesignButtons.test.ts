import { afterEach, describe, expect, it, vi } from 'vitest';

import { createButtonClass } from './MaterialDesignButtons';

function fixture<T>(value: unknown): T { return value as T; }

const definition = (kind: 'navigation' | 'state' | 'multiState' | 'addition' | 'toggle') => ({
    id: `test-${kind}`,
    name: kind,
    kind,
    layout: 'default' as const,
    label: kind,
    icon: 'plus',
});

function widget(kind: Parameters<typeof definition>[0]) {
    const setValue = vi.fn();
    const changeView = vi.fn();
    const Button = createButtonClass(definition(kind));
    const instance = fixture<{
        activate: (data: Record<string, unknown>, current: ioBroker.StateValue | undefined) => void;
        componentWillUnmount: () => void;
    }>(new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue, changeView } })));
    return { changeView, instance, setValue };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('shared button actions', () => {
    it('keeps state action values typed and ignores an empty oid', () => {
        const { instance, setValue } = widget('state');
        instance.activate({ oid: 'test.0.value', value: '12.5' }, undefined);
        instance.activate({ oid: '', value: 'true' }, undefined);
        expect(setValue).toHaveBeenCalledOnce();
        expect(setValue).toHaveBeenCalledWith('test.0.value', 12.5);
    });

    it('clamps additions to configured min/max values', () => {
        const { instance, setValue } = widget('addition');
        instance.activate({ oid: 'test.0.value', value: 8, minmax: '0;10' }, 5);
        instance.activate({ oid: 'test.0.value', value: -20, minmax: '0;10' }, 5);
        expect(setValue.mock.calls).toEqual([
            ['test.0.value', 10],
            ['test.0.value', 0],
        ]);
    });

    it('supports boolean/value toggles and honors read-only', () => {
        const { instance, setValue } = widget('toggle');
        instance.activate({ oid: 'test.0.bool' }, false);
        instance.activate({ oid: 'test.0.mode', toggleType: 'value', valueOn: '1', valueOff: '0' }, 1);
        instance.activate({ oid: 'test.0.readonly', readOnly: true }, false);
        expect(setValue.mock.calls).toEqual([
            ['test.0.bool', true],
            ['test.0.mode', 0],
        ]);
    });

    it('writes indexed multi-state values and cancels delayed writes on unmount', () => {
        vi.useFakeTimers();
        const { instance, setValue } = widget('multiState');
        instance.activate({
            countOids: 1,
            oid0: 'test.0.first',
            value0: 'true',
            oid1: 'test.0.second',
            value1: '7',
            delayInMs1: 50,
        }, undefined);
        expect(setValue).toHaveBeenCalledWith('test.0.first', true);
        instance.componentWillUnmount();
        vi.runAllTimers();
        expect(setValue).not.toHaveBeenCalledWith('test.0.second', 7);
    });

    it('routes navigation through VIS2 context', () => {
        const { changeView, instance } = widget('navigation');
        instance.activate({ nav_view: 'details' }, undefined);
        expect(changeView).toHaveBeenCalledWith('details');
    });
});
