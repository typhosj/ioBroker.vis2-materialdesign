import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

    // Upstream #12: a single bound read as a minimum made "max 50" jump the state up to 50 and then
    // count on without a limit, and an empty field made 0 the minimum.
    it('reads a single bound in the direction of the step', () => {
        const { instance, setValue } = widget('addition');
        instance.activate({ oid: 'test.0.value', value: 5, minmax: '50' }, 10);
        instance.activate({ oid: 'test.0.value', value: 5, minmax: '50' }, 48);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '5' }, 10);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '5' }, 5);
        instance.activate({ oid: 'test.0.value', value: -1, minmax: '' }, 0);
        expect(setValue.mock.calls).toEqual([
            ['test.0.value', 15],
            ['test.0.value', 50],
            ['test.0.value', 9],
            ['test.0.value', 5],
            ['test.0.value', -1],
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

    it('ignores releases without a press so a loading view writes nothing', () => {
        const { instance, setValue } = widget('toggle');
        const push = fixture<{
            press: (data: Record<string, unknown>) => void;
            release: (data: Record<string, unknown>, current: ioBroker.StateValue | undefined) => void;
            cancelPress: (data: Record<string, unknown>) => void;
        }>(instance);
        const data = { oid: 'test.0.push', pushButton: true };

        push.release(data, false);
        push.cancelPress(data);
        expect(setValue).not.toHaveBeenCalled();

        push.press(data);
        push.press(data);
        push.release(data, true);
        expect(setValue.mock.calls).toEqual([
            ['test.0.push', true],
            ['test.0.push', false],
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

// Upstream #11: a navigation button reads no object, so every "true" option stayed dead until the
// target view itself became the active state.
describe('navigation button active presentation (upstream #11)', () => {
    const Button = createButtonClass(definition('navigation'));
    const render = (activeView: string): string => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn(), activeView } })),
        );
        instance.state = fixture<typeof instance.state>({
            rxData: { nav_view: 'details', buttontext: 'Seite', labelTrue: 'Seite aktiv', labelColorTrue: '#7c0409', colorBgTrue: '#eeeeee', image: 'lightbulb-outline', imageTrue: 'lightbulb', imageTrueColor: '#00696d' },
            values: {},
        });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };

    it('shows the true label, color, background and icon on its own view', () => {
        const active = render('details');
        expect(active).toContain('Seite aktiv');
        expect(active).toContain('#7c0409');
        expect(active).toContain('#eeeeee');
        expect(active).toContain('mdi-lightbulb"');
    });

    it('stays inactive on any other view', () => {
        const inactive = render('overview');
        expect(inactive).toContain('>Seite<');
        expect(inactive).not.toContain('#7c0409');
        expect(inactive).toContain('mdi-lightbulb-outline');
    });
});

// The shadow is the only thing telling `raised` and `unelevated` apart, and VIS2 clips a widget at
// its box, so the elevated style needs room for it.
describe('raised button elevation', () => {
    const Button = createButtonClass(definition('state'));
    const render = (rxData: Record<string, unknown>): string => {
        const instance = fixture<{ state: unknown; renderWidgetBody: (props: unknown) => React.JSX.Element }>(
            new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } })),
        );
        instance.state = fixture<typeof instance.state>({ rxData, values: {} });
        return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<typeof instance.renderWidgetBody>[0]>({})));
    };

    it('elevates the raised style, with room for the shadow', () => {
        expect(render({ buttonStyle: 'raised' })).toContain('box-shadow:0 3px');
        expect(render({ buttonStyle: 'raised' })).toContain('padding:4px');
        expect(render({})).toContain('box-shadow:0 3px');
    });

    it('leaves every other style flat', () => {
        expect(render({ buttonStyle: 'unelevated' })).not.toContain('box-shadow:');
        expect(render({ buttonStyle: 'unelevated' })).toContain('padding:0');
        expect(render({ buttonStyle: 'text' })).not.toContain('box-shadow:');
        expect(render({ buttonStyle: 'outlined' })).not.toContain('box-shadow:');
    });
});
