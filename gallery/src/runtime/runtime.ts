import meta from 'virtual:gallery-meta';
import theme from 'virtual:gallery-theme';

import scenarioJson from '../../scenario/scenario.json';
import { type FakeSocket, createFakeSocket } from './fakeSocket';
import type { GalleryContext } from './GalleryRxWidget';
import { mulberry32 } from './history';
import { type Scenario, dynamicStates, validateScenario } from './scenario';
import { Store } from './store';
import { startTicker } from './ticker';

export interface GalleryRuntime { store: Store; socket: FakeSocket; scenario: Scenario; setLive(live: boolean): void; isLive(): boolean; stop(): void }

export const HISTORY_SEED = 20261123;

export function createRuntime(options: { test: boolean; now?: Date }): GalleryRuntime {
    const scenario = validateScenario(scenarioJson);
    const store = new Store({ ...theme.states, ...scenario.states, ...dynamicStates(options.now ?? new Date()) }, scenario.objects, { ackDelayMs: options.test ? 0 : 150 });
    const socket = createFakeSocket(store, { version: meta.version, history: scenario.history, seed: HISTORY_SEED });
    let live = !options.test;
    const stopTicker = options.test ? () => undefined : startTicker(store, scenario.ticker, mulberry32(HISTORY_SEED), () => !live || document.hidden);
    return { store, socket, scenario, setLive: value => { live = value; }, isLive: () => live, stop: stopTicker };
}

export function makeContext(runtime: GalleryRuntime, options: { themeType: 'light' | 'dark'; activeView: string; changeView(view: string): void; renderView: GalleryContext['renderView'] }): GalleryContext {
    return { socket: runtime.socket, setValue: (id, value) => runtime.store.setState(id, value), ...options };
}

export interface GalleryWindow { __galleryRuntime?: GalleryRuntime }

export function hostRuntime(): GalleryRuntime | undefined {
    try {
        return window.parent !== window ? (window.parent as unknown as GalleryWindow).__galleryRuntime : undefined;
    } catch {
        return undefined;
    }
}
