import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import React, { useEffect, useMemo, useState } from 'react';

import { type CatalogEntry, catalogEntry } from '../catalog/catalog';
import { FieldControls } from '../controls/FieldControls';
import { currentLang, translate } from '../runtime/i18n';
import { type GalleryRuntime, hostRuntime } from '../runtime/runtime';
import { loadWidget, widgetIndex } from '../runtime/widgets';
import { defaultData, subscribedIds } from '../runtime/widgetInfo';
import { type GalleryQuery, type Viewport, routeHash } from '../state';
import { Card } from '../ui/Card';
import { FilterChips } from '../ui/FilterChips';
import { SegmentedButton } from '../ui/SegmentedButton';
import { Sheet } from '../ui/Sheet';
import { Tabs } from '../ui/Tabs';
import { useWindowClass } from '../ui/useWindowClass';
import { VIEWS } from '../views/views';
import { parseDatapointInput, parseStoredData, pickVariant } from './widgetPageLogic';
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
export const variantData = (info: RxWidgetInfo, entry: CatalogEntry, variantId?: string): Record<string, unknown> => {
    const variant = pickVariant(entry, variantId);
    return { ...defaultData(info), ...variant.data, designStyle: variant.designStyle ?? 'default' };
};

export function WidgetFrame({ name, query, runtime }: { name: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element | null {
    const { info, entry } = useEntry(name);
    const shared = hostRuntime() ?? runtime;
    const [data, setData] = useState<Record<string, unknown>>();
    useEffect(() => {
        if (!info || !entry) return;
        const read = (): void => {
            let raw: string | null = null;
            try { raw = window.parent.sessionStorage.getItem(`${DATA_KEY}${entry.module}`); } catch { /* cross-origin parent: use the variant */ }
            const stored = parseStoredData(raw);
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
    return <div className="g-frame-body"><div className="g-frame-stage" style={{ width: variant.size.width === 'fill' ? 'calc(100% - 32px)' : variant.size.width, height: variant.size.height }}><WidgetInstance data={data} module={entry.module} query={query} runtime={shared} size={variant.size} /></div></div>;
}

export function WidgetPage({ name, query, runtime }: { name: string; query: GalleryQuery; runtime: GalleryRuntime }): React.JSX.Element | null {
    const { info, entry } = useEntry(name);
    const [data, setData] = useState<Record<string, unknown>>();
    const [, tick] = useState(0);
    const cls = useWindowClass();
    const [sheetOpen, setSheetOpen] = useState(false);
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
    const variant = pickVariant(entry, query.variant);
    const json = JSON.stringify({ tpl: entry.tpl, data, style: variant.size }, null, 2);
    const toolbar = (
        <>
            <SegmentedButton<Viewport> label={translate('gallery_viewport')} onChange={vp => { location.hash = routeHash(['widget', name], { ...query, vp }); }} options={(['fit', 'phone', 'tablet', 'desktop'] as const).map(vp => ({ value: vp, label: translate(`gallery_viewport_${vp}`) }))} value={query.vp} />
            <button aria-label={translate('gallery_reset_variant')} className="g-icon-button mdi mdi-restore" onClick={() => setData(variantData(info, entry, query.variant))} type="button" />
            <button aria-label={translate('gallery_copy_json')} className="g-icon-button mdi mdi-code-json" onClick={() => void navigator.clipboard?.writeText(json)} type="button" />
            {cls !== 'large' ? <button aria-label={translate('gallery_open_settings')} className="g-icon-button mdi mdi-tune" onClick={() => setSheetOpen(true)} type="button" /> : null}
        </>
    );
    const datapointTable = (
        <>
            <table className="g-datapoints"><tbody>
                {ids.map(id => (
                    <tr key={id}>
                        <th scope="row">{id.replace('0_userdata.0.demo.', '')}</th>
                        <td><input aria-label={id} defaultValue={String(runtime.store.getState(id)?.val ?? '')} key={String(runtime.store.getState(id)?.ts)} onBlur={e => {
                            const old = runtime.store.getState(id)?.val;
                            const raw = e.target.value;
                            const parsed = parseDatapointInput(old, raw);
                            if (!parsed.ok) { e.target.value = String(old ?? ''); return; }
                            runtime.store.setState(id, parsed.value);
                        }} /></td>
                    </tr>
                ))}
            </tbody></table>
            {entry.expects.length ? <><h2>{translate('gallery_expects')}</h2><ul>{entry.expects.map(e => <li key={`${e.attr}:${e.type}`}><code>{e.attr}</code>: {e.type}{e.roles.length ? ` (${e.roles.join(', ')})` : ''}</li>)}</ul></> : null}
        </>
    );
    return (
        <article className="g-widget-page">
            <header className="g-page-head">
                <h1>{entry.name}</h1>
                <a className="g-family-chip" href={routeHash(['family', entry.family], query)}>{translate(`gallery_family_${entry.family}`)}</a>
                <p>{entry.description[lang] || entry.description.en || translate('gallery_no_description')}</p>
                {entry.doc ? <a href={`https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/${lang}/widgets/${entry.doc}.md`} rel="noopener" target="_blank">{translate('gallery_doc_link')}</a> : null}
            </header>
            <FilterChips label={translate('gallery_variants')} onChange={id => { location.hash = routeHash(['widget', name], { ...query, variant: id }); }}
                options={entry.variants.map(v => ({ id: v.id, label: v.label, badge: v.designStyle === 'material3' ? 'M3' : v.designStyle === 'legacy' ? 'Classic' : undefined }))} value={variant.id} />
            <div className="g-workbench">
                <Card className="g-stage-card" toolbar={toolbar}>
                    <ViewportFrame path={['widget', name]} query={query} />
                    {variant.purpose ? <p className="g-purpose">{variant.purpose}</p> : null}
                </Card>
                <Sheet closeLabel={translate('gallery_close')} label={translate('gallery_settings')} modal={cls !== 'large'} onClose={() => setSheetOpen(false)} open={cls === 'large' || sheetOpen} side={cls === 'compact' ? 'bottom' : 'end'}>
                    <Tabs idPrefix="sheet" label={translate('gallery_settings')} tabs={[
                        { id: 'settings', label: translate('gallery_settings'), panel: <FieldControls data={data} ids={runtime.store.ids().filter(id => id.startsWith('0_userdata.0.demo.'))} info={info} onChange={(key, value) => setData(prev => ({ ...prev, [key]: value }))} views={Object.keys(VIEWS)} /> },
                        { id: 'data', label: translate('gallery_datapoints'), panel: datapointTable },
                        { id: 'code', label: translate('gallery_code'), panel: <pre className="g-code">{json}</pre> },
                    ]} />
                </Sheet>
            </div>
        </article>
    );
}
