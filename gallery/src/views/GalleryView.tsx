import React from 'react';

import { WidgetInstance } from '../pages/Stage';
import { translate } from '../runtime/i18n';
import type { GalleryRuntime } from '../runtime/runtime';
import { entryByTpl } from '../runtime/widgets';
import type { GalleryQuery } from '../state';
import { VIEWS } from './views';

const MAX_DEPTH = 3;
const px = (v: number | string): number => Number.parseFloat(String(v)) || 0;

export function GalleryView({ name, runtime, query, depth = 0, onNavigate, style }: { name: string; runtime: GalleryRuntime; query: GalleryQuery; depth?: number; onNavigate?(view: string): void; style?: React.CSSProperties }): React.JSX.Element {
    const view = VIEWS[name];
    if (!view || depth > MAX_DEPTH) return <div className="g-missing-view">{translate('gallery_view_missing', name)}</div>;
    return (
        <div className="g-view" data-view={name} style={{ position: 'relative', width: '100%', height: '100%', ...view.settings?.style, ...style }}>
            {Object.entries(view.widgets).map(([id, widget]) => {
                const entry = entryByTpl(widget.tpl);
                if (!entry) return null;
                return <WidgetInstance data={{ designStyle: 'default', ...widget.data }} depth={depth + 1} id={`${name}-${id}`} key={id} left={px(widget.style.left)} module={entry.module} onNavigate={onNavigate} query={query} runtime={runtime} size={{ width: px(widget.style.width), height: px(widget.style.height) }} top={px(widget.style.top)} />;
            })}
        </div>
    );
}
