import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignAlerts from './MaterialDesignAlerts';
import MaterialDesignCalendar from './MaterialDesignCalendar';
import MaterialDesignCard from './MaterialDesignCard';
import MaterialDesignDialogView from './MaterialDesignDialogView';
import MaterialDesignRoundSlider from './MaterialDesignRoundSlider';
import MaterialDesignSlider from './MaterialDesignSlider';
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

    it('lets the slider thumb be operated from the keyboard', () => {
        const widget = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>(props));
        setData(widget, { oid: 'test.0.dimmer', min: 0, max: 100, step: 5 }, { 'test.0.dimmer.val': 40 });
        const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignSlider['renderWidgetBody']>[0]>(props));
        expect(renderToStaticMarkup(tree)).toContain('role="slider"');
        const event = { key: 'ArrowRight', preventDefault: vi.fn(), stopPropagation: vi.fn() };
        (findByClass(tree, 'v-slider__thumb-container')?.props.onKeyDown as (event: unknown) => void)(event);
        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(props.context.setValue).toHaveBeenCalledWith('test.0.dimmer', 45);
    });

    it('gives the round slider slider semantics and keyboard operation', () => {
        const widget = new MaterialDesignRoundSlider(fixture<ConstructorParameters<typeof MaterialDesignRoundSlider>[0]>(props));
        setData(widget, { oid: 'test.0.dimmer', min: 0, max: 100, step: 10 }, { 'test.0.dimmer.val': 30 });
        const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignRoundSlider['renderWidgetBody']>[0]>(props));
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('role="slider"');
        expect(html).toContain('aria-valuenow="30"');
        expect(html).toContain('tabindex="0"');
        const event = { key: 'End', preventDefault: vi.fn(), stopPropagation: vi.fn() };
        (findByClass(tree, 'materialdesign-round-slider-element')?.props.onKeyDown as (event: unknown) => void)(event);
        expect(props.context.setValue).toHaveBeenCalledWith('test.0.dimmer', 100);
    });

    it('exposes the widget dialog as a modal and closes it with Escape', () => {
        const widget = new MaterialDesignDialogView(fixture<ConstructorParameters<typeof MaterialDesignDialogView>[0]>(props));
        setData(widget, { showDialogMethod: 'datapoint', showDialogOid: 'test.0.dialog', title: '<b>Details</b>' }, { 'test.0.dialog.val': true });
        const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignDialogView['renderWidgetBody']>[0]>(props));
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-modal="true"');
        expect(html).toContain('aria-label="Details"');
        (findByClass(tree, 'v-dialog')?.props.onKeyDown as (event: unknown) => void)({ key: 'Escape', stopPropagation: vi.fn() });
        expect(props.context.setValue).toHaveBeenCalledWith('test.0.dialog', false);
    });

    it('marks the calendar today cell with more than colour', () => {
        const widget = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>(props));
        setData(widget, { calendarView: 'month' }, {});
        const html = renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>(props)));
        expect(html).toContain('aria-current="date"');
    });
});
