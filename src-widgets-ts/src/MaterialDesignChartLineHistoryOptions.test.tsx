import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';

function fixture<T>(value: unknown): T { return value as T; }

type Dataset = { backgroundColor?: unknown; borderColor?: unknown; pointBackgroundColor?: unknown; fill?: unknown };
type Options = { plugins: Record<string, Record<string, unknown>>; tooltips: Record<string, unknown> };

function chart(rxData: Record<string, unknown>): { data: { datasets: Dataset[] }; options: Options } {
    const widget = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values: {} });
    (widget as unknown as { series: unknown[] }).series = [{ oid: 'temp.oid', points: [{ ts: 1, val: 20 }, { ts: 2, val: 21 }] }];
    const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignChartLineHistory['renderWidgetBody']>[0]>({}));
    let found: { data: { datasets: Dataset[] }; options: Options } | undefined;
    const walk = (node: React.ReactNode): void => {
        if (Array.isArray(node)) { node.forEach(walk); return; }
        if (!React.isValidElement(node)) return;
        const element = node as React.ReactElement<Record<string, unknown>>;
        if (element.props.data && element.props.options) found = element.props as unknown as typeof found;
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
        const { plugins, tooltips } = chart({
            dataCount: 1, oid: 'temp.oid',
            chartAreaBackgroundColor: '#101010',
            tooltipBackgroundColor: '#202020', tooltipTitleFontColor: '#ffff00', tooltipBodyFontColor: '#00ffff',
            tooltipBodyFontFamily: 'Ubuntu-Italic', tooltipBodyFontSize: 16, tooltipMode: 'index',
        }).options;
        expect(plugins.mdwChartArea.color).toBe('#101010');
        expect(tooltips.backgroundColor).toBe('#202020');
        expect(tooltips.titleFontColor).toBe('#ffff00');
        expect(tooltips.bodyFontColor).toBe('#00ffff');
        expect(tooltips.bodyFontFamily).toBe('Ubuntu-Italic');
        expect(tooltips.bodyFontSize).toBe(16);
        expect(tooltips.mode).toBe('index');
    });

    it('appends the configured unit to the tooltip value', () => {
        const { tooltips } = chart({ dataCount: 1, oid: 'temp.oid', tooltipBodyAppend: ' °C', tooltipValueMinDecimals: 1, tooltipValueMaxDecimals: 1 }).options;
        const label = (tooltips.callbacks as { label: (tip: unknown, data: unknown) => string }).label;
        expect(label({ datasetIndex: 0, yLabel: 20.25 }, { datasets: [{ label: 'Temperatur' }] })).toMatch(/^Temperatur: 20[.,]3 °C$/);
    });
});
