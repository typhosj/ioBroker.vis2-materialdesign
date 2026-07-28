import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { M3_TOKEN_ROLES, contrastRatio, m3OnColor, parseColor } from './widgetUtils';

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
    // The admin-overridable roles read through `var(--mdw-seed-<role>, <baseline>)`; the baseline
    // inside that fallback is what ships when nothing is overridden, so it is what gets checked.
    const roles = (block: string): Record<string, string> => Object.fromEntries([...block.matchAll(/--md-sys-color-([a-z-]+):\s*(?:var\(--mdw-seed-[a-z-]+,\s*)?(#[0-9a-f]{6})/g)].map(match => [match[1], match[2]]));
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

    // Regression guard: a plain `--md-sys-color-primary: #6750a4` here is declared ON the widget
    // root and beats the `--mdw-seed-*` layer applyM3SeedVariables() writes to <html>, so a derived
    // scheme would silently do nothing again. Every role needs it, not just the four that used to be
    // individually overridable — a scheme that reached half its roles is worse than none.
    it('keeps every colour role behind its --mdw-seed-* fallback, light and dark', () => {
        [lightBlock, darkBlock].forEach((block, index) => {
            const suffix = index ? '-dark' : '';
            M3_TOKEN_ROLES.forEach(role => {
                expect(block).toContain(`--md-sys-color-${role}: var(--mdw-seed-${role}${suffix},`);
            });
        });
        expect(lightBlock).toContain('font-family: var(--mdw-seed-font, inherit)');
        // Button labels read the type-scale token instead of the root rule, so it needs the same
        // fallback — with `Roboto, sans-serif` they stayed on Roboto after the admin font was cleared
        // while every other text in the widget went back to the view font.
        expect(lightBlock).toContain('--md-sys-typescale-label-large-font: var(--mdw-seed-font, inherit)');
    });

    // The scheme supplies its own `on-*` roles, so this is no longer about seeds — it is the
    // foreground picker for colours the USER chose (calendar event colours, chart data labels),
    // which no palette can pair for us.
    it('picks a legible foreground for an arbitrary user colour', () => {
        expect(m3OnColor('#ffee00')).toBe('#1d1b20'); // light background: white label would be ~1.1:1
        expect(m3OnColor('#6750a4')).toBe('#ffffff');
        expect(m3OnColor('rgb(255, 238, 0)')).toBe('#1d1b20');
        expect(m3OnColor('rebeccapurple')).toBeUndefined(); // unparseable: leave the caller's fallback
        [...'#ffee00 #6750a4 #b3261e #003366'.split(' ')].forEach(colour => expect(contrastRatio(parseColor(colour)!, parseColor(m3OnColor(colour)!)!)).toBeGreaterThanOrEqual(4.5));
    });
});

// Phase 9.2/9.5: the type scale is spec data, so it is checked against the spec rather than eyeballed
// once. Google's published values are in dp; the tokens are in rem so a project that scales the view
// font scales with it, hence the ×16 on the root font size the browser default gives us.
describe('material 3 type scale', () => {
    const tokens = readFileSync('src-widgets-ts/src/material3-tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const components = readFileSync('src-widgets-ts/src/material3-components.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const declared = Object.fromEntries([...tokens.matchAll(/--md-sys-typescale-([a-z-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
    // size / line-height / weight / tracking, exactly as published (dp, dp, ‑, dp).
    const published: Record<string, [number, number, number, number]> = {
        'headline-small': [24, 32, 400, 0],
        'title-large': [22, 28, 400, 0],
        'title-small': [14, 20, 500, .1],
        'body-large': [16, 24, 400, .5],
        'body-medium': [14, 20, 400, .25],
        'body-small': [12, 16, 400, .4],
        'label-large': [14, 20, 500, .1],
    };
    // Material 3 Expressive, static half: same size/line-height/tracking as the baseline role, one
    // weight step up (regular -> medium, medium -> bold), so only the weight is a token of its own.
    const emphasized: Record<string, number> = { 'headline-small': 500, 'title-large': 500, 'title-small': 700 };
    const px = (value: string): number => (value.endsWith('rem') ? parseFloat(value) * 16 : parseFloat(value));

    it.each(Object.entries(published))('matches the published values for %s', (role, [size, lineHeight, weight, tracking]) => {
        expect(px(declared[`${role}-size`])).toBeCloseTo(size, 5);
        expect(px(declared[`${role}-line-height`])).toBeCloseTo(lineHeight, 5);
        expect(Number(declared[`${role}-weight`])).toBe(weight);
        // Tracking is published in dp but expressed in em (dp ÷ the role's own size), which is what
        // keeps it proportional when the user scales the font.
        expect(px(declared[`${role}-tracking`]) * px(declared[`${role}-size`])).toBeCloseTo(tracking, 5);
    });

    // Both directions of the "only tokens with a consumer" rule in the tokens-file header: a role
    // nobody carries is dead weight in every M3 project, and a carrier reading a role nobody declares
    // renders at the inherited size while looking, in the diff, exactly like it works.
    it.each(Object.entries(emphasized))('carries the emphasized weight of %s', (role, weight) => {
        expect(Number(declared[`${role}-emphasized-weight`])).toBe(weight);
        // One step up from the baseline is the whole rule; equal weights would mean the token is a
        // no-op that nobody notices until someone wonders why "emphasized" looks like body text.
        expect(weight).toBeGreaterThan(Number(declared[`${role}-weight`]));
    });

    it('declares exactly the roles the components stylesheet carries', () => {
        const all = [...Object.keys(published), ...Object.keys(emphasized).map(role => `${role}-emphasized`)].sort();
        const carried = new Set([...components.matchAll(/var\(--md-sys-typescale-([a-z-]+)-(?:size|line-height|weight|tracking|font)\)/g)].map(match => match[1]));
        expect([...carried].sort()).toEqual(all);
        const declaredRoles = new Set(Object.keys(declared).map(name => name.replace(/-(?:size|line-height|weight|tracking|font)$/, '')));
        expect([...declaredRoles].sort()).toEqual(all);
    });

    // Motion is opt-out, not opt-in: every duration token has to collapse under reduced motion, or
    // the one that does not is the one nobody notices until it moves on a machine that asked it not to.
    it('collapses every motion duration under prefers-reduced-motion', () => {
        const [base, reduced = ''] = tokens.split('@media (prefers-reduced-motion: reduce)');
        const names = (css: string): string[] => [...new Set([...css.matchAll(/--md-sys-motion-duration-([a-z0-9]+):/g)].map(match => match[1]))].sort();
        expect(names(base)).not.toEqual([]);
        expect(names(reduced)).toEqual(names(base));
        expect([...reduced.matchAll(/--md-sys-motion-duration-[a-z0-9]+:([^;]+);/g)].map(match => match[1].trim())).toEqual(names(base).map(() => '0ms'));
    });

    // Shape and the internal component dimensions (Phase 9.2 slice 2). The outer size of a widget is
    // the vis-2 widget box, never CSS, so the spec's button/text-field heights are not checked here —
    // only the geometry a widget owns inside itself.
    it('matches the published shape scale', () => {
        expect(Object.fromEntries([...tokens.matchAll(/--md-sys-shape-corner-([a-z-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()])))
            .toEqual({ 'extra-small': '4px', medium: '12px', 'extra-large': '28px', full: '9999px' });
    });

    it.each([
        ['.materialdesign-list .mdc-list-item', 'min-height: var(--materialdesign-list-item-height, 56px)'],
        ['.mdc-data-table__header-row', 'height: 56px'],
        ['.mdc-data-table__row', 'height: 52px'],
        ['.mdc-card', 'border-radius: var(--md-sys-shape-corner-medium)'],
    ])('gives %s its M3 geometry', (selector, declaration) => {
        const rule = components.split('}').find(block => block.includes(selector) && block.includes(declaration));
        // The M3 rules have to stay scoped: a legacy project must not pick up any of this.
        expect(rule).toMatch(/\.materialdesign-widget\.mdw-style-material3/);
    });

    // The dialog surface is inline-styled, so its corner and headline can only be seen on the markup.
    it('gives the dialog surface the 28px corner and the headline role', () => {
        const widget = new MaterialDesignDialogView(fixture<ConstructorParameters<typeof MaterialDesignDialogView>[0]>(props));
        const open = (rxData: Record<string, unknown>): string => {
            setData(widget, { showDialogMethod: 'datapoint', showDialogOid: 'test.0.dialog', title: 'Details', ...rxData }, { 'test.0.dialog.val': true });
            return renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignDialogView['renderWidgetBody']>[0]>(props)));
        };
        const m3 = open({ designStyle: 'material3' });
        expect(m3).toContain('border-radius:var(--md-sys-shape-corner-extra-large)');
        expect(m3).toContain('mdw-md3-dialog-headline');
        // No inline size/weight/uppercase left to beat the stylesheet — that was the whole point.
        expect(m3).not.toContain('text-transform:uppercase');
        expect(m3).not.toContain('font-size:16px');
        // A saved size still wins, and legacy is untouched.
        expect(open({ designStyle: 'material3', titleFontSize: 21 })).toContain('font-size:21px');
        expect(open({})).toContain('text-transform:uppercase');
        expect(open({})).toContain('border-radius:4px');
    });
});
