import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignChartJson from './MaterialDesignChartJson';
import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';
import { MaterialDesignChartCanvas } from './MaterialDesignChartCanvas';

function fixture<T>(value: unknown): T { return value as T; }

type ChartProps = { data: unknown; options: Record<string, any>; type: string };

// Both widgets hand chart.js a plain options object and jsdom never draws the canvas, so the wiring
// is readable straight off the returned element tree — no canvas mock needed.
function findCanvas(node: React.ReactNode): ChartProps | undefined {
    if (!React.isValidElement(node)) return undefined;
    if (node.type === MaterialDesignChartCanvas) return node.props as ChartProps;
    for (const child of React.Children.toArray((node.props as { children?: React.ReactNode }).children)) {
        const found = findCanvas(child);
        if (found) return found;
    }
    return undefined;
}

function optionsOf<T extends { state: any; renderWidgetBody: (props: any) => React.JSX.Element }>(widget: T, rxData: Record<string, unknown>, values: Record<string, unknown> = {}): Record<string, any> {
    widget.state = fixture<T['state']>({ rxData, values });
    const props = findCanvas(widget.renderWidgetBody(fixture<Parameters<T['renderWidgetBody']>[0]>({})));
    if (!props) throw new Error('no chart canvas rendered');
    return props.options;
}

// tooltipConfig() has always read these; the JSON chart simply never declared the fields, so the
// editor could not reach them and "use theme" wrote into attributes that did not exist.
const JSON_SOURCE = JSON.stringify({ axisLabels: ['a', 'b'], graphs: [{ legendText: 'series', data: [1, 2] }] });

describe('JSON chart tooltip options', () => {
    const options = (rxData: Record<string, unknown>): Record<string, any> =>
        optionsOf(new MaterialDesignChartJson(fixture<ConstructorParameters<typeof MaterialDesignChartJson>[0]>({ context: {} })), { oid: 'j.0.v', ...rxData }, { 'j.0.v.val': JSON_SOURCE }).tooltips;

    it('passes the box geometry through', () => {
        const tips = options({
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
            xPadding: 10,
            yPadding: 6,
            titleMarginBottom: 3,
        });
    });

    it('passes the fonts through', () => {
        const tips = options({
            tooltipTitleFontFamily: 'Jura',
            tooltipTitleFontSize: 18,
            tooltipBodyFontFamily: 'Roboto Condensed',
            tooltipBodyFontSize: 13,
        });
        expect(tips).toMatchObject({
            titleFontFamily: 'Jura',
            titleFontSize: 18,
            bodyFontFamily: 'Roboto Condensed',
            bodyFontSize: 13,
        });
    });

    // Untouched, the key stays out so chart.js keeps its own default; once the user has actually
    // ticked or unticked it, their choice wins in both directions.
    it('follows the colour box setting only once it is set', () => {
        expect(options({})).not.toHaveProperty('displayColors');
        expect(options({ tooltipShowColorBox: true }).displayColors).toBe(true);
        expect(options({ tooltipShowColorBox: false }).displayColors).toBe(false);
    });

    // Unset geometry has to stay absent rather than being written as 0, or chart.js draws a tooltip
    // with no padding and no caret instead of keeping its own defaults.
    it('leaves unset geometry out entirely', () => {
        const tips = options({});
        for (const key of ['caretSize', 'caretPadding', 'cornerRadius', 'xPadding', 'yPadding', 'titleMarginBottom']) {
            expect(tips, key).not.toHaveProperty(key);
        }
    });
});

// The time axis took a label colour but no font, while the chart's own y axis took both.
describe('line history x-axis label font', () => {
    const xAxis = (rxData: Record<string, unknown>): Record<string, any> =>
        optionsOf(new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: {} })), { dataCount: 1, ...rxData }).scales.xAxes[0];

    it('carries the configured font family and size into the ticks', () => {
        const ticks = xAxis({ xAxisValueFontFamily: 'Jura', xAxisValueFontSize: 15 }).ticks;
        expect(ticks.fontFamily).toBe('Jura');
        expect(ticks.fontSize).toBe(15);
    });

    it('keeps the chart.js default when neither is set', () => {
        const ticks = xAxis({}).ticks;
        expect(ticks).not.toHaveProperty('fontFamily');
        expect(ticks).not.toHaveProperty('fontSize');
    });

    it('still takes the label colour, which was the only thing it used to take', () => {
        expect(xAxis({ xAxisValueLabelColor: '#00696d' }).ticks.fontColor).toBe('#00696d');
    });
});
