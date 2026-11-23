import React, { useEffect, useMemo, useRef, useState } from 'react';

import { translate } from '../runtime/i18n';
import { type GalleryRuntime, makeContext } from '../runtime/runtime';
import { defaultData } from '../runtime/widgetInfo';
import { type WidgetClass, loadWidget } from '../runtime/widgets';
import { type GalleryQuery, VIEWPORTS, routeHash } from '../state';
import { GalleryView } from '../views/GalleryView';

export function WidgetInstance(props: { module: string; data: Record<string, unknown>; size: { width: number; height: number }; runtime: GalleryRuntime; query: GalleryQuery; left?: number; top?: number; id?: string; depth?: number; onNavigate?(view: string): void }): React.JSX.Element | null {
    const [Widget, setWidget] = useState<WidgetClass>();
    const [toast, setToast] = useState('');
    useEffect(() => { void loadWidget(props.module).then(W => setWidget(() => W)); }, [props.module]);
    const data = useMemo(() => (Widget ? { ...defaultData(Widget.getWidgetInfo()), ...props.data } : props.data), [Widget, props.data]);
    if (!Widget) return null;
    const context = makeContext(props.runtime, {
        themeType: props.query.theme,
        activeView: 'gallery',
        changeView: view => {
            if (props.onNavigate) { props.onNavigate(view); return; }
            setToast(translate('gallery_navigate', view));
            window.setTimeout(() => setToast(''), 2500);
        },
        renderView: view => <GalleryView depth={(props.depth ?? 0) + 1} name={view} query={props.query} runtime={props.runtime} />,
    });
    return (
        <>
            <Widget context={context} data={data} editMode={false} id={props.id ?? 'stage'} style={{ left: props.left ?? 0, top: props.top ?? 0, width: props.size.width, height: props.size.height }} tpl={Widget.getWidgetInfo().id} view="gallery" />
            {toast ? <div className="g-toast" role="status">{toast}</div> : null}
        </>
    );
}

// The iframe makes window.innerWidth and media queries inside the widgets match the chosen device.
export function ViewportFrame({ path, query }: { path: string[]; query: GalleryQuery }): React.JSX.Element {
    const outer = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const size = query.vp === 'fit' ? undefined : VIEWPORTS[query.vp];
    useEffect(() => {
        if (!size || !outer.current) return;
        const update = (): void => setScale(Math.min(1, (outer.current?.clientWidth ?? size.width) / size.width));
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [size]);
    const src = `${location.pathname}${routeHash(['frame', ...path], query)}`;
    return (
        <div className="g-frame-outer" ref={outer} style={size ? { height: size.height * scale } : undefined}>
            <iframe className="g-frame" src={src} style={size ? { width: size.width, height: size.height, transform: `scale(${scale})` } : { width: '100%', height: '70vh' }} title={translate('gallery_stage')} />
        </div>
    );
}
