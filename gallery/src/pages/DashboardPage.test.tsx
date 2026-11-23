import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it } from 'vitest';

import { installShim } from '../runtime/GalleryRxWidget';
import { createRuntime } from '../runtime/runtime';
import { entryByTpl, loadWidget } from '../runtime/widgets';
import { DEFAULT_QUERY } from '../state';
import { VIEWS } from '../views/views';
import { DashboardFrame } from './DashboardPage';
import { PAGE_OID, TABLET_PAGES, indexForPage, pageForIndex } from './dashboardPages';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// Load every widget the views use up front: a load that outlives the test would hit a torn-down environment.
beforeAll(async () => {
    installShim();
    const tpls = new Set(Object.values(VIEWS).flatMap(view => Object.values(view.widgets).map(w => w.tpl)));
    await Promise.all([...tpls].map(tpl => loadWidget(entryByTpl(tpl)!.module)));
});

describe('tablet views and the Top App Bar', () => {
    it.each(TABLET_PAGES)('%s lists the tablet pages in order and writes the page data point', view => {
        const bars = Object.values(VIEWS[view].widgets).filter(w => w.tpl === 'tplVis2-materialdesign-TopAppBar-Navigation');
        expect(bars).toHaveLength(1);
        const data = bars[0].data;
        expect(data.oid).toBe(PAGE_OID);
        expect(data.navItemCount).toBe(TABLET_PAGES.length);
        TABLET_PAGES.forEach((page, i) => expect(data[`menuId${i}`]).toBe(page));
    });
});

describe('pageForIndex', () => {
    it('maps the entry indexes to the views', () => {
        expect([0, 1, 2, 3].map(pageForIndex)).toEqual(TABLET_PAGES);
        expect(pageForIndex('2')).toBe(TABLET_PAGES[2]);
        expect(indexForPage('dashboard-tablet-energy')).toBe(3);
        expect(indexForPage('dashboard-phone')).toBe(-1);
    });
    it.each([-1, 4, 7, NaN, '', null, '1.5', 'abc', undefined])('rejects %s', value => {
        expect(pageForIndex(value)).toBeUndefined();
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

    it('switches the tablet view when the page data point changes and ignores invalid values', async () => {
        const frame = await mount('dashboard-tablet');
        expect(frame.shown()).toBe('dashboard-tablet');
        await write(frame.runtime, 2);
        expect(frame.shown()).toBe('dashboard-tablet-climate');
        await write(frame.runtime, 9);
        expect(frame.shown()).toBe('dashboard-tablet-climate');
        await write(frame.runtime, '');
        expect(frame.shown()).toBe('dashboard-tablet-climate');
        frame.stop();
    });

    it('lets a phone frame ignore the page data point', async () => {
        const frame = await mount('dashboard-phone');
        await write(frame.runtime, 1);
        expect(frame.shown()).toBe('dashboard-phone');
        expect(frame.runtime.store.getState(PAGE_OID)?.val).toBe(1);
        frame.stop();
    });
});
