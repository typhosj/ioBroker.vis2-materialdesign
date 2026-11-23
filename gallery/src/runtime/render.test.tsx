import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installShim } from './GalleryRxWidget';
import { createRuntime, makeContext } from './runtime';
import { defaultData } from './widgetInfo';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeAll(() => installShim());

// Widgets that fail only because jsdom lacks a browser API, with the API named. Empty is the goal.
const JSDOM_ONLY: Record<string, string> = {
    MaterialDesignMasonryViews: 'ResizeObserver',
    MaterialDesignGridViews: 'ResizeObserver',
    MaterialDesignChartBar: 'HTMLCanvasElement.getContext',
    MaterialDesignChartPie: 'HTMLCanvasElement.getContext',
    MaterialDesignChartJson: 'HTMLCanvasElement.getContext',
    MaterialDesignChartLineHistory: 'HTMLCanvasElement.getContext',
};

describe('every widget renders with its default data', () => {
    it('mounts and unmounts without throwing or logging an error', async () => {
        const { loadWidget, widgetIndex } = await import('./widgets');
        const runtime = createRuntime({ test: true, now: new Date('2026-06-15T10:00:00') });
        const context = makeContext(runtime, { themeType: 'light', activeView: 'gallery', changeView: () => undefined, renderView: name => <div data-view={name} /> });
        const failures: string[] = [];
        for (const { module } of widgetIndex) {
            if (JSDOM_ONLY[module]) continue;
            const Widget = await loadWidget(module);
            const host = document.createElement('div');
            document.body.appendChild(host);
            const root = createRoot(host);
            const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            try {
                const data = { ...defaultData(Widget.getWidgetInfo()), designStyle: 'default' };
                await act(async () => {
                    root.render(<Widget context={context} data={data} editMode={false} id="w" style={{ width: 300, height: 200 }} tpl="t" view="gallery" />);
                    await Promise.resolve();
                });
                act(() => root.unmount());
                if (errors.mock.calls.length) failures.push(`${module}: console.error ${String(errors.mock.calls[0][0]).slice(0, 200)}`);
            } catch (error) {
                failures.push(`${module}: ${(error as Error).message}`);
            } finally {
                errors.mockRestore();
                host.remove();
            }
        }
        runtime.stop();
        expect(failures).toEqual([]);
    }, 180_000);
});
