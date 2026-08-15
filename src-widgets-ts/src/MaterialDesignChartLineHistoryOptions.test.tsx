import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';

function fixture<T>(value: unknown): T { return value as T; }

type Dataset = { backgroundColor?: unknown; borderColor?: unknown; pointBackgroundColor?: unknown; fill?: unknown };
type Canvas = { props: { data: { datasets: Dataset[] }; options: { plugins: Record<string, Record<string, unknown>> } } };

function chart(rxData: Record<string, unknown>): Canvas['props'] {
    const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values: {} });
    (widget as unknown as { series: unknown[] }).series = [{ oid: 'temp.oid', points: [{ ts: 1, val: 20 }, { ts: 2, val: 21 }] }];
    const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignChartLineHistory['renderWidgetBody']>[0]>({}));
    let found: Canvas['props'] | undefined;
    const walk = (node: React.ReactNode): void => {
        if (Array.isArray(node)) { node.forEach(walk); return; }
        if (!React.isValidElement(node)) return;
        const element = node as React.ReactElement<Record<string, unknown>>;
        if (element.props.data && element.props.options) found = element.props as unknown as Canvas['props'];
        walk(element.props.children as React.ReactNode);
    };
    walk(tree);
    if (!found) throw new Error('no chart canvas rendered');
    return found;
}

describe('line history chart options that reach chart.js', () => {
    it('fills under the line from the line color, not from the point color', () => {
        const [dataset] = chart({ dataCount: 1, oid: 'temp.oid', useFillColor: true, pointColor: '#ff0000' }).data.datasets;
        expect(dataset.borderColor).toBe('#44739e');
        expect(dataset.backgroundColor).toBe('#44739e33');
        expect(dataset.pointBackgroundColor).toBe('#ff0000');
    });

    it('keeps the points on the line color instead of the translucent fill', () => {
        const [dataset] = chart({ dataCount: 1, oid: 'temp.oid', useFillColor: true, dataColor: '#00aa00' }).data.datasets;
        expect(dataset.backgroundColor).toBe('#00aa0033');
        expect(dataset.pointBackgroundColor).toBe('#00aa00');
    });

    it('hands the chart area background and the tooltip layout to chart.js', () => {
        const { plugins } = chart({
            dataCount: 1, oid: 'temp.oid',
            chartAreaBackgroundColor: '#101010',
            tooltipBackgroundColor: '#202020', tooltipTitleFontColor: '#ffff00', tooltipBodyFontColor: '#00ffff',
            tooltipBodyFontFamily: 'Ubuntu-Italic', tooltipBodyFontSize: 16, tooltipMode: 'index',
        }).options;
        expect(plugins.mdwChartArea.color).toBe('#101010');
        expect(plugins.tooltip.backgroundColor).toBe('#202020');
        expect(plugins.tooltip.titleColor).toBe('#ffff00');
        expect(plugins.tooltip.bodyColor).toBe('#00ffff');
        expect(plugins.tooltip.bodyFont).toEqual({ family: 'Ubuntu-Italic', size: 16 });
        expect(plugins.tooltip.mode).toBe('index');
    });

    it('appends the configured unit to the tooltip value', () => {
        const { plugins } = chart({ dataCount: 1, oid: 'temp.oid', tooltipBodyAppend: ' °C', tooltipValueMinDecimals: 1, tooltipValueMaxDecimals: 1 }).options;
        const label = (plugins.tooltip.callbacks as { label: (item: unknown) => string }).label;
        expect(label({ dataset: { label: 'Temperatur' }, parsed: { y: 20.25 } })).toMatch(/^Temperatur: 20[.,]3 °C$/);
    });
});
