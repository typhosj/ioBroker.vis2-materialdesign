import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignAlerts from './MaterialDesignAlerts';
import MaterialDesignCard from './MaterialDesignCard';
import MaterialDesignIconList from './MaterialDesignIconList';
import MaterialDesignList from './MaterialDesignList';
import MaterialDesignTable from './MaterialDesignTable';

function fixture<T>(value: unknown): T { return value as T; }

const props = { id: 'test', context: { setValue: vi.fn() } };
const widgetProps = fixture<ConstructorParameters<typeof MaterialDesignCard>[0]>(props);
const renderProps = fixture<Parameters<MaterialDesignCard['renderWidgetBody']>[0]>(props);

beforeEach(() => vi.clearAllMocks());

function setData(widget: { state: unknown }, rxData: Record<string, unknown>, values: Record<string, unknown> = {}): void {
    widget.state = { rxData, values };
}

function findByClass(node: React.ReactNode, className: string): React.ReactElement<Record<string, unknown>> | undefined {
    if (Array.isArray(node)) return node.map(child => findByClass(child, className)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const element = node as React.ReactElement<Record<string, unknown>>;
    if (typeof element.props.className === 'string' && element.props.className.split(' ').includes(className)) return element;
    return findByClass(element.props.children as React.ReactNode, className);
}

describe('widget accessibility', () => {
    it('gives interactive cards keyboard button semantics', () => {
        const widget = new MaterialDesignCard(widgetProps);
        setData(widget, { clickType: 'card', controlType: 'state', state_oid: 'test.0.action', state_value: 'true', title: 'Open details' });
        const tree = widget.renderWidgetBody(renderProps);
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('role="button"');
        expect(html).toContain('tabindex="0"');
        expect(html).toContain('aria-label="Open details"');
        const preventDefault = vi.fn();
        (findByClass(tree, 'materialdesign-html-card-container')?.props.onKeyDown as (event: unknown) => void)({ key: 'Enter', preventDefault });
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(props.context.setValue).toHaveBeenCalledWith('test.0.action', true);
    });

    it('names alert close buttons', () => {
        const widget = new MaterialDesignAlerts(widgetProps);
        setData(widget, { oid: 'test.0.alerts', showMaxAlerts: 1 }, { 'test.0.alerts.val': JSON.stringify([{ text: 'Warning' }]) });
        const html = renderToStaticMarkup(widget.renderWidgetBody(renderProps));
        expect(html).toContain('aria-label="Close alert"');
        expect(html).toContain('type="button"');
    });

    it('makes sortable table headers keyboard-focusable', () => {
        const widget = new MaterialDesignTable(widgetProps);
        setData(widget, { countCols: 0, dataJson: JSON.stringify([{ value: 1 }]), label0: 'Value' });
        const tree = widget.renderWidgetBody(renderProps);
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('aria-sort="none"');
        expect(html).toContain('tabindex="0"');
        const preventDefault = vi.fn();
        (findByClass(tree, 'mdc-data-table__header-cell')?.props.onKeyDown as (event: unknown) => void)({ key: ' ', preventDefault });
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(renderToStaticMarkup(widget.renderWidgetBody(renderProps))).toContain('aria-sort="ascending"');
    });

    it('exposes icon-list actions as keyboard buttons', () => {
        const changeView = vi.fn();
        const widget = fixture<{ actionProps: (...args: unknown[]) => Record<string, unknown> }>(new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: { changeView } })));
        const action = widget.actionProps({ listType: 'buttonNav', buttonNavView: 'details', text: 'Open view', readOnly: false }, 0, undefined, {});
        expect(action).toMatchObject({ 'aria-disabled': false, 'aria-label': 'Open view', role: 'button', tabIndex: 0 });
        (action.onKeyDown as (event: unknown) => void)({ key: 'Enter', preventDefault: vi.fn() });
        expect(changeView).toHaveBeenCalledWith('details');
    });

    it('gives actionable list rows keyboard button semantics', () => {
        const changeView = vi.fn();
        const listProps = { id: 'list', context: { changeView } };
        const widget = new MaterialDesignList(fixture<ConstructorParameters<typeof MaterialDesignList>[0]>(listProps));
        setData(widget, { countListItems: 1, label0: '<b>Open view</b>', listType: 'buttonNav', listTypeButtonNav0: 'details' });
        const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignList['renderWidgetBody']>[0]>(listProps));
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('aria-label="Open view"');
        expect(html).toContain('role="button"');
        expect(html).toContain('tabindex="0"');
        (findByClass(tree, 'mdc-list-item')?.props.onKeyDown as (event: unknown) => void)({ key: 'Enter', preventDefault: vi.fn() });
        expect(changeView).toHaveBeenCalledWith('details');
    });
});
