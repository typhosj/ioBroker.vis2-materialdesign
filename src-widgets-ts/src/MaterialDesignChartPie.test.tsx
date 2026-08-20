import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignChartPie from './MaterialDesignChartPie';
import { MaterialDesignChartCanvas } from './MaterialDesignChartCanvas';

function fixture<T>(value: unknown): T { return value as T; }

type ChartProps = { data: { labels: unknown[]; datasets: Array<Record<string, unknown>> }; options: Record<string, any>; type: string };

// Same shape as the bar-chart test: chart.js never runs under jsdom, so the assertions read the
// labels/datasets the widget hands it off the returned element tree.
function findCanvas(node: React.ReactNode): ChartProps | undefined {
    if (!React.isValidElement(node)) return undefined;
    if (node.type === MaterialDesignChartCanvas) return node.props as ChartProps;
    for (const child of React.Children.toArray((node.props as { children?: React.ReactNode }).children)) {
        const found = findCanvas(child);
        if (found) return found;
    }
    return undefined;
}

function chart(rxData: Record<string, unknown>, values: Record<string, unknown> = {}): ChartProps {
    const widget = new MaterialDesignChartPie(fixture<ConstructorParameters<typeof MaterialDesignChartPie>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values });
    const props = findCanvas(widget.renderWidgetBody(fixture<Parameters<MaterialDesignChartPie['renderWidgetBody']>[0]>({})));
    if (!props) throw new Error('no chart canvas rendered');
    return props;
}

describe('pie slices from indexed editor fields', () => {
    it('reads label, value and colour per slice', () => {
        const { data } = chart(
            { dataCount: 2, label0: 'on', label1: 'off', oid0: 'a.0.v', oid1: 'b.0.v', dataColor1: '#123456' },
            { 'a.0.v.val': 30, 'b.0.v.val': 70 },
        );
        expect(data.labels).toEqual(['on', 'off']);
        expect(data.datasets[0].data).toEqual([30, 70]);
        expect((data.datasets[0].backgroundColor as string[])[1]).toBe('#123456');
    });

    // A pie cannot draw a negative slice — chart.js would render it as a gap and the percentages of
    // every other slice would be wrong.
    it('clamps a negative value to zero', () => {
        const { data } = chart({ dataCount: 1, oid0: 'a.0.v' }, { 'a.0.v.val': -5 });
        expect(data.datasets[0].data).toEqual([0]);
    });

    it('falls back to the global colour when a slice has none', () => {
        const { data } = chart({ dataCount: 1, globalColor: '#00696d' });
        expect((data.datasets[0].backgroundColor as string[])[0]).toBe('#00696d');
    });

    it('lets a colour scheme fill the slices it has no explicit colour for', () => {
        const { data } = chart({ dataCount: 3, colorScheme: 'scrounger.pie', dataColor0: '#ff0000' });
        const colors = data.datasets[0].backgroundColor as string[];
        expect(colors[0]).toBe('#ff0000');
        expect(colors[1]).not.toBe(colors[2]);
    });
});

describe('pie slices from a JSON state', () => {
    const rxData = { chartDataMethod: 'jsonStringObject', oid: 'json.0.v' };

    it('takes one slice per array entry', () => {
        const { data } = chart(rxData, { 'json.0.v.val': '[{"label":"a","value":1},{"label":"b","value":3}]' });
        expect(data.labels).toEqual(['a', 'b']);
        expect(data.datasets[0].data).toEqual([1, 3]);
    });

    it('falls back to the editor rows when the JSON is broken', () => {
        const { data } = chart({ ...rxData, dataCount: 2 }, { 'json.0.v.val': '{{' });
        expect(data.datasets[0].data).toHaveLength(2);
    });
});

describe('pie chart options', () => {
    it('draws a pie by default and a doughnut when asked', () => {
        expect(chart({ dataCount: 1 }).type).toBe('pie');
        expect(chart({ dataCount: 1, chartType: 'doughnut' }).type).toBe('doughnut');
    });

    it('leaves the hover colour out rather than writing an empty string chart.js would paint', () => {
        expect(chart({ dataCount: 1 }).data.datasets[0].hoverBackgroundColor).toBeUndefined();
        expect(chart({ dataCount: 1, hoverColor: '#abcdef' }).data.datasets[0].hoverBackgroundColor).toBe('#abcdef');
    });
});
