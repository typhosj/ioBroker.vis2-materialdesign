import React, { useEffect, useState } from 'react';

import type { GalleryRuntime } from '../runtime/runtime';
import { makeContext } from '../runtime/runtime';
import { type WidgetClass, loadWidget } from '../runtime/widgets';
import { defaultData } from '../runtime/widgetInfo';

const LAB: Array<{ module: string; data: Record<string, unknown>; top: number }> = [
    { module: 'MaterialDesignSwitch', data: { oid: '0_userdata.0.demo.living.light', labelTrue: 'Living room light' }, top: 20 },
    { module: 'MaterialDesignSlider', data: { oid: '0_userdata.0.demo.living.dimmer' }, top: 90 },
    { module: 'MaterialDesignValue', data: { oid: '0_userdata.0.demo.living.dimmer', suffix: ' %' }, top: 160 },
];

export function Lab({ runtime }: { runtime: GalleryRuntime }): React.JSX.Element {
    const [widgets, setWidgets] = useState<WidgetClass[]>([]);
    useEffect(() => { void Promise.all(LAB.map(entry => loadWidget(entry.module))).then(setWidgets); }, []);
    const context = makeContext(runtime, { themeType: 'light', activeView: 'lab', changeView: () => undefined, renderView: name => <div>{name}</div> });
    return (
        <div style={{ position: 'relative', height: 260 }}>
            {widgets.map((Widget, i) => (
                <Widget context={context} data={{ ...defaultData(Widget.getWidgetInfo()), designStyle: 'default', ...LAB[i].data }} editMode={false} id={`lab${i}`} key={LAB[i].module} style={{ left: 20, top: LAB[i].top, width: 320, height: 56 }} tpl={Widget.getWidgetInfo().id} view="lab" />
            ))}
        </div>
    );
}
