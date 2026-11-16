import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignSelect from './MaterialDesignSelect';

function fixture<T>(value: unknown): T { return value as T; }

function findElement(
    node: React.ReactNode,
    predicate: (element: React.ReactElement<Record<string, unknown>>) => boolean,
): React.ReactElement<Record<string, unknown>> | undefined {
    if (Array.isArray(node)) return node.map(child => findElement(child, predicate)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const element = node as React.ReactElement<Record<string, unknown>>;
    if (predicate(element)) return element;
    return findElement(element.props.children as React.ReactNode, predicate);
}

function open(select: MaterialDesignSelect): React.ReactNode {
    const tree = select.renderWidgetBody(fixture<Parameters<MaterialDesignSelect['renderWidgetBody']>[0]>({}));
    const field = findElement(tree, element => element.type === 'button');
    if (field?.props['aria-expanded'] === false) (field.props.onClick as () => void)();
    return select.renderWidgetBody(fixture<Parameters<MaterialDesignSelect['renderWidgetBody']>[0]>({}));
}

describe('select data sources and writes', () => {
    it('renders valid JSON items and safely ignores malformed JSON', () => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        select.state = fixture<typeof select.state>({
            rxData: { listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' },
            values: {},
        });
        expect(renderToStaticMarkup(open(select))).toContain('One');

        select.state = fixture<typeof select.state>({ rxData: { listDataMethod: 'jsonStringObject', jsonStringObject: '{broken' }, values: {} });
        expect(renderToStaticMarkup(open(select))).not.toContain('One');
    });

    it('reads value-list and object-state labels', async () => {
        const getObject = vi.fn().mockResolvedValue({ common: { states: { off: 'Off', on: 'On' } } });
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({
            context: { socket: { getObject } },
        }));
        select.state = fixture<typeof select.state>({
            rxData: { oid: 'test.0.mode', listDataMethod: 'multistatesObject' },
            values: {},
        });
        void open(select);
        await Promise.resolve();
        await Promise.resolve();
        expect(getObject).toHaveBeenCalledWith('test.0.mode');
        const statesHtml = renderToStaticMarkup(open(select));
        expect(statesHtml).toContain('Off');
        expect(statesHtml).toContain('On');

        select.state = fixture<typeof select.state>({
            rxData: { listDataMethod: 'valueList', valueList: '1;2', valueListLabels: 'One;Two' },
            values: {},
        });
        const valueListHtml = renderToStaticMarkup(open(select));
        expect(valueListHtml).toContain('One');
        expect(valueListHtml).toContain('Two');
    });

    it('takes editor entries that only got a label, and renders exactly the count', () => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        select.state = fixture<typeof select.state>({
            rxData: {
                countSelectItems: 3,
                label0: 'Living room',
                value0: null,
                value1: 'kitchen',
                label1: 'Kitchen',
                label2: 'Bath',
                value2: null,
                // The group past the count is the add bar, so nothing here may reach the list.
                label3: 'Attic',
                value3: 'attic',
            },
            values: {},
        });
        const html = renderToStaticMarkup(open(select));
        expect(html).toContain('Living room');
        expect(html).toContain('Kitchen');
        expect(html).toContain('Bath');
        expect(html).not.toContain('Attic');
        expect(html.match(/materialdesign-v-list-item-title/g)).toHaveLength(3);
    });

    it('autocomplete commits a matching item or a free write-mode value', () => {
        const setValue = vi.fn();
        const autocomplete = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue } }));
        autocomplete.state = fixture<typeof autocomplete.state>({
            rxData: {
                oid: 'test.0.choice',
                listDataMethod: 'valueList',
                valueList: '1;2',
                valueListLabels: 'One;Two',
                inputMode: 'select',
            },
            values: {},
        });

        let input = findElement(autocomplete.renderWidgetBody(fixture<Parameters<MaterialDesignAutocomplete['renderWidgetBody']>[0]>({})), element => element.type === 'input');
        (input?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'Tw' } });
        (input?.props.onKeyDown as (event: { key: string }) => void)({ key: 'Enter' });
        expect(setValue).toHaveBeenCalledWith('test.0.choice', '2');

        autocomplete.state = fixture<typeof autocomplete.state>({
            rxData: {
                oid: 'test.0.choice',
                listDataMethod: 'valueList',
                valueList: '1;2',
                valueListLabels: 'One;Two',
                inputMode: 'write',
            },
            values: {},
        });
        input = findElement(autocomplete.renderWidgetBody(fixture<Parameters<MaterialDesignAutocomplete['renderWidgetBody']>[0]>({})), element => element.type === 'input');
        (input?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'custom' } });
        (input?.props.onKeyDown as (event: { key: string }) => void)({ key: 'Enter' });
        expect(setValue).toHaveBeenLastCalledWith('test.0.choice', 'custom');
    });
});

