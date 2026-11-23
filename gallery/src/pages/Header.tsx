import React from 'react';

import { translate } from '../runtime/i18n';
import type { GalleryRuntime } from '../runtime/runtime';
import { type GalleryQuery, type Route, routeHash } from '../state';

export function Header({ route, runtime }: { route: Route; runtime: GalleryRuntime }): React.JSX.Element {
    const go = (patch: Partial<GalleryQuery>): void => { location.hash = routeHash(route.path, { ...route.query, ...patch }); };
    const [live, setLive] = React.useState(runtime.isLive());
    const toggle = <K extends keyof GalleryQuery>(key: K, a: GalleryQuery[K], b: GalleryQuery[K], labelA: string, labelB: string): React.JSX.Element => (
        <div className="g-toggle" role="group">
            <button aria-pressed={route.query[key] === a} onClick={() => go({ [key]: a })} type="button">{translate(labelA)}</button>
            <button aria-pressed={route.query[key] === b} onClick={() => go({ [key]: b })} type="button">{translate(labelB)}</button>
        </div>
    );
    return (
        <header className="g-header">
            <a className="g-brand" href={routeHash([], route.query)}>{translate('gallery_title')}</a>
            {toggle('theme', 'light', 'dark', 'gallery_theme_light', 'gallery_theme_dark')}
            {toggle('style', 'legacy', 'material3', 'gallery_style_legacy', 'gallery_style_material3')}
            {toggle('lang', 'en', 'de', 'EN', 'DE')}
            <label className="g-viewport">
                <span>{translate('gallery_viewport')}</span>
                <select onChange={e => go({ vp: e.target.value as GalleryQuery['vp'] })} value={route.query.vp}>
                    {(['phone', 'tablet', 'desktop', 'fit'] as const).map(vp => <option key={vp} value={vp}>{translate(`gallery_viewport_${vp}`)}</option>)}
                </select>
            </label>
            <label><input checked={live} onChange={e => { runtime.setLive(e.target.checked); setLive(e.target.checked); }} type="checkbox" />{translate('gallery_live')}</label>
            <button onClick={() => runtime.store.reset()} type="button">{translate('gallery_reset')}</button>
            <a href={routeHash(['about'], route.query)}>{translate('gallery_about')}</a>
        </header>
    );
}
