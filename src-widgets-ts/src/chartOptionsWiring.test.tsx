import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import MaterialDesignChartBar from './MaterialDesignChartBar';
import MaterialDesignChartJson from './MaterialDesignChartJson';
import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';
import MaterialDesignChartPie from './MaterialDesignChartPie';
import { cssVariable, themeEntries, themeKeyDefaults, themeStateId } from './themeKeys';

function fixture<T>(value: unknown): T { return value as T; }

type ChartProps = { data: any; options: Record<string, any>; type: string };

// Chart widgets render one <ChartFrame config={…}/>; its config is exactly what reaches chart.js.
function configOf(widget: { state: any; renderWidgetBody: (props: any) => React.JSX.Element }, rxData: Record<string, unknown>, values: Record<string, unknown> = {}): ChartProps {
    widget.state = fixture({ rxData, values });
    const element = widget.renderWidgetBody(fixture({}));
    const config = (element.props as { config?: ChartProps }).config;
    if (!config) throw new Error('no chart config rendered');
    return config;
}

function optionsOf(widget: { state: any; renderWidgetBody: (props: any) => React.JSX.Element }, rxData: Record<string, unknown>, values: Record<string, unknown> = {}): Record<string, any> {
    return configOf(widget, rxData, values).options;
}

const JSON_SOURCE = JSON.stringify({ axisLabels: ['a', 'b'], graphs: [{ legendText: 'series', data: [1, 2] }] });

// tooltipConfig() has always read these; the JSON chart simply never declared the fields, so the
// editor could not reach them and "use theme" wrote into attributes that did not exist.
describe('JSON chart tooltip options', () => {
    const tooltip = (rxData: Record<string, unknown>): Record<string, any> =>
        optionsOf(new MaterialDesignChartJson(fixture<ConstructorParameters<typeof MaterialDesignChartJson>[0]>({ context: {} })), { oid: 'j.0.v', ...rxData }, { 'j.0.v.val': JSON_SOURCE }).plugins.tooltip;

    it('passes the box geometry through', () => {
        const tips = tooltip({
            tooltipArrowSize: 8,
            tooltipDistanceToBar: 12,
            tooltipBoxRadius: 4,
            tooltipXpadding: 10,
            tooltipYpadding: 6,
            tooltipTitleMarginBottom: 3,
        });
        expect(tips).toMatchObject({
            caretSize: 8,
            caretPadding: 12,
            cornerRadius: 4,
            padding: { x: 10, y: 6 },
            titleMarginBottom: 3,
        });
    });

    it('passes the fonts through', () => {
        const tips = tooltip({
            tooltipTitleFontFamily: 'Jura',
            tooltipTitleFontSize: 18,
            tooltipBodyFontFamily: 'Roboto Condensed',
            tooltipBodyFontSize: 13,
        });
        expect(tips.titleFont).toMatchObject({ family: 'Jura', size: 18 });
        expect(tips.bodyFont).toMatchObject({ family: 'Roboto Condensed', size: 13 });
    });

    // Untouched, the key stays out so chart.js keeps its own default; once the user has actually
    // ticked or unticked it, their choice wins in both directions.
    it('follows the colour box setting only once it is set', () => {
        expect(tooltip({})).not.toHaveProperty('displayColors');
        expect(tooltip({ tooltipShowColorBox: true }).displayColors).toBe(true);
        expect(tooltip({ tooltipShowColorBox: false }).displayColors).toBe(false);
    });

    // Unset geometry has to stay absent rather than being written as 0, or chart.js draws a tooltip
    // with no padding and no caret instead of keeping its own defaults.
    it('leaves unset geometry out entirely', () => {
        const tips = tooltip({});
        for (const key of ['caretSize', 'caretPadding', 'cornerRadius', 'padding', 'titleMarginBottom']) {
            expect(tips, key).not.toHaveProperty(key);
        }
    });
});

// The time axis took a label colour but no font, while the chart's own y axis took both.
describe('line history x-axis label font', () => {
    const xAxis = (rxData: Record<string, unknown>): Record<string, any> =>
        optionsOf(new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: {} })), { dataCount: 1, ...rxData }).scales.x;

    it('carries the configured font family and size into the ticks', () => {
        expect(xAxis({ xAxisValueFontFamily: 'Jura', xAxisValueFontSize: 15 }).ticks.font).toMatchObject({ family: 'Jura', size: 15 });
    });

    it('keeps the chart.js default when neither is set', () => {
        expect(xAxis({}).ticks).not.toHaveProperty('font');
    });

    it('still takes the label colour, which was the only thing it used to take', () => {
        expect(xAxis({ xAxisValueLabelColor: '#00696d' }).ticks.color).toBe('#00696d');
    });
});

