import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { contrastRatio, m3OnColor, parseColor } from './widgetUtils';

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

    // An event's own background comes from the calendar source, so the M3 default text color (the
    // partner of primary-container) can land on anything — dark violet on a green holiday entry.
    it('derives readable event text from an event-supplied background in M3', () => {
        const widget = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>(props));
        const iso = new Date().toISOString().slice(0, 10);
        const events = JSON.stringify([{ name: 'Urlaub', start: `${iso}T09:00`, end: `${iso}T11:00`, color: '#2e7d32' }]);
        const render = (): string => renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>(props)));

        setData(widget, { calendarView: 'week', designStyle: 'material3', oid: 'test.0.events' }, { 'test.0.events.val': events });
        expect(render()).toContain('color:#ffffff');

        // An explicit text color always wins, and an event without its own background keeps the token.
        setData(widget, { calendarView: 'week', designStyle: 'material3', oid: 'test.0.events' }, { 'test.0.events.val': JSON.stringify([{ name: 'Urlaub', start: `${iso}T09:00`, end: `${iso}T11:00`, color: '#2e7d32', colorText: '#123456' }]) });
        expect(render()).toContain('color:#123456');
        setData(widget, { calendarView: 'week', designStyle: 'material3', oid: 'test.0.events' }, { 'test.0.events.val': JSON.stringify([{ name: 'Urlaub', start: `${iso}T09:00`, end: `${iso}T11:00` }]) });
        expect(render()).toContain('color:var(--md-sys-color-on-primary-container)');

        // Legacy keeps white on every event, parity-frozen.
        setData(widget, { calendarView: 'week', oid: 'test.0.events' }, { 'test.0.events.val': events });
        expect(render()).toContain('color:#fff');
    });

    // Day/week header and body are separate scroll-independent grids; without a reserved scrollbar
    // gutter in both, the body's day columns come out narrower than the header's and the two drift.
    it('reserves the same scrollbar gutter for the calendar header and body', () => {
        const widget = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>(props));
        setData(widget, { calendarView: 'week' }, {});
        const html = renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>(props)));
        expect(html.match(/scrollbar-gutter:stable/g)).toHaveLength(2);
    });

    // WCAG 2.5.8: the calendar day number and the list switch are the two M3 targets that fall under
    // 24 px on their own; both are grown in the M3 path only (legacy geometry is frozen by parity).
    it('keeps M3 day-number and list-switch targets at 24 px', () => {
        const calendar = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>(props));
        setData(calendar, { calendarView: 'month', designStyle: 'material3' }, {});
        const day = renderToStaticMarkup(calendar.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>(props)));
        expect(day).toContain('min-height:24px');
        setData(calendar, { calendarView: 'month' }, {});
        expect(renderToStaticMarkup(calendar.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>(props)))).not.toContain('min-height:24px');

        // The list row switch is the shared 52×32 M3 control (m3Switch), with the input stretched over
        // it — both the visual and the target come from that, no per-widget inset correction.
        const listProps = { id: 'list', context: { setValue: vi.fn() } };
        const list = new MaterialDesignList(fixture<ConstructorParameters<typeof MaterialDesignList>[0]>(listProps));
        setData(list, { countListItems: 1, designStyle: 'material3', listType: 'switch', label0: 'Lamp' });
        const m3List = renderToStaticMarkup(list.renderWidgetBody(fixture<Parameters<MaterialDesignList['renderWidgetBody']>[0]>(listProps)));
        expect(m3List).toContain('materialdesign-md3-switch');
        expect(m3List).toContain('height:32px');
        expect(m3List).toContain('width:52px');
        expect(m3List).toContain('width:100%;height:100%');

        // Icon List: clearing the icon-button background is the documented way to let M3 fill it in,
        // and it must not leave a saved (typically white) icon on a transparent button.
        const iconListProps = { id: 'iconlist', context: { setValue: vi.fn() } };
        const iconList = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>(iconListProps));
        setData(iconList, { countListItems: 1, designStyle: 'material3', listType0: 'buttonToggle', oid0: 'test.0.lamp', listImage0: 'lightbulb', listImageActiveColor0: '#ffffff' }, { 'test.0.lamp.val': true });
        const activeIcons = renderToStaticMarkup(iconList.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>(iconListProps)));
        expect(activeIcons).toContain('background:var(--md-sys-color-primary)');
        setData(iconList, { countListItems: 1, designStyle: 'material3', listType0: 'buttonToggle', oid0: 'test.0.lamp', listImage0: 'lightbulb' }, { 'test.0.lamp.val': false });
        expect(renderToStaticMarkup(iconList.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>(iconListProps)))).toContain('background:var(--md-sys-color-surface-container-high)');

        // Legacy keeps the 32×20 MDC geometry unchanged.
        setData(list, { countListItems: 1, listType: 'switch', label0: 'Lamp' });
        const legacyList = renderToStaticMarkup(list.renderWidgetBody(fixture<Parameters<MaterialDesignList['renderWidgetBody']>[0]>(listProps)));
        expect(legacyList).not.toContain('materialdesign-md3-switch');
        expect(legacyList).toContain('class="mdc-switch"');
    });
});

