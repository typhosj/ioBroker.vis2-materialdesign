import docs from 'virtual:gallery-docs';
import React from 'react';

import { FAMILIES } from '../catalog/catalog';
import { currentLang, translate } from '../runtime/i18n';
import type { GalleryRuntime } from '../runtime/runtime';
import { widgetIndex } from '../runtime/widgets';
import { type GalleryQuery, routeHash } from '../state';
import { Card } from '../ui/Card';
import { LivePreview } from './LivePreview';
import { FAMILY_ORDER } from './navigation';

const BOX = { width: 280, height: 120 };

export function Overview({ query, runtime, search, family }: { query: GalleryQuery; runtime: GalleryRuntime; search: string; family?: string }): React.JSX.Element {
    const lang = currentLang();
    const only = FAMILY_ORDER.find(f => f === family);
    const needle = search.trim().toLowerCase();
    const sections = FAMILY_ORDER.filter(f => !only || f === only).map(fam => ({
        fam,
        items: widgetIndex.filter(e => (FAMILIES[e.module]?.family ?? 'values') === fam)
            .filter(e => !needle || `${e.name} ${translate(`gallery_family_${fam}`)} ${docs[FAMILIES[e.module]?.doc ?? '']?.[lang] ?? ''}`.toLowerCase().includes(needle)),
    })).filter(section => section.items.length);
    return (
        <>
            {only ? <header className="g-page-head"><h1>{translate(`gallery_family_${only}`)}</h1></header> : (
                <header className="g-hero">
                    <h1>{translate('gallery_title')}</h1>
                    <p className="g-subtitle">{translate('gallery_subtitle')}</p>
                    <p>{translate('gallery_install')}</p>
                    <p className="g-hero-actions">
                        {(['tablet', 'phone'] as const).map(board => (
                            <a className="g-button-filled" href={routeHash(['dashboard', board], query)} key={board}>{translate(`gallery_dashboard_${board}`)}</a>
                        ))}
                    </p>
                </header>
            )}
            {sections.length ? sections.map(({ fam, items }) => (
                <Card key={fam} title={only ? undefined : translate(`gallery_family_${fam}`)}>
                    <div className="g-cards">
                        {items.map(e => (
                            <a className="g-preview-card" href={routeHash(['widget', e.name], query)} key={e.module}>
                                <LivePreview box={BOX} module={e.module} query={query} runtime={runtime} />
                                <strong>{e.name}</strong>
                            </a>
                        ))}
                    </div>
                </Card>
            )) : <p className="g-no-results" role="status">{translate('gallery_no_results')}</p>}
        </>
    );
}
