import React, { useState } from 'react';

import { translate } from '../runtime/i18n';
import type { GalleryRuntime } from '../runtime/runtime';
import { type GalleryQuery, type Route, routeHash } from '../state';
import { NavDrawer } from '../ui/NavDrawer';
import { SegmentedButton } from '../ui/SegmentedButton';
import { TopAppBar } from '../ui/TopAppBar';
import { useWindowClass } from '../ui/useWindowClass';
import { navSections } from './navigation';

export function Shell({ route, runtime, search, onSearch, children }: { route: Route; runtime: GalleryRuntime; search: string; onSearch(value: string): void; children: React.ReactNode }): React.JSX.Element {
    const cls = useWindowClass();
    const drawerModal = cls === 'compact' || cls === 'medium';
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [live, setLive] = useState(runtime.isLive());
    const go = (patch: Partial<GalleryQuery>): void => { location.hash = routeHash(route.path, { ...route.query, ...patch }); };
    const showField = cls !== 'compact' || searchOpen || search !== '';
    const actions = (
        <>
            {showField
                ? <input aria-label={translate('gallery_search')} autoFocus={cls === 'compact'} className="g-search" onChange={e => onSearch(e.target.value)} placeholder={translate('gallery_search')} type="search" value={search} />
                : <button aria-label={translate('gallery_search')} className="g-icon-button mdi mdi-magnify" onClick={() => setSearchOpen(true)} type="button" />}
            <SegmentedButton label={translate('gallery_group_theme')} onChange={theme => go({ theme })} options={[{ value: 'light', label: translate('gallery_theme_light') }, { value: 'dark', label: translate('gallery_theme_dark') }]} value={route.query.theme} />
            <SegmentedButton label={translate('gallery_group_style')} onChange={style => go({ style })} options={[{ value: 'legacy', label: translate('gallery_style_legacy') }, { value: 'material3', label: translate('gallery_style_material3') }]} value={route.query.style} />
            <SegmentedButton label={translate('gallery_group_language')} onChange={lang => go({ lang })} options={[{ value: 'en', label: 'EN' }, { value: 'de', label: 'DE' }]} value={route.query.lang} />
        </>
    );
    const footer = (
        <>
            <label><input checked={live} onChange={e => { runtime.setLive(e.target.checked); setLive(e.target.checked); }} type="checkbox" />{translate('gallery_live')}</label>
            <button onClick={() => runtime.store.reset()} type="button">{translate('gallery_reset')}</button>
        </>
    );
    return (
        <div className={`g-shell g-shell-${cls}`}>
            <TopAppBar actions={actions} menuLabel={translate('gallery_menu')} onMenu={drawerModal ? () => setMenuOpen(true) : undefined} title={<a className="g-brand" href={routeHash([], route.query)}>{translate('gallery_title')}</a>} />
            <div className="g-shell-body">
                <NavDrawer footer={footer} label={translate('gallery_nav')} modal={drawerModal} onClose={() => setMenuOpen(false)} open={!drawerModal || menuOpen} sections={navSections(route)} />
                <main>{children}</main>
            </div>
        </div>
    );
}
