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
        call(widget, 'onKeyDown', { key, preventDefault, stopPropagation: vi.fn(), ...extra });
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

    it('keeps Escape from a surrounding dialog only while there is a menu or typed text to cancel', () => {
        const escape = (widget: MaterialDesignAutocomplete): ReturnType<typeof vi.fn> => {
            const stopPropagation = vi.fn();
            call(widget, 'onKeyDown', { key: 'Escape', preventDefault: vi.fn(), stopPropagation });
            return stopPropagation;
        };
        const menu = make().widget;
        call(menu, 'onFocus');
        expect(listbox(menu)).toBeDefined();
        expect(escape(menu)).toHaveBeenCalled();
        // Menu closed, nothing typed: the second Escape belongs to the dialog.
        expect(escape(menu)).not.toHaveBeenCalled();

        const typed = make({ autocompleteMinChars: 2 }, 'Alt').widget;
        call(typed, 'onFocus');
        type(typed, 'xyz');
        expect(listbox(typed)).toBeUndefined();
        expect(escape(typed)).toHaveBeenCalled();
        expect(input(typed).props.value).toBe('Alt');

        const untouched = make({ autocompleteMinChars: 2 }, 'Alt').widget;
        call(untouched, 'onFocus');
        expect(escape(untouched)).not.toHaveBeenCalled();
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

// The classic menu is 30 30 30 in the dark theme, so a 4 % black highlight was invisible.
describe('classic menu highlight colours', () => {
    function menu(themeType: string, rxData: Record<string, unknown> = {}): string {
        const widget = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn(), themeType }, id: 'w0001' }));
        widget.state = fixture<typeof widget.state>({
            rxData: { oid: 'test.0.choice', listDataMethod: 'valueList', valueList: '1;2;w', valueListLabels: 'One;Two;Wohnzimmer', inputMode: 'select', ...rxData },
            values: { 'test.0.choice.val': '2' },
        });
        const render = (): React.ReactNode => widget.renderWidgetBody(fixture<Parameters<MaterialDesignAutocomplete['renderWidgetBody']>[0]>({}));
        const input = (): React.ReactElement<Record<string, unknown>> => findElement(render(), element => element.type === 'input')!;
        (input().props.onFocus as () => void)();
        (input().props.onKeyDown as (event: unknown) => void)({ key: 'ArrowDown', preventDefault: vi.fn(), stopPropagation: vi.fn() });
        return renderToStaticMarkup(render());
    }
    const backgroundOf = (html: string, label: string): string => /background:([^;']*)/.exec(html.split('<button').find(part => part.includes(`>${label}<`)) ?? '')?.[1] ?? '';

    it.each([
        ['dark', 'rgba(255, 255, 255, 0.12)', 'rgba(68, 115, 158, 0.32)'],
        ['light', 'rgba(0, 0, 0, 0.08)', 'rgba(68, 115, 158, 0.12)'],
    ])('uses a visible highlight and selection in the %s theme', (themeType, hover, selected) => {
        const html = menu(themeType);
        expect(backgroundOf(html, 'One')).toBe(hover);
        expect(backgroundOf(html, 'Two')).toBe(selected);
    });

    it('lets an explicit hover colour win and leaves Material 3 on its tokens', () => {
        expect(backgroundOf(menu('dark', { listItemBackgroundHoverColor: '#123456' }), 'One')).toBe('#123456');
        expect(backgroundOf(menu('dark', { designStyle: 'material3' }), 'One')).toBe('var(--md-sys-color-surface-container-high)');
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

describe('menu above every container', () => {
    type Element = React.ReactElement<Record<string, unknown>>;
    interface Portal { children: React.ReactNode; containerInfo: unknown }
    const PORTAL = Symbol.for('react.portal');
    const renderProps = fixture<Parameters<MaterialDesignSelect['renderWidgetBody']>[0]>({});

    function findPortal(node: React.ReactNode): Portal | undefined {
        if (Array.isArray(node)) return node.map(findPortal).find(Boolean);
        if (node && typeof node === 'object' && (node as { $$typeof?: symbol }).$$typeof === PORTAL) return node as unknown as Portal;
        if (!React.isValidElement(node)) return undefined;
        return findPortal((node as Element).props.children as React.ReactNode);
    }

    /** A select whose root is "mounted" at the given place in a 768 px high window. */
    function mounted(rect: { left: number; top: number; width: number; height: number }, rxData: Record<string, unknown> = {}, Widget = MaterialDesignSelect) {
        const widget = new Widget(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: { setValue: vi.fn() }, id: 'w0002' }));
        widget.state = fixture<typeof widget.state>({
            rxData: { oid: 'test.0.choice', listDataMethod: 'valueList', valueList: '1;2;3', valueListLabels: 'One;Two;Three', ...rxData },
            values: {},
        });
        const root = document.createElement('div');
        root.getBoundingClientRect = () => fixture<DOMRect>({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top });
        document.body.appendChild(root);
        (widget as unknown as { rootRef: { current: HTMLDivElement } }).rootRef.current = root;
        return { widget, root };
    }
    const openSelect = (widget: MaterialDesignSelect): void => {
        const field = findElement(widget.renderWidgetBody(renderProps), element => element.type === 'button');
        (field?.props.onClick as () => void)();
    };
    const menuOf = (widget: MaterialDesignSelect): { portal: Portal | undefined; menu: Element | undefined } => {
        const portal = findPortal(widget.renderWidgetBody(renderProps));
        const menu = findElement(portal?.children, element => (typeof element.props.className === 'string' && element.props.className.includes('v-select-list')));
        return { portal, menu };
    };
    const style = (menu: Element | undefined): React.CSSProperties => (menu?.props.style ?? {});

    it('renders the open menu into the page body at fixed coordinates under the field', () => {
        const { widget } = mounted({ left: 20, top: 100, width: 400, height: 56 }, { designStyle: 'material3' });
        openSelect(widget);
        const { portal, menu } = menuOf(widget);
        expect(portal?.containerInfo).toBe(document.body);
        expect(style(menu)).toMatchObject({ position: 'fixed', left: 20, top: 160, minWidth: 400, maxHeight: 300 });
        expect(style(menu).bottom).toBeUndefined();
        // The M3 tokens are declared on `.materialdesign-widget.mdw-style-material3`, which the body lacks.
        expect(String(menu?.props.className)).toContain('materialdesign-widget mdw-style-material3');
    });

    it('takes the offset option, limits the height to the window and opens upwards in auto mode', () => {
        const flush = mounted({ left: 0, top: 100, width: 200, height: 40 }, { listPositionOffset: true });
        openSelect(flush.widget);
        expect(style(menuOf(flush.widget).menu).top).toBe(140);

        const low = mounted({ left: 0, top: 660, width: 200, height: 40 }, { listPosition: 'bottom' });
        openSelect(low.widget);
        // 768 - 700 - 4 gap - 8 margin = 56 px left below.
        expect(style(menuOf(low.widget).menu)).toMatchObject({ top: 704, maxHeight: 56 });

        const tiny = mounted({ left: 0, top: 740, width: 200, height: 20 }, { listPosition: 'bottom' });
        openSelect(tiny.widget);
        // Never smaller than one item.
        expect(style(menuOf(tiny.widget).menu).maxHeight).toBe(40);

        const auto = mounted({ left: 0, top: 660, width: 200, height: 40 }, { listPosition: 'auto' });
        openSelect(auto.widget);
        expect(style(menuOf(auto.widget).menu)).toMatchObject({ bottom: 768 - 660 + 4, maxHeight: 300 });
        expect(style(menuOf(auto.widget).menu).top).toBeUndefined();
    });

    it('carries the theme variables of the widget element into the portal', () => {
        const { widget } = mounted({ left: 0, top: 0, width: 200, height: 40 });
        const host = document.createElement('div');
        host.style.setProperty('--mdw-theme-colors-menu', '#123456');
        host.style.setProperty('color', 'red');
        (widget as unknown as { refService: { current: HTMLElement } }).refService = { current: host };
        openSelect(widget);
        const menuStyle = style(menuOf(widget).menu) as Record<string, unknown>;
        expect(menuStyle['--mdw-theme-colors-menu']).toBe('#123456');
        expect(menuStyle.color).toBeUndefined();
    });

    it('follows the field while open and stops listening once closed', () => {
        const { widget } = mounted({ left: 0, top: 0, width: 200, height: 40 });
        const update = vi.spyOn(widget, 'forceUpdate');
        openSelect(widget);
        widget.componentDidUpdate(widget.props, widget.state);
        update.mockClear();
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        expect(update).toHaveBeenCalledTimes(2);

        openSelect(widget);
        widget.componentDidUpdate(widget.props, widget.state);
        update.mockClear();
        window.dispatchEvent(new Event('scroll'));
        expect(update).not.toHaveBeenCalled();
    });

    it('closes the select on a press outside field and menu, not on one inside', () => {
        const { widget, root } = mounted({ left: 0, top: 0, width: 200, height: 40 });
        openSelect(widget);
        widget.componentDidUpdate(widget.props, widget.state);
        const menuElement = document.createElement('div');
        const item = document.createElement('button');
        menuElement.appendChild(item);
        (widget as unknown as { menuRef: HTMLDivElement }).menuRef = menuElement;
        document.body.appendChild(menuElement);

        item.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        root.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(menuOf(widget).menu).toBeDefined();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(menuOf(widget).menu).toBeUndefined();
        widget.componentWillUnmount();
    });

    it('leaves the autocomplete to its blur on a press outside', () => {
        const { widget } = mounted({ left: 0, top: 0, width: 200, height: 40 }, { inputMode: 'write' }, MaterialDesignAutocomplete);
        const input = findElement(widget.renderWidgetBody(renderProps), element => element.type === 'input');
        (input?.props.onFocus as () => void)();
        widget.componentDidUpdate(widget.props, widget.state);
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(menuOf(widget).menu).toBeDefined();
        widget.componentWillUnmount();
    });

    it('keeps the menu inline while the widget is not mounted', () => {
        const widget = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData: { listDataMethod: 'valueList', valueList: '1', valueListLabels: 'One' }, values: {} });
        openSelect(widget);
        const tree = widget.renderWidgetBody(renderProps);
        expect(findPortal(tree)).toBeUndefined();
        expect(style(findElement(tree, element => (typeof element.props.className === 'string' && element.props.className.includes('v-select-list'))))).toMatchObject({ position: 'absolute' });
    });
});
