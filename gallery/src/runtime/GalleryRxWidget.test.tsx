import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSocket } from './fakeSocket';
import { type GalleryContext, GalleryRxWidget, installShim } from './GalleryRxWidget';
import { Store } from './store';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class Probe extends GalleryRxWidget {
    static getWidgetInfo(): RxWidgetInfo {
        return { id: 'tplProbe', visSet: 'x', visName: 'Probe', visAttrs: [{ name: 'common', fields: [{ name: 'oid', type: 'id' }, { name: 'label', type: 'text' }] }] } as unknown as RxWidgetInfo;
    }
    previous: Array<Record<string, unknown>> = [];
    onRxDataChanged(prev: Record<string, unknown>): void { this.previous.push(prev); }
    renderWidgetBody(): React.ReactNode {
        return <span data-probe>{`${String(this.state.rxData.label)}:${String(this.state.values[`${String(this.state.rxData.oid)}.val`])}`}</span>;
    }
}

let host: HTMLDivElement;
let root: Root;
let store: Store;
let context: GalleryContext;
let probe: Probe | null;

beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    store = new Store({ a: 1, b: 2 }, {}, { ackDelayMs: 0 });
    context = { socket: createFakeSocket(store, { version: '1', history: {}, seed: 1 }), themeType: 'light', activeView: 'v', setValue: (id, v) => store.setState(id, v), changeView: vi.fn(), renderView: name => <i data-view={name} /> };
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const show = (data: Record<string, unknown>) => act(() => root.render(<Probe ref={r => { probe = r; }} context={context} data={data} editMode={false} id="g1" style={{ width: 100, height: 40 }} tpl="tplProbe" view="v" />));
const text = () => host.querySelector('[data-probe]')?.textContent;

describe('GalleryRxWidget', () => {
    it('renders the body inside an absolutely positioned wrapper that refService points at', () => {
        show({ oid: 'a', label: 'L' });
        const wrapper = host.querySelector<HTMLDivElement>('#g1')!;
        expect(wrapper.style.position).toBe('absolute');
        expect(wrapper.style.width).toBe('100px');
        expect(probe!.refService.current).toBe(wrapper);
        expect(text()).toBe('L:1');
    });

    it('re-renders on store writes to a subscribed id', () => {
        show({ oid: 'a', label: 'L' });
        act(() => store.setState('a', 5, true));
        expect(text()).toBe('L:5');
        expect(probe!.state.values['a.ack']).toBe(true);
    });

    it('moves the subscription and reports the previous data when the data prop changes', () => {
        show({ oid: 'a', label: 'L' });
        show({ oid: 'b', label: 'M' });
        expect(text()).toBe('M:2');
        expect(probe!.previous).toEqual([{ oid: 'a', label: 'L' }]);
        expect(store.listenerCount('a')).toBe(0);
        expect(store.listenerCount('b')).toBe(1);
    });

    it('unsubscribes everything on unmount', () => {
        show({ oid: 'a', label: 'L' });
        act(() => root.render(<></>));
        expect(store.listenerCount('a')).toBe(0);
    });

    it('translates through the gallery dictionary and delegates getWidgetView', () => {
        show({ oid: 'a', label: 'L' });
        expect(Probe.t('no_such_key')).toBe('no_such_key');
        act(() => root.render(<>{probe!.getWidgetView('kitchen')}</>));
        expect(host.querySelector('[data-view="kitchen"]')).not.toBeNull();
    });

    it('installs itself as window.visRxWidget', () => {
        installShim();
        expect((window as unknown as { visRxWidget: unknown }).visRxWidget).toBe(GalleryRxWidget);
    });
});