// WCAG 1.4.3 / 1.4.11 for the shipped M3 palette. The baseline scheme is Google's, but the pairs the
// widgets actually combine are ours, and an admin seed override can replace `primary` with anything.
describe('material 3 colour contrast', () => {
    const css = readFileSync('src-widgets-ts/src/material3-tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const roles = (block: string): Record<string, string> => Object.fromEntries([...block.matchAll(/--md-sys-color-([a-z-]+):\s*(#[0-9a-f]{6})/g)].map(match => [match[1], match[2]]));
    const [, lightBlock, darkBlock] = css.split('.materialdesign-widget.mdw-style-material3');
    const light = roles(lightBlock);
    const dark = { ...light, ...roles(darkBlock) };
    const ratio = (a: string, b: string): number => contrastRatio(parseColor(a)!, parseColor(b)!);
    const surfaces = ['surface', 'surface-container', 'surface-container-low', 'surface-container-high'];

    it.each([['light', light], ['dark', dark]] as const)('keeps text pairs above 4.5:1 (%s)', (_name, scheme) => {
        const pairs: [string, string][] = [['on-primary', 'primary'], ['on-primary-container', 'primary-container'], ['on-secondary-container', 'secondary-container'],
            ...surfaces.flatMap(surface => (['on-surface', 'on-surface-variant', 'primary', 'error'] as const).map(role => [role, surface] as [string, string]))];
        expect(pairs.filter(([front, back]) => ratio(scheme[front], scheme[back]) < 4.5).map(([front, back]) => `${front} on ${back}`)).toEqual([]);
    });

    it.each([['light', light], ['dark', dark]] as const)('keeps the outline above 3:1 on every surface (%s)', (_name, scheme) => {
        surfaces.forEach(surface => expect(ratio(scheme.outline, scheme[surface])).toBeGreaterThanOrEqual(3));
    });

    it('repairs the on-colour when an admin seed overrides primary', () => {
        expect(m3OnColor('#ffee00')).toBe('#1d1b20'); // light seed: white label would be ~1.1:1
        expect(m3OnColor('#6750a4')).toBe('#ffffff');
        expect(m3OnColor('rgb(255, 238, 0)')).toBe('#1d1b20');
        expect(m3OnColor('rebeccapurple')).toBeUndefined(); // unparseable: keep the baseline pair
        [...'#ffee00 #6750a4 #b3261e #003366'.split(' ')].forEach(seed => expect(contrastRatio(parseColor(seed)!, parseColor(m3OnColor(seed)!)!)).toBeGreaterThanOrEqual(4.5));
    });
});