describe('autocomplete write mode and keyboard', () => {
    type Element = React.ReactElement<Record<string, unknown>>;
    const renderProps = fixture<Parameters<MaterialDesignAutocomplete['renderWidgetBody']>[0]>({});

    function make(rxData: Record<string, unknown> = {}, value?: ioBroker.StateValue): { widget: MaterialDesignAutocomplete; setValue: ReturnType<typeof vi.fn> } {
        const setValue = vi.fn();
        const widget = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue }, id: 'w0001' }));
        widget.state = fixture<typeof widget.state>({
            rxData: {
                oid: 'test.0.choice',
                listDataMethod: 'valueList',
                valueList: '1;2;w',
                valueListLabels: 'One;Two;Wohnzimmer',
                inputMode: 'write',
                ...rxData,
            },
            values: value === undefined ? {} : { 'test.0.choice.val': value },
        });
        return { widget, setValue };
    }
    const tree = (widget: MaterialDesignAutocomplete): React.ReactNode => widget.renderWidgetBody(renderProps);
    const input = (widget: MaterialDesignAutocomplete): Element => findElement(tree(widget), element => element.type === 'input')!;
    const listbox = (widget: MaterialDesignAutocomplete): Element | undefined => findElement(tree(widget), element => element.props.role === 'listbox');
    const call = (widget: MaterialDesignAutocomplete, handler: string, arg: unknown = {}): void => (input(widget).props[handler] as (event: unknown) => void)(arg);
    const type = (widget: MaterialDesignAutocomplete, text: string): void => call(widget, 'onChange', { target: { value: text } });
    const keys = (widget: MaterialDesignAutocomplete, key: string, extra: Record<string, unknown> = {}): ReturnType<typeof vi.fn> => {
        const preventDefault = vi.fn();
        call(widget, 'onKeyDown', { key, preventDefault, ...extra });
        return preventDefault;
    };
    const active = (widget: MaterialDesignAutocomplete): unknown => input(widget).props['aria-activedescendant'];

    it('shows a free state value in write mode and leaves it empty in select mode', () => {
        expect(input(make({}, 'Neu').widget).props.value).toBe('Neu');
        expect(input(make({ inputMode: 'select' }, 'Neu').widget).props.value).toBe('');
        expect(input(make({}, 2).widget).props.value).toBe('Two');
    });

    it('keeps the text on focus in write mode and empties it in select mode', () => {
        const write = make({}, 'Neu').widget;
        call(write, 'onFocus');
        expect(input(write).props.value).toBe('Neu');
        expect(listbox(write)).toBeDefined();
        expect(findElement(listbox(write), element => element.props.role === 'option')).toBeDefined();

        const select = make({ inputMode: 'select' }, 2).widget;
        call(select, 'onFocus');
        expect(input(select).props.value).toBe('');
    });

    it('writes on blur only what the user typed', () => {
        const untouched = make({}, 'Alt');
        call(untouched.widget, 'onFocus');
        call(untouched.widget, 'onBlur');
        expect(untouched.setValue).not.toHaveBeenCalled();

        const typed = make({}, 'Alt');
        call(typed.widget, 'onFocus');
        type(typed.widget, 'Neu');
        call(typed.widget, 'onBlur');
        expect(typed.setValue).toHaveBeenCalledWith('test.0.choice', 'Neu');
        expect(listbox(typed.widget)).toBeUndefined();

        const emptied = make({}, 'Alt');
        call(emptied.widget, 'onFocus');
        type(emptied.widget, '');
        call(emptied.widget, 'onBlur');
        expect(emptied.setValue).toHaveBeenCalledWith('test.0.choice', '');

        const exact = make({}, 'Alt');
        call(exact.widget, 'onFocus');
        type(exact.widget, 'two');
        call(exact.widget, 'onBlur');
        expect(exact.setValue).toHaveBeenCalledWith('test.0.choice', '2');
    });

    it('writes nothing on blur in select mode', () => {
        const { widget, setValue } = make({ inputMode: 'select' });
        call(widget, 'onFocus');
        type(widget, 'Neu');
        call(widget, 'onBlur');
        expect(setValue).not.toHaveBeenCalled();
        expect(input(widget).props.value).toBe('');
    });

    it('writes exactly the typed text on Enter in write mode', () => {
        const partial = make();
        call(partial.widget, 'onFocus');
        type(partial.widget, 'Wo');
        keys(partial.widget, 'Enter');
        expect(partial.setValue).toHaveBeenCalledWith('test.0.choice', 'Wo');
        expect(input(partial.widget).props.value).toBe('Wo');

        const untouched = make({}, 'Alt');
        call(untouched.widget, 'onFocus');
        keys(untouched.widget, 'Enter');
        expect(untouched.setValue).not.toHaveBeenCalled();
    });

    it('moves one highlight with the arrow keys and wraps', () => {
        const { widget } = make();
        call(widget, 'onFocus');
        expect(keys(widget, 'ArrowDown')).toHaveBeenCalled();
        expect(active(widget)).toBe('w0001-option-0');
        keys(widget, 'ArrowDown');
        expect(active(widget)).toBe('w0001-option-1');
        keys(widget, 'ArrowUp');
        keys(widget, 'ArrowUp');
        expect(active(widget)).toBe('w0001-option-2');
        const field = input(widget);
        expect(field.props.role).toBe('combobox');
        expect(field.props['aria-autocomplete']).toBe('list');
        expect(field.props['aria-expanded']).toBe(true);
        expect(field.props['aria-controls']).toBe('w0001-list');
        expect(listbox(widget)?.props.id).toBe('w0001-list');
    });

    it('takes the highlight with Enter and with Tab', () => {
        const enter = make();
        call(enter.widget, 'onFocus');
        type(enter.widget, 'o');
        keys(enter.widget, 'ArrowDown');
        keys(enter.widget, 'ArrowDown');
        keys(enter.widget, 'Enter');
        expect(enter.setValue).toHaveBeenCalledWith('test.0.choice', '2');
        expect(listbox(enter.widget)).toBeUndefined();

        const tab = make();
        call(tab.widget, 'onFocus');
        keys(tab.widget, 'ArrowUp');
        expect(keys(tab.widget, 'Tab')).not.toHaveBeenCalled();
        expect(tab.setValue).toHaveBeenCalledWith('test.0.choice', 'w');
        call(tab.widget, 'onBlur');
        expect(tab.setValue).toHaveBeenCalledTimes(1);
    });

    it('clears the highlight when the user types or its item disappears', () => {
        const { widget } = make();
        call(widget, 'onFocus');
        keys(widget, 'ArrowDown');
        type(widget, 'Wohn');
        expect(active(widget)).toBeUndefined();
        keys(widget, 'ArrowDown');
        expect(active(widget)).toBe('w0001-option-0');
        // The highlighted item leaves the list without a keystroke, e.g. a new list from the state.
        widget.state = fixture<typeof widget.state>({ ...widget.state, rxData: { ...widget.state.rxData, valueList: '1;2', valueListLabels: 'One;Two' } });
        expect(active(widget)).toBeUndefined();
    });

    it('cancels with Escape and keeps the value', () => {
        const { widget, setValue } = make({}, 'Alt');
        call(widget, 'onFocus');
        type(widget, 'Neu');
        keys(widget, 'Escape');
        expect(listbox(widget)).toBeUndefined();
        expect(input(widget).props.value).toBe('Alt');
        call(widget, 'onBlur');
        expect(setValue).not.toHaveBeenCalled();
    });

    it('ignores Enter while an input method composes', () => {
        const { widget, setValue } = make();
        call(widget, 'onFocus');
        type(widget, 'Neu');
        keys(widget, 'Enter', { nativeEvent: { isComposing: true } });
        keys(widget, 'Enter', { keyCode: 229 });
        expect(setValue).not.toHaveBeenCalled();
    });

    it('opens the menu from autocompleteMinChars typed characters, or with an arrow key', () => {
        const { widget } = make({ autocompleteMinChars: 2 });
        call(widget, 'onFocus');
        expect(listbox(widget)).toBeUndefined();
        type(widget, 'o');
        expect(listbox(widget)).toBeUndefined();
        type(widget, 'On');
        expect(listbox(widget)).toBeDefined();

        const arrow = make({ autocompleteMinChars: 2 }, 'Alt').widget;
        call(arrow, 'onFocus');
        keys(arrow, 'ArrowDown');
        expect(listbox(arrow)).toBeDefined();

        const zero = make({ autocompleteMinChars: 0 }).widget;
        call(zero, 'onFocus');
        expect(listbox(zero)).toBeDefined();
    });

    it('hides the menu when nothing matches', () => {
        const { widget } = make();
        call(widget, 'onFocus');
        type(widget, 'xyz');
        expect(listbox(widget)).toBeUndefined();
        expect(input(widget).props['aria-expanded']).toBe(false);
    });

    it('keeps the focus in the input when an item is pressed', () => {
        const { widget, setValue } = make();
        call(widget, 'onFocus');
        const menu = listbox(widget)!;
        const preventDefault = vi.fn();
        (menu.props.onMouseDown as (event: unknown) => void)({ preventDefault });
        expect(preventDefault).toHaveBeenCalled();
        const option = findElement(menu, element => element.props.role === 'option')!;
        expect(option.props.tabIndex).toBe(-1);
        expect(option.props.id).toBe('w0001-option-0');
        (option.props.onClick as () => void)();
        expect(setValue).toHaveBeenCalledWith('test.0.choice', '1');
        expect(listbox(widget)).toBeUndefined();
    });

    it('leaves the Select items without combobox props', () => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {}, id: 'w0002' }));
        select.state = fixture<typeof select.state>({ rxData: { listDataMethod: 'valueList', valueList: '1', valueListLabels: 'One' }, values: {} });
        const item = findElement(open(select), element => element.type === 'button' && String(element.props.className).includes('v-list-item'))!;
        expect(item.props.tabIndex).toBeUndefined();
        expect(item.props.onMouseDown).toBeUndefined();
        expect(item.props.role).toBeUndefined();
        expect(findElement(open(select), element => element.props.role === 'listbox')).toBeUndefined();
    });
});

