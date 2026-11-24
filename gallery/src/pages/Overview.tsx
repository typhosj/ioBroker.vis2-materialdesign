import docs from 'virtual:gallery-docs';
import React from 'react';

import { FAMILIES, type Family } from '../catalog/catalog';
import { currentLang, translate } from '../runtime/i18n';
import { widgetIndex } from '../runtime/widgets';
import { type GalleryQuery, routeHash } from '../state';

const ORDER: Family[] = ['buttons', 'iconButtons', 'input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation'];

export function Overview({ query, search, family }: { query: GalleryQuery; search: string; family?: string }): React.JSX.Element {
    const lang = currentLang();
    const only = ORDER.find(f => f === family);
    const needle = search.trim().toLowerCase();
    return (
        <>
            <p className="g-subtitle">{translate('gallery_subtitle')}</p>
            <section hidden={!!only}>
                <h2>{translate('gallery_dashboards')}</h2>
                <ul className="g-tiles">
                    {(['tablet', 'phone'] as const).map(board => (
                        <li key={board}>
                            <a href={routeHash(['dashboard', board], query)}>
                                <img alt="" height={160} loading="lazy" onError={ev => { ev.currentTarget.style.display = 'none'; }} src={`media/dashboard-${board}-${query.theme}.webp`} width={240} />
                                <strong>{translate(`gallery_dashboard_${board}`)}</strong>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
            {ORDER.filter(f => !only || f === only).map(family => {
                const items = widgetIndex.filter(e => (FAMILIES[e.module]?.family ?? 'values') === family)
                    .filter(e => !needle || `${e.name} ${docs[FAMILIES[e.module]?.doc ?? '']?.[lang] ?? ''}`.toLowerCase().includes(needle));
                if (!items.length) return null;
                return (
                    <section key={family}>
                        <h2>{translate(`gallery_family_${family}`)}</h2>
                        <ul className="g-tiles">
                            {items.map(e => (
                                <li key={e.module}>
                                    <a href={routeHash(['widget', e.name], query)}>
                                        <img alt="" height={160} loading="lazy" onError={ev => { ev.currentTarget.style.display = 'none'; }} src={`media/thumbs/${e.module}-${query.theme}.webp`} width={240} />
                                        <strong>{e.name}</strong>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </>
    );
}
