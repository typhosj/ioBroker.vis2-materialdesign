import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignSelect from './MaterialDesignSelect';

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
    const tree = select.renderWidgetBody({} as never);
    const field = findElement(tree, element => element.type === 'button');
    if (field?.props['aria-expanded'] === false) (field.props.onClick as () => void)();
    return select.renderWidgetBody({} as never);
}

describe('select data sources and writes', () => {
    it('renders valid JSON items and safely ignores malformed JSON', () => {
        const select = new MaterialDesignSelect({ context: {} } as never);
        select.state = {
            rxData: { listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' },
            values: {},
        } as never;
        expect(renderToStaticMarkup(open(select))).toContain('One');

        select.state = { rxData: { listDataMethod: 'jsonStringObject', jsonStringObject: '{broken' }, values: {} } as never;
        expect(renderToStaticMarkup(open(select))).not.toContain('One');
    });

    it('reads value-list and object-state labels', () => {
        const select = new MaterialDesignSelect({
            context: { objects: { 'test.0.mode': { common: { states: { off: 'Off', on: 'On' } } } } },
        } as never);
        select.state = {
            rxData: { oid: 'test.0.mode', listDataMethod: 'multistatesObject' },
            values: {},
        } as never;
        const statesHtml = renderToStaticMarkup(open(select));
        expect(statesHtml).toContain('Off');
        expect(statesHtml).toContain('On');

        select.state = {
            rxData: { listDataMethod: 'valueList', valueList: '1;2', valueListLabels: 'One;Two' },
            values: {},
        } as never;
        const valueListHtml = renderToStaticMarkup(open(select));
        expect(valueListHtml).toContain('One');
        expect(valueListHtml).toContain('Two');
    });

    it('autocomplete commits a matching item or a free write-mode value', () => {
        const setValue = vi.fn();
        const autocomplete = new MaterialDesignAutocomplete({ context: { setValue } } as never);
        autocomplete.state = {
            rxData: {
                oid: 'test.0.choice',
                listDataMethod: 'valueList',
                valueList: '1;2',
                valueListLabels: 'One;Two',
                inputMode: 'select',
            },
            values: {},
        } as never;

        let input = findElement(autocomplete.renderWidgetBody({} as never), element => element.type === 'input');
        (input?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'Tw' } });
        (input?.props.onKeyDown as (event: { key: string }) => void)({ key: 'Enter' });
        expect(setValue).toHaveBeenCalledWith('test.0.choice', '2');

        autocomplete.state = {
            rxData: {
                oid: 'test.0.choice',
                listDataMethod: 'valueList',
                valueList: '1;2',
                valueListLabels: 'One;Two',
                inputMode: 'write',
            },
            values: {},
        } as never;
        input = findElement(autocomplete.renderWidgetBody({} as never), element => element.type === 'input');
        (input?.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: 'custom' } });
        (input?.props.onKeyDown as (event: { key: string }) => void)({ key: 'Enter' });
        expect(setValue).toHaveBeenLastCalledWith('test.0.choice', 'custom');
    });
});
