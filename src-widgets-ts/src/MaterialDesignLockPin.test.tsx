import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createButtonClass } from './MaterialDesignButtons';
import MaterialDesignIconList from './MaterialDesignIconList';
import { createToggleControlClass } from './MaterialDesignToggleControls';
import { resetPins } from './widgetLock';

function fixture<T>(value: unknown): T { return value as T; }
type El = React.ReactElement<Record<string, unknown>>;
function find(node: React.ReactNode, test: (el: El) => boolean): El | undefined {
    if (Array.isArray(node)) return node.map(child => find(child, test)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const el = node as El;
    return test(el) ? el : find(el.props.children as React.ReactNode, test);
}
const declaresPin = (widget: unknown): boolean => fixture<{ getWidgetInfo: () => { visAttrs: Array<{ fields: Array<{ name: string }> }> } }>(widget).getWidgetInfo().visAttrs.flatMap(group => group.fields).some(field => field.name === 'lockPin');
const isPad = (el: El) => typeof el.type === 'function' && (el.type as { name?: string }).name === 'PinPad';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { resetPins(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Checkbox / Switch with PIN', () => {
    const make = (rxData: Record<string, unknown>, editMode = false) => {
        const setValue = vi.fn();
        const vibrate = vi.fn();
        vi.stubGlobal('navigator', { ...navigator, vibrate });
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue }, editMode }));
        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.v', lockEnabled: true, ...rxData }, data: rxData, values: {} });
        const tree = () => control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({}));
        const click = () => fixture<React.ReactElement<{ onClick: () => void }>>(tree()).props.onClick();
        return { control, setValue, vibrate, tree, click };
    };

    it('a tap opens the PIN pad and writes nothing', () => {
        const w = make({ lockPin: '12' });
        w.click();
        expect(w.setValue).not.toHaveBeenCalled();
        expect(find(w.tree(), isPad)).toBeDefined();
    });

    it('the accepted PIN unlocks this and every widget with the same PIN', () => {
        const a = make({ lockPin: '12', autoLockAfter: 3 });
        const b = make({ lockPin: '12' });
        a.click();
        (find(a.tree(), isPad)!.props.onUnlock as (pin: string) => void)('12');
        expect(find(a.tree(), isPad)).toBeUndefined();
        a.click();
        b.click();
        expect(a.setValue).toHaveBeenCalledTimes(1);
        expect(b.setValue).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(3000);
        b.click();
        expect(b.setValue).toHaveBeenCalledTimes(1);
    });

    it('read-only wins: no pad, no unlock, no vibration', () => {
        const w = make({ lockPin: '12', readOnly: true });
        w.click();
        expect(find(w.tree(), isPad)).toBeUndefined();
        expect(w.vibrate).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('in the editor the PIN pad never opens', () => {
        const w = make({ lockPin: '12' }, true);
        w.click();
        expect(find(w.tree(), isPad)).toBeUndefined();
    });

    it('declares lockPin', () => {
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'checkbox' });
        expect(declaresPin(Control)).toBe(true);
    });
});

describe('Icon List with PIN', () => {
    it('a locked entry opens the PIN pad, and the PIN unlocks every locked entry', () => {
        const setValue = vi.fn();
        const list = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: { setValue } }));
        list.state = fixture<typeof list.state>({ rxData: { lockPin: '12' }, data: { lockPin: '12' }, values: {} });
        const api = fixture<{ actionProps: (item: Record<string, unknown>, index: number, current: unknown, data: Record<string, unknown>) => { onClick: () => void } }>(list);
        const entry = (index: number) => api.actionProps({ listType: 'buttonToggle', objectId: `test.0.v${index}`, lockEnabled: true }, index, false, { lockPin: '12', autoLockAfter: 3 });
        entry(0).onClick();
        expect(setValue).not.toHaveBeenCalled();
        const pad = find(list.renderWidgetBody(fixture<Parameters<typeof list.renderWidgetBody>[0]>({})), isPad)!;
        (pad.props.onUnlock as (pin: string) => void)('12');
        entry(0).onClick();
        entry(1).onClick();
        expect(setValue.mock.calls.map(call => call[0])).toEqual(['test.0.v0', 'test.0.v1']);
    });

    it('read-only wins: no pad, no timer, no write', () => {
        const setValue = vi.fn();
        const list = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: { setValue } }));
        list.state = fixture<typeof list.state>({ rxData: { lockPin: '12' }, data: { lockPin: '12' }, values: {} });
        const api = fixture<{ actionProps: (item: Record<string, unknown>, index: number, current: unknown, data: Record<string, unknown>) => { onClick: () => void } }>(list);
        api.actionProps({ listType: 'buttonToggle', objectId: 'test.0.v', lockEnabled: true, readOnly: true }, 0, false, { lockPin: '12' }).onClick();
        expect(setValue).not.toHaveBeenCalled();
        expect(find(list.renderWidgetBody(fixture<Parameters<typeof list.renderWidgetBody>[0]>({})), isPad)).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('declares lockPin', () => {
        expect(declaresPin(MaterialDesignIconList)).toBe(true);
    });
});

