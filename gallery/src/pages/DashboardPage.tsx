import React from 'react';

import { translate } from '../runtime/i18n';
import type { GalleryRuntime } from '../runtime/runtime';
import { type GalleryQuery, type Viewport, routeHash } from '../state';
import { Card } from '../ui/Card';
import { SegmentedButton } from '../ui/SegmentedButton';
import { GalleryView } from '../views/GalleryView';
import { ViewportFrame } from './Stage';

export const DASHBOARDS: Record<string, { view: string; vp: 'tablet' | 'phone' }> = {
    tablet: { view: 'dashboard-tablet', vp: 'tablet' },
    phone: { view: 'dashboard-phone', vp: 'phone' },
};

export function DashboardPage({ name, query }: { name: string; query: GalleryQuery }): React.JSX.Element | null {
    const board = DASHBOARDS[name];
    if (!board) return null;
    const vp: Viewport = query.vp === 'fit' ? 'fit' : board.vp;
    const toolbar = (
        <SegmentedButton<Viewport> label={translate('gallery_viewport')} onChange={next => { location.hash = routeHash(['dashboard', name], { ...query, vp: next }); }}
            options={(['fit', board.vp] as const).map(value => ({ value, label: translate(`gallery_viewport_${value}`) }))} value={vp} />
    );
    return (
        <>
            <header className="g-page-head"><h1>{translate(`gallery_dashboard_${name}`)}</h1></header>
            <Card toolbar={toolbar}>
                <ViewportFrame path={['dashboard', board.view]} query={{ ...query, vp }} />
            </Card>
        </>
    );
}

// The tablet Top App Bar and its Advanced View in Widget 8 share one data point, as they do in vis-2,
// so the frame needs no navigation of its own. Widgets that call changeView still switch the shown view.
export function DashboardFrame({ view, query, runtime }: { view: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element {
    const [current, setCurrent] = React.useState(view);
    return <GalleryView name={current} onNavigate={setCurrent} query={query} runtime={runtime} />;
}