// "Use theme" writes `var(--materialdesign-widget-theme-…)` into every color, font and font-size
// field, and the project migration does the same. chart.js paints on a canvas, which reads no CSS
// variables: a var() fill turned into black and a var() font family into 10px sans-serif.
describe('themed chart fields reach chart.js as real values', () => {
    const themed = (widgetName: string, extra: Record<string, unknown>): { rxData: Record<string, unknown>; values: Record<string, unknown> } => {
        const rxData: Record<string, unknown> = { ...extra, ...themeKeyDefaults(widgetName) };
        const values: Record<string, unknown> = {};
        themeEntries(widgetName).forEach(({ type, entry }) => {
            rxData[entry.desc] = `var(${cssVariable(type, entry.id)})`;
            values[`${themeStateId(type, entry.id)}.val`] = type === 'colors' ? '#123456' : type === 'fonts' ? 'Jura' : 17;
        });
        return { rxData, values };
    };
    const rendered = (widget: { state: any; renderWidgetBody: (props: any) => React.JSX.Element }, rxData: Record<string, unknown>, values: Record<string, unknown>): ChartProps => configOf(widget, rxData, values);
    const cases: Array<[string, () => { state: any; renderWidgetBody: (props: any) => React.JSX.Element }, Record<string, unknown>, Record<string, unknown>]> = [
        ['Bar Chart', () => new MaterialDesignChartBar(fixture({ context: {} })), { dataCount: 1, oid0: 'b.0.v' }, { 'b.0.v.val': 5 }],
        ['Pie Chart', () => new MaterialDesignChartPie(fixture({ context: {} })), { dataCount: 1, oid0: 'p.0.v' }, { 'p.0.v.val': 5 }],
        ['JSON Chart', () => new MaterialDesignChartJson(fixture({ context: {} })), { oid: 'j.0.v' }, { 'j.0.v.val': JSON_SOURCE }],
        ['Line History Chart', () => new MaterialDesignChartLineHistory(fixture({ context: {} })), { dataCount: 1, oid0: 'l.0.v' }, {}],
    ];

    it.each(cases)('%s hands chart.js no var() at all', (name, create, extra, values) => {
        const theme = themed(name, extra);
        const props = rendered(create(), theme.rxData, { ...values, ...theme.values });
        expect(JSON.stringify(props)).not.toContain('var(--');
    });

    it('Bar Chart paints the plot area and the bars in the theme color', () => {
        const theme = themed('Bar Chart', { dataCount: 1, oid0: 'b.0.v' });
        const props = rendered(new MaterialDesignChartBar(fixture({ context: {} })), theme.rxData, { 'b.0.v.val': 5, ...theme.values }) as ChartProps & { data: { datasets: Array<{ backgroundColor: unknown }> } };
        expect(props.options.plugins.mdwChartArea.color).toBe('#123456');
        expect(props.data.datasets[0].backgroundColor).toEqual(['#123456']);
    });
});

// The whole path, widget state to markup, for each of the four charts.
describe('rendered chart markup', () => {
    type Created = { state: any; renderWidgetBody: (props: any) => React.JSX.Element };
    const cases: Array<[string, (context: object) => Created, Record<string, unknown>, Record<string, unknown>, boolean]> = [
        ['Bar Chart', context => new MaterialDesignChartBar(fixture({ context })), { dataCount: 1, oid0: 'b.0.v', label0: 'Room A' }, { 'b.0.v.val': 5 }, true],
        ['Pie Chart', context => new MaterialDesignChartPie(fixture({ context })), { dataCount: 1, oid0: 'p.0.v', label0: 'Room A' }, { 'p.0.v.val': 5 }, true],
        ['JSON Chart', context => new MaterialDesignChartJson(fixture({ context })), { oid: 'j.0.v' }, { 'j.0.v.val': JSON_SOURCE }, false],
        ['Line History Chart', context => new MaterialDesignChartLineHistory(fixture({ context })), { dataCount: 1, oid0: 'l.0.v' }, {}, false],
    ];
    const html = (create: (context: object) => Created, rxData: Record<string, unknown>, values: Record<string, unknown>, context: object = {}): string => {
        const widget = create(context);
        widget.state = fixture({ rxData, values });
        return renderToStaticMarkup(widget.renderWidgetBody({}));
    };

    it.each(cases)('%s renders a canvas in a card', (_name, create, extra, values, labelled) => {
        const markup = html(create, { ...extra, cardUse: true, showLegend: true }, values);
        expect(markup).toContain('<canvas');
        expect(markup).toContain('mdc-card');
        if (labelled) expect(markup).toContain('Room A');
    });

    it.each(cases)('%s renders on the Material 3 surface in the dark theme', (_name, create, extra, values) => {
        // The dark flag is the base class's own reading of the host theme, not a stubbed method.
        const markup = html(create, { ...extra, designStyle: 'material3', cardUse: true }, values, { themeType: 'dark' });
        expect(markup).toContain('<canvas');
        expect(markup).toContain('mdw-dark');
        expect(markup).toContain('var(--md-sys-color-surface)');
    });
});
