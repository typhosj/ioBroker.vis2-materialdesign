import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignChartBar from './MaterialDesignChartBar';
import { MaterialDesignChartCanvas } from './MaterialDesignChartCanvas';

function fixture<T>(value: unknown): T { return value as T; }

type ChartProps = { data: { labels: unknown[]; datasets: Array<Record<string, unknown>> }; options: Record<string, any>; type: string };

// jsdom has no 2d canvas, so the chart is never drawn here. Everything worth testing happens before
// that: the widget turns editor fields and state values into the labels/datasets/scales it hands to
// chart.js, and that hand-off is what these tests read off the returned element tree.
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
    const widget = new MaterialDesignChartBar(fixture<ConstructorParameters<typeof MaterialDesignChartBar>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values });
    const props = findCanvas(widget.renderWidgetBody(fixture<Parameters<MaterialDesignChartBar['renderWidgetBody']>[0]>({})));
    if (!props) throw new Error('no chart canvas rendered');
    return props;
}

describe('bar data from indexed editor fields', () => {
    it('reads label, value and colour per bar', () => {
        const { data } = chart(
            { dataCount: 2, label0: 'Room A', label1: 'Room B', oid0: 'a.0.v', oid1: 'b.0.v', dataColor0: '#ff0000' },
            { 'a.0.v.val': 21.5, 'b.0.v.val': 18 },
        );
        expect(data.labels).toEqual(['Room A', 'Room B']);
        expect(data.datasets[0].data).toEqual([21.5, 18]);
        expect((data.datasets[0].backgroundColor as string[])[0]).toBe('#ff0000');
    });

    it('falls back to the global colour when a bar has none', () => {
        const { data } = chart({ dataCount: 1, globalColor: '#00696d' });
        expect((data.datasets[0].backgroundColor as string[])[0]).toBe('#00696d');
    });

    it('treats a missing state as 0 rather than NaN', () => {
        const { data } = chart({ dataCount: 1, oid0: 'missing.0.v' });
        expect(data.datasets[0].data).toEqual([0]);
    });
});

describe('bar data from a JSON state', () => {
    const rxData = { chartDataMethod: 'jsonStringObject', oid: 'json.0.v' };

    it('takes one bar per array entry', () => {
        const { data } = chart(rxData, { 'json.0.v.val': '[{"label":"a","value":1},{"label":"b","value":2,"dataColor":"#123456"}]' });
        expect(data.labels).toEqual(['a', 'b']);
        expect(data.datasets[0].data).toEqual([1, 2]);
        expect((data.datasets[0].backgroundColor as string[])[1]).toBe('#123456');
    });

    // A malformed state must not blow the widget up — it falls back to the configured row count.
    it('falls back to the editor rows when the JSON is broken', () => {
        const { data } = chart({ ...rxData, dataCount: 2 }, { 'json.0.v.val': 'not json' });
        expect(data.datasets[0].data).toHaveLength(2);
    });

    it('ignores a JSON object that is not an array', () => {
        const { data } = chart({ ...rxData, dataCount: 3 }, { 'json.0.v.val': '{"label":"a"}' });
        expect(data.datasets[0].data).toHaveLength(3);
    });
});

describe('bar chart options', () => {
    it('switches the chart type for a horizontal layout', () => {
        expect(chart({ dataCount: 1 }).type).toBe('bar');
        expect(chart({ dataCount: 1, chartType: 'horizontal' }).type).toBe('horizontalBar');
    });

    it('keeps the legend off unless the legend fields ask for it', () => {
        expect(chart({ dataCount: 1 }).options.legend.display).toBe(false);
    });

    it('passes the configured animation duration through', () => {
        expect(chart({ dataCount: 1 }).options.animation.duration).toBe(1000);
        expect(chart({ dataCount: 1, animationDuration: 0 }).options.animation.duration).toBe(0);
    });

    // `disableHoverEffects` is the only way to stop chart.js highlighting bars on touch devices,
    // where the highlight sticks after the finger is gone.
    it('turns the hover mode off only when asked', () => {
        expect(chart({ dataCount: 1 }).options.hover).toBeUndefined();
        expect(chart({ dataCount: 1, disableHoverEffects: true }).options.hover).toEqual({ mode: null });
    });
});
