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

    it('reads value-list and object-state labels', () => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({
            context: { objects: { 'test.0.mode': { common: { states: { off: 'Off', on: 'On' } } } } },
        }));
        select.state = fixture<typeof select.state>({
            rxData: { oid: 'test.0.mode', listDataMethod: 'multistatesObject' },
            values: {},
        });
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
