import docs from 'virtual:gallery-docs';
import React, { useState } from 'react';

import { FAMILIES, type Family } from '../catalog/catalog';
import { currentLang, translate } from '../runtime/i18n';
import { widgetIndex } from '../runtime/widgets';
import { type GalleryQuery, routeHash } from '../state';

const ORDER: Family[] = ['buttons', 'iconButtons', 'input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation'];

export function Overview({ query }: { query: GalleryQuery }): React.JSX.Element {
    const [search, setSearch] = useState('');
    const lang = currentLang();
    const needle = search.trim().toLowerCase();
    return (
        <>
            <p className="g-subtitle">{translate('gallery_subtitle')}</p>
            <input aria-label={translate('gallery_search')} className="g-search" onChange={e => setSearch(e.target.value)} placeholder={translate('gallery_search')} type="search" value={search} />
            {ORDER.map(family => {
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