// The menu surface is inline-styled, so only the rendered markup can show it.
describe('select material 3 menu geometry', () => {
    const menu = (rxData: Record<string, unknown>): string => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        select.state = fixture<typeof select.state>({ rxData: { listDataMethod: 'valueList', valueList: '1', valueListLabels: 'One', ...rxData }, values: {} });
        return renderToStaticMarkup(open(select));
    };

    it('gives the dropdown the M3 menu surface and a 48px item', () => {
        const html = menu({ designStyle: 'material3' });
        expect(html).toContain('border-radius:var(--md-sys-shape-corner-extra-small)');
        expect(html).toContain('box-shadow:var(--md-sys-elevation-level2)');
        expect(html).toContain('min-height:48px');
    });

    it('keeps the legacy panel and honours a saved item height in both styles', () => {
        expect(menu({})).toContain('box-shadow:0 4px 6px rgba(32, 33, 36, 0.28)');
        expect(menu({})).toContain('min-height:40px');
        expect(menu({ designStyle: 'material3', listItemHeight: 64 })).toContain('min-height:64px');
    });
});

// The hint and counter options sat in the editor doing nothing until 0.4.
describe('hint and counter', () => {
    const render = (rxData: Record<string, unknown>): string => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        select.state = fixture<typeof select.state>({ rxData, values: {} });
        return renderToStaticMarkup(select.renderWidgetBody(fixture<Parameters<MaterialDesignSelect['renderWidgetBody']>[0]>({})));
    };
    const list = { listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"A"},{"value":2,"text":"B"},{"value":3,"text":"C"}]' };
    it('draws the hint, and the counter as the number of entries', () => {
        expect(render({ ...list, inputMessage: 'Raum wählen' })).toContain('Raum wählen');
        expect(render({ ...list, showInputCounter: true })).toContain('>3<');
    });
    it('hides a non-persistent hint while the list is closed', () => {
        expect(render({ ...list, inputMessage: 'Raum wählen', showInputMessageAlways: false })).not.toContain('Raum wählen');
    });
});
