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
    const width = variant ? (variant.size.width === 'fill' ? FILL_WIDTH : variant.size.width) : 0;
    return (
        <div className="g-live-preview" ref={host} style={{ width: box.width, height: box.height }}>
            {variant ? (
                <div inert style={{ transform: `scale(${fitScale(variant.size, box)})`, transformOrigin: '0 0', width, height: variant.size.height }}>
                    <WidgetInstance data={variant.data} module={module} query={query} runtime={runtime} size={{ width, height: variant.size.height }} />
                </div>
            ) : null}
        </div>
    );
}
