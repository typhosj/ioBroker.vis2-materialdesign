import React, { useEffect, useRef, useState } from 'react';

import { type Variant, catalogEntry } from '../catalog/catalog';
import type { GalleryRuntime } from '../runtime/runtime';
import { loadWidget } from '../runtime/widgets';
import type { GalleryQuery } from '../state';
import { WidgetInstance } from './Stage';

type Box = { width: number; height: number };

const FILL_WIDTH = 600;

export function fitScale(size: { width: number | 'fill'; height: number }, box: Box): number {
    const width = size.width === 'fill' ? FILL_WIDTH : size.width;
    return Math.min(1, box.width / width, box.height / size.height);
}

export function LivePreview({ module, runtime, query, box }: { module: string; runtime: GalleryRuntime; query: GalleryQuery; box: Box }): React.JSX.Element {
    const host = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [variant, setVariant] = useState<Variant>();
    const [width, setWidth] = useState(box.width);
    useEffect(() => {
        if (!host.current || typeof ResizeObserver === 'undefined') return;
        const measure = (): void => { const measured = host.current?.clientWidth; if (measured) setWidth(Math.min(measured, box.width)); };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(host.current);
        return () => observer.disconnect();
    }, [box.width]);
    useEffect(() => {
        if (!host.current || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '200px' });
        observer.observe(host.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!visible) return;
        let alive = true;
        void loadWidget(module).then(W => { if (alive) setVariant(catalogEntry(module, W.getWidgetInfo()).variants[0]); }, () => undefined);
        return () => { alive = false; };
    }, [visible, module]);
    const natural = variant ? (variant.size.width === 'fill' ? FILL_WIDTH : variant.size.width) : 0;
    const scale = variant ? fitScale(variant.size, { width, height: box.height }) : 1;
    return (
        <div className="g-live-preview" ref={host} style={{ maxWidth: box.width, height: box.height }}>
            {variant ? (
                <div style={{ width: natural * scale, height: variant.size.height * scale, flex: 'none' }}>
                    <div inert style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: natural, height: variant.size.height }}>
                        <WidgetInstance data={variant.data} module={module} query={query} runtime={runtime} size={{ width: natural, height: variant.size.height }} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
