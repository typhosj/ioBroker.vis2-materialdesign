import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import React, { useEffect, useMemo, useState } from 'react';

import { type CatalogEntry, catalogEntry } from '../catalog/catalog';
import { FieldControls } from '../controls/FieldControls';
import { currentLang, translate } from '../runtime/i18n';
import { type GalleryRuntime, hostRuntime } from '../runtime/runtime';
import { loadWidget, widgetIndex } from '../runtime/widgets';
import { defaultData, subscribedIds } from '../runtime/widgetInfo';
import { type GalleryQuery, routeHash } from '../state';
import { ViewportFrame, WidgetInstance } from './Stage';

const moduleByName = (name: string): string | undefined => widgetIndex.find(e => e.name === name || e.module === name)?.module;

function useEntry(name: string): { info?: RxWidgetInfo; entry?: CatalogEntry } {
    const [state, setState] = useState<{ info?: RxWidgetInfo; entry?: CatalogEntry }>({});
    useEffect(() => {
        const module = moduleByName(name);
        if (!module) return;
        void loadWidget(module).then(W => { const info = W.getWidgetInfo(); setState({ info, entry: catalogEntry(module, info) }); });
    }, [name]);
    return state;
}

const DATA_KEY = 'gallery.data.';
const pickVariant = (entry: CatalogEntry, id?: string): CatalogEntry['variants'][number] => entry.variants.find(v => v.id === id) ?? entry.variants[0];
export const variantData = (info: RxWidgetInfo, entry: CatalogEntry, variantId?: string): Record<string, unknown> => {
    const variant = pickVariant(entry, variantId);
    return { ...defaultData(info), ...variant.data, designStyle: 'default' };
};

export function WidgetFrame({ name, query, runtime }: { name: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element | null {
    const { info, entry } = useEntry(name);
    const shared = hostRuntime() ?? runtime;
    const [data, setData] = useState<Record<string, unknown>>();
    useEffect(() => {
        if (!info || !entry) return;
        const read = (): void => {
            let stored: Record<string, unknown> | undefined;
            try {
                const parsed: unknown = JSON.parse(window.parent.sessionStorage.getItem(`${DATA_KEY}${entry.module}`) ?? 'null');
                stored = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
            } catch { stored = undefined; }
            setData(stored ?? variantData(info, entry, query.variant));
        };
        read();
        window.addEventListener('storage', read);
        const onMessage = (e: MessageEvent): void => { if (e.origin === location.origin && e.source === window.parent) read(); };
        window.addEventListener('message', onMessage);
        return () => { window.removeEventListener('storage', read); window.removeEventListener('message', onMessage); };
    }, [info, entry, query.variant]);
    if (!info || !entry || !data) return null;
    const variant = pickVariant(entry, query.variant);
    return <div className="g-frame-body"><WidgetInstance data={data} module={entry.module} query={query} runtime={shared} size={variant.size} left={16} top={16} /></div>;
}

export function WidgetPage({ name, query, runtime }: { name: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element | null {
    const { info, entry } = useEntry(name);
    const [data, setData] = useState<Record<string, unknown>>();
    const [, tick] = useState(0);
    useEffect(() => { if (info && entry) setData(variantData(info, entry, query.variant)); }, [info, entry, query.variant]);
    useEffect(() => {
        if (!entry || !data) return;
        try { sessionStorage.setItem(`${DATA_KEY}${entry.module}`, JSON.stringify(data)); } catch { /* the frame falls back to the variant */ }
        document.querySelector<HTMLIFrameElement>('.g-frame')?.contentWindow?.postMessage('gallery-data', location.origin);
    }, [entry, data]);
    const ids = useMemo(() => (info && data ? subscribedIds(info, data).filter(id => id.startsWith('0_userdata.0.demo.')) : []), [info, data]);
    useEffect(() => {
        const offs = ids.map(id => runtime.store.subscribe(id, () => tick(n => n + 1)));
        return () => offs.forEach(off => off());
    }, [ids, runtime]);
    if (!info || !entry || !data) return null;
    const lang = currentLang();
    return (
        <article className="g-widget-page">
            <h1>{entry.name}</h1>
            <p>{entry.description[lang] || entry.description.en || translate('gallery_no_description')}</p>
            <nav className="g-variants" aria-label={translate('gallery_variants')}>
                {entry.variants.map(v => <a aria-current={(query.variant ?? entry.variants[0].id) === v.id} href={routeHash(['widget', name], { ...query, variant: v.id })} key={v.id}>{v.label}</a>)}
            </nav>
            <div className="g-workbench">
                <ViewportFrame path={['widget', name]} query={query} />
                <aside>
                    <h2>{translate('gallery_settings')}</h2>
                    <button onClick={() => setData(variantData(info, entry, query.variant))} type="button">{translate('gallery_reset_variant')}</button>
                    <button onClick={() => void navigator.clipboard?.writeText(JSON.stringify({ tpl: entry.tpl, data, style: pickVariant(entry, query.variant).size }, null, 2))} type="button">{translate('gallery_copy_json')}</button>
                    <FieldControls data={data} ids={runtime.store.ids().filter(id => id.startsWith('0_userdata.0.demo.'))} info={info} onChange={(key, value) => setData(prev => ({ ...prev, [key]: value }))} views={['demo-lights', 'demo-climate', 'demo-media']} />
                </aside>
            </div>
            <section>
                <h2>{translate('gallery_datapoints')}</h2>
                <table className="g-datapoints"><tbody>
                    {ids.map(id => (
                        <tr key={id}>
                            <th scope="row">{id.replace('0_userdata.0.demo.', '')}</th>
                            <td><input aria-label={id} defaultValue={String(runtime.store.getState(id)?.val ?? '')} key={String(runtime.store.getState(id)?.ts)} onBlur={e => {
                                const old = runtime.store.getState(id)?.val;
                                const raw = e.target.value;
                                const next = typeof old === 'number' ? (raw.trim() === '' ? NaN : Number(raw)) : typeof old === 'boolean' ? (raw === 'true' ? true : raw === 'false' ? false : undefined) : raw;
                                if (next === undefined || (typeof next === 'number' && !Number.isFinite(next))) { e.target.value = String(old ?? ''); return; }
                                runtime.store.setState(id, next);
                            }} /></td>
                        </tr>
                    ))}
                </tbody></table>
                {entry.expects.length ? <><h2>{translate('gallery_expects')}</h2><ul>{entry.expects.map(e => <li key={e.attr}><code>{e.attr}</code>: {e.type} ({e.roles.join(', ')})</li>)}</ul></> : null}
            </section>
        </article>
    );
}