describe('Toggle button with PIN', () => {
    it('opens the pad, writes nothing, and acts after the PIN', () => {
        const setValue = vi.fn();
        const Button = createButtonClass({ id: 'test-toggle', name: 'toggle', kind: 'toggle', layout: 'default', label: 'toggle', icon: 'plus' });
        const button = new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue } }));
        const data = { oid: 'test.0.v', lockEnabled: true, lockPin: '12', autoLockAfter: 3 };
        button.state = fixture<typeof button.state>({ rxData: data, data, values: {} });
        const api = fixture<{ activate: (d: Record<string, unknown>, current: unknown) => void }>(button);
        api.activate(data, false);
        expect(setValue).not.toHaveBeenCalled();
        const pad = find(button.renderWidgetBody(fixture<Parameters<typeof button.renderWidgetBody>[0]>({})), isPad)!;
        (pad.props.onUnlock as (pin: string) => void)('12');
        api.activate(data, false);
        expect(setValue).toHaveBeenCalledWith('test.0.v', true);
    });

    it('read-only wins: no pad, no timer, no write', () => {
        const setValue = vi.fn();
        const Button = createButtonClass({ id: 'test-toggle-ro', name: 'toggle', kind: 'toggle', layout: 'default', label: 'toggle', icon: 'plus' });
        const button = new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue } }));
        const data = { oid: 'test.0.v', lockEnabled: true, lockPin: '12', readOnly: true };
        button.state = fixture<typeof button.state>({ rxData: data, data, values: {} });
        const api = fixture<{ activate: (d: Record<string, unknown>, current: unknown) => void; pushDown: (d: Record<string, unknown>) => void }>(button);
        api.activate(data, false);
        api.pushDown({ ...data, pushButton: true });
        expect(setValue).not.toHaveBeenCalled();
        expect(find(button.renderWidgetBody(fixture<Parameters<typeof button.renderWidgetBody>[0]>({})), isPad)).toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('read-only hides the lock icon on every widget with a lock', () => {
    const hasLockIcon = (tree: React.ReactNode) => find(tree, el => el.props['data-lock-icon'] !== undefined) !== undefined;

    it.each([[true, false], ['true', false], ['1', false], ['false', true], [undefined, true]])('Switch, readOnly %j -> icon %s', (readOnly, icon) => {
        const Control = createToggleControlClass({ id: 'test', name: 'Test', kind: 'switch' });
        const control = new Control(fixture<ConstructorParameters<typeof Control>[0]>({ context: { setValue: vi.fn() } }));
        control.state = fixture<typeof control.state>({ rxData: { oid: 'test.0.v', lockEnabled: true, readOnly }, data: {}, values: {} });
        expect(hasLockIcon(control.renderWidgetBody(fixture<Parameters<typeof control.renderWidgetBody>[0]>({})))).toBe(icon);
    });

    it.each([[true, false], ['true', false], ['false', true], [undefined, true]])('Toggle button, readOnly %j -> icon %s', (readOnly, icon) => {
        const Button = createButtonClass({ id: 'test-toggle-icon', name: 'toggle', kind: 'toggle', layout: 'default', label: 'toggle', icon: 'plus' });
        const button = new Button(fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: vi.fn() } }));
        button.state = fixture<typeof button.state>({ rxData: { oid: 'test.0.v', lockEnabled: true, readOnly }, data: {}, values: {} });
        expect(hasLockIcon(button.renderWidgetBody(fixture<Parameters<typeof button.renderWidgetBody>[0]>({})))).toBe(icon);
    });

    it.each([[true, false], [false, true]])('Icon List entry, readOnly %j -> icon %s', (readOnly, icon) => {
        const list = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: { setValue: vi.fn() } }));
        list.state = fixture<typeof list.state>({ rxData: { listItemDataMethod: 'inputPerEditor', countListItems: 1, listType0: 'buttonToggle', oid0: 'test.0.v', listImage0: 'lightbulb', lockEnabled0: true, readOnly0: readOnly }, data: {}, values: {} });
        expect(hasLockIcon(list.renderWidgetBody(fixture<Parameters<typeof list.renderWidgetBody>[0]>({})))).toBe(icon);
    });
});
