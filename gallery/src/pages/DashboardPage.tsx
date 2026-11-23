import React from 'react';

import type { GalleryRuntime } from '../runtime/runtime';
import { type GalleryQuery } from '../state';
import { GalleryView } from '../views/GalleryView';
import { PAGE_OID, indexForPage, pageForIndex } from './dashboardPages';
import { ViewportFrame } from './Stage';

export const DASHBOARDS: Record<string, { view: string; vp: 'tablet' | 'phone' }> = {
    tablet: { view: 'dashboard-tablet', vp: 'tablet' },
    phone: { view: 'dashboard-phone', vp: 'phone' },
};

export function DashboardPage({ name, query }: { name: string; query: GalleryQuery }): React.JSX.Element | null {
    const board = DASHBOARDS[name];
    if (!board) return null;
    return <ViewportFrame path={['dashboard', board.view]} query={{ ...query, vp: query.vp === 'fit' ? 'fit' : board.vp }} />;
}

// The Top App Bar does not call changeView: it writes the index of the chosen entry to its data point,
// as it does in vis-2. A tablet frame follows that data point to switch the view; the phone frame has no such bar.
export function DashboardFrame({ view, query, runtime }: { view: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element {
    const [current, setCurrent] = React.useState(view);
    const tablet = indexForPage(view) >= 0;
    React.useEffect(() => {
        if (!tablet) return undefined;
        runtime.store.setState(PAGE_OID, indexForPage(view), true);
        return runtime.store.subscribe(PAGE_OID, (_id, state) => {
            const page = pageForIndex(state?.val);
            if (page) setCurrent(page);
        });
    }, [runtime, view, tablet]);
    const navigate = (target: string): void => {
        if (tablet && indexForPage(target) >= 0) runtime.store.setState(PAGE_OID, indexForPage(target), true);
        setCurrent(target);
    };
    return <GalleryView name={current} onNavigate={navigate} query={query} runtime={runtime} />;
}
