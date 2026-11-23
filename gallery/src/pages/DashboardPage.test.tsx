import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it } from 'vitest';

import { installShim } from '../runtime/GalleryRxWidget';
import { createRuntime } from '../runtime/runtime';
import { entryByTpl, loadWidget } from '../runtime/widgets';
import { DEFAULT_QUERY } from '../state';
import { VIEWS } from '../views/views';
import { DashboardFrame } from './DashboardPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// Load every widget the views use up front: a load that outlives the test would hit a torn-down environment.
beforeAll(async () => {
    installShim();
    const tpls = new Set(Object.values(VIEWS).flatMap(view => Object.values(view.widgets).map(w => w.tpl)));
    await Promise.all([...tpls].map(tpl => loadWidget(entryByTpl(tpl)!.module)));
});

const PAGE_OID = '0_userdata.0.demo.dashboard.page';
const BAR = 'tplVis2-materialdesign-TopAppBar-Navigation';
const ADVANCED = 'tplVis2-materialdesign-view-in-widget8';
const CONTENT = ['dashboard-tablet-home', 'dashboard-tablet-lights', 'dashboard-tablet-climate', 'dashboard-tablet-energy'];
const tplsOf = (view: string): string[] => Object.values(VIEWS[view].widgets).map(w => w.tpl);

describe('tablet dashboard structure', () => {
    const main = VIEWS['dashboard-tablet'];
    const bars = Object.values(main.widgets).filter(w => w.tpl === BAR);
    const advanced = Object.values(main.widgets).filter(w => w.tpl === ADVANCED);

    it('has exactly one Top App Bar and one Advanced View in Widget 8, both bound to the page data point', () => {
        expect(bars).toHaveLength(1);
        expect(advanced).toHaveLength(1);
        expect(bars[0].data.oid).toBe(PAGE_OID);
        expect(advanced[0].data.oid).toBe(PAGE_OID);
    });
    it('embeds, at index N, the content view that Top App Bar entry N names', () => {
        expect(bars[0].data.navItemCount).toBe(CONTENT.length);
        expect(advanced[0].data.count).toBe(CONTENT.length);
        CONTENT.forEach((view, i) => {
            expect(bars[0].data[`menuId${i}`]).toBe(view);
            expect(advanced[0].data[`contains_view_${i}`]).toBe(view);
            expect(VIEWS[view]).toBeDefined();
        });
        expect(advanced[0].data).not.toHaveProperty('contains_view_4');
    });
    it.each(CONTENT)('%s is a content view without a Top App Bar', view => {
        expect(tplsOf(view)).not.toContain(BAR);
        expect(tplsOf(view).length).toBeGreaterThan(0);
    });
});

describe('DashboardFrame', () => {
    const mount = async (view: string): Promise<{ runtime: ReturnType<typeof createRuntime>; shown: () => string | undefined; stop(): void }> => {
        const runtime = createRuntime({ test: true, now: new Date('2026-06-15T10:00:00') });
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        await act(async () => { root.render(<DashboardFrame query={DEFAULT_QUERY} runtime={runtime} view={view} />); await new Promise(r => setTimeout(r, 0)); });
        return { runtime, shown: () => host.querySelector<HTMLElement>('[data-view]')?.dataset.view, stop: () => { act(() => root.unmount()); host.remove(); runtime.stop(); } };
    };
    const write = async (runtime: ReturnType<typeof createRuntime>, value: number | string): Promise<void> => {
        await act(async () => { runtime.store.setState(PAGE_OID, value, true); await Promise.resolve(); });
    };

    it('shows the content view that the page data point selects, with its own widgets', async () => {
        const frame = await mount('dashboard-tablet');
        const embedded = (): string | undefined => document.body.querySelector<HTMLElement>('[data-view="dashboard-tablet"] [data-view]')?.dataset.view;
        for (const [index, view] of CONTENT.entries()) {
            await write(frame.runtime, index);
            for (let i = 0; i < 750 && !(embedded() === view && document.body.querySelector(`[data-view="${view}"] > *`)); i++) await act(async () => { await new Promise(r => window.setTimeout(r, 20)); });
            expect(embedded()).toBe(view);
            expect(document.body.querySelectorAll(`[data-view="${view}"] > *`).length).toBeGreaterThan(0);
        }
        frame.stop();
    }, 30000);

    it('lets a phone frame ignore the page data point', async () => {
        const frame = await mount('dashboard-phone');
        await write(frame.runtime, 1);
        expect(frame.shown()).toBe('dashboard-phone');
        expect(frame.runtime.store.getState(PAGE_OID)?.val).toBe(1);
        frame.stop();
    });
});
