import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// chart.js is replaced by a recorder so the test can count how many instances a sequence of
// renders creates. `vi.hoisted` because `vi.mock` factories run before the module body.
const { instances, ChartMock } = vi.hoisted(() => {
    const created: Array<{ data: unknown; options: unknown; update: () => void; destroy: () => void; updates: number; destroyed: number }> = [];
    class ChartRecorder {
        // The module reads both at import time. No `plugins` key and no `register`, so the datalabels
        // default and the controller registration are skipped — this test draws nothing.
        static defaults = {};
        data: unknown;
        options: unknown;
        updates = 0;
        destroyed = 0;
        constructor(_canvas: unknown, config: { data: unknown; options: unknown }) {
            this.data = config.data;
            this.options = config.options;
            created.push(this);
        }
        update(): void { this.updates++; }
        destroy(): void { this.destroyed++; }
    }
    return { instances: created, ChartMock: ChartRecorder };
});

// Every name the module imports has to be here, or the ESM import of a missing export throws. The
// recorder deliberately has no static `register`, so the guarded Chart.register() call is skipped.
vi.mock('chart.js', () => ({
    Chart: ChartMock,
    BarController: {}, LineController: {}, PieController: {}, DoughnutController: {},
    ArcElement: {}, BarElement: {}, LineElement: {}, PointElement: {},
    CategoryScale: {}, LinearScale: {},
    Filler: {}, Legend: {}, Title: {}, Tooltip: {},
}));
vi.mock('chartjs-plugin-datalabels', () => ({ default: { id: 'datalabels' } }));

import { MaterialDesignChartCanvas } from './MaterialDesignChartCanvas';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => { instances.length = 0; });

describe('MaterialDesignChartCanvas instance reuse', () => {
    it('updates the existing chart on re-render and only rebuilds when the type changes', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const render = (type: string, value: number): void => {
            // Fresh object literals, exactly as the chart widgets build them inside their render.
            act(() => { root.render(<MaterialDesignChartCanvas type={type} data={{ value }} options={{ responsive: true }} />); });
        };

        render('bar', 1);
        expect(instances).toHaveLength(1);
        // The create effect records what it built with, so the update effect must not fire on mount
        // — doing so would replay the entry animation.
        expect(instances[0].updates).toBe(0);

        // A state update re-renders the parent with new `data`/`options` identities. Rebuilding here
        // was the bug: it restarted the animation and closed any open tooltip on every value.
        render('bar', 2);
        render('bar', 3);
        expect(instances).toHaveLength(1);
        expect(instances[0].updates).toBe(2);
        expect(instances[0].data).toMatchObject({ value: 3 });

        render('line', 3);
        expect(instances).toHaveLength(2);
        expect(instances[0].destroyed).toBe(1);

        act(() => { root.unmount(); });
        expect(instances[1].destroyed).toBe(1);
    });

    // chart.js links its per-dataset meta (and with it the drawn elements) by dataset object
    // identity. A fresh dataset object on every render made it build new elements and replay the
    // entry animation from the axis on each state update.
    it('keeps the dataset objects chart.js already holds and updates them in place', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const render = (datasets: Record<string, unknown>[] | undefined): void => {
            act(() => { root.render(<MaterialDesignChartCanvas type="line" data={{ labels: ['a'], datasets }} options={{}} />); });
        };
        const current = (): Record<string, unknown>[] => (instances[0].data as { datasets: Record<string, unknown>[] }).datasets;

        render([{ data: [1], hidden: true }]);
        const first = current()[0];

        render([{ data: [2] }]);
        expect(current()[0]).toBe(first);
        // A key the new render left out must not survive from the old dataset.
        expect(current()[0]).toEqual({ data: [2] });

        // Growing appends the new dataset, shrinking drops the surplus, the first one stays.
        render([{ data: [3] }, { data: [4] }]);
        expect(current()[0]).toBe(first);
        expect(current()).toEqual([{ data: [3] }, { data: [4] }]);
        render([{ data: [5] }]);
        expect(current()).toEqual([{ data: [5] }]);
        expect(current()[0]).toBe(first);

        // A config without datasets must not throw.
        render(undefined);
        expect(current()).toEqual([]);
        expect(instances).toHaveLength(1);

        act(() => { root.unmount(); });
    });
});
