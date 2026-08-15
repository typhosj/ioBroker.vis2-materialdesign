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
        open(select);
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
