import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import type React from 'react';

import index from '../generated/widgetIndex.json';
import type { GalleryWidgetProps } from './GalleryRxWidget';

export interface WidgetIndexEntry { module: string; tpl: string; name: string }
export type WidgetClass = React.ComponentClass<GalleryWidgetProps> & { getWidgetInfo(): RxWidgetInfo };

const loaders = import.meta.glob<{ default: WidgetClass }>(['../../../src-widgets-ts/src/MaterialDesign*.tsx', '!../../../src-widgets-ts/src/*.test.tsx']);

export const widgetModulePaths = Object.keys(loaders);

export const widgetIndex: readonly WidgetIndexEntry[] = index;

export function entryByModule(module: string): WidgetIndexEntry | undefined {
    return widgetIndex.find(entry => entry.module === module);
}

export function entryByTpl(tpl: string): WidgetIndexEntry | undefined {
    return widgetIndex.find(entry => entry.tpl === tpl);
}

export async function loadWidget(module: string): Promise<WidgetClass> {
    const loader = loaders[`../../../src-widgets-ts/src/${module}.tsx`];
    if (!loader) throw new Error(`unknown widget module: ${module}`);
    return (await loader()).default;
}
