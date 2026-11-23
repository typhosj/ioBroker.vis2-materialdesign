import React from 'react';

import type { GalleryRuntime } from '../runtime/runtime';
import { DEMO_PREFIX } from '../runtime/scenario';
import { type GalleryQuery } from '../state';
import { GalleryView } from '../views/GalleryView';
import { ViewportFrame } from './Stage';

export const DASHBOARDS: Record<string, { view: string; vp: 'tablet' | 'phone' }> = {
    tablet: { view: 'dashboard-tablet', vp: 'tablet' },
    phone: { view: 'dashboard-phone', vp: 'phone' },
};

// The Top App Bar does not call changeView: it writes the index of the chosen entry to its data point,
// as it does in vis-2. The frame follows that data point to switch the view.
const PAGES = ['dashboard-tablet', 'dashboard-tablet-lights', 'dashboard-tablet-climate', 'dashboard-tablet-energy'];
const PAGE_OID = `${DEMO_PREFIX}dashboard.page`;

export function DashboardPage({ name, query }: { name: string; query: GalleryQuery }): React.JSX.Element | null {
    const board = DASHBOARDS[name];
    if (!board) return null;
    return <ViewportFrame path={['dashboard', board.view]} query={{ ...query, vp: query.vp === 'fit' ? 'fit' : board.vp }} />;
}

export function DashboardFrame({ view, query, runtime }: { view: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element {
    const [current, setCurrent] = React.useState(view);
    React.useEffect(() => {
        const index = PAGES.indexOf(view);
        if (index >= 0) runtime.store.setState(PAGE_OID, index, true);
        return runtime.store.subscribe(PAGE_OID, (_id, state) => {
            const page = PAGES[Number(state?.val)];
            if (page) setCurrent(page);
        });
    }, [runtime, view]);
    const navigate = (target: string): void => {
        const index = PAGES.indexOf(target);
        if (index >= 0) runtime.store.setState(PAGE_OID, index, true);
        setCurrent(target);
    };
    return <GalleryView name={current} onNavigate={navigate} query={query} runtime={runtime} />;
}
