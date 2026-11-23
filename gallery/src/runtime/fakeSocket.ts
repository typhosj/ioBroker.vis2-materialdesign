import { type HistoryRule, hashString, historySeries } from './history';
import type { Store } from './store';

export type StateCallback = (id: string, state: ioBroker.State | null | undefined) => void;
export interface FakeSocketOptions { version: string; history: Record<string, HistoryRule>; seed: number }
export interface FakeSocket {
    subscribeState(ids: string | string[], cb: StateCallback): Promise<void>;
    subscribeStateAsync(ids: string | string[], cb: StateCallback): Promise<void>;
    unsubscribeState(ids: string | string[], cb?: StateCallback): void;
    getState(id: string): Promise<ioBroker.State | null>;
    getObject(id: string): Promise<ioBroker.Object | null>;
    getHistory(id: string, options: { start?: number; end?: number; count?: number }): Promise<Array<{ ts: number; val: number }>>;
    getEnums(): Promise<Record<string, never>>;
    readDir(): Promise<never[]>;
    getObjectViewSystemCached(): Promise<Record<string, never>>;
}

export const ADAPTER_OBJECT_ID = 'system.adapter.vis2-materialdesign';

const idList = (ids: string | string[]): string[] => (Array.isArray(ids) ? ids : [ids]).filter((id): id is string => typeof id === 'string' && id !== '');

export function createFakeSocket(store: Store, options: FakeSocketOptions): FakeSocket {
    const subscriptions = new Map<StateCallback, Map<string, () => void>>();
    const api: FakeSocket = {
        subscribeState(ids, cb) {
            for (const id of idList(ids)) {
                let byId = subscriptions.get(cb);
                if (!byId) {
                    byId = new Map();
                    subscriptions.set(cb, byId);
                }
                if (byId.has(id)) continue;
                byId.set(id, store.subscribe(id, cb));
                cb(id, store.getState(id));
            }
            return Promise.resolve();
        },
        subscribeStateAsync(ids, cb) {
            return api.subscribeState(ids, cb);
        },
        unsubscribeState(ids, cb) {
            for (const id of idList(ids)) {
                for (const target of cb ? [cb] : [...subscriptions.keys()]) {
                    const byId = subscriptions.get(target);
                    byId?.get(id)?.();
                    byId?.delete(id);
                }
            }
        },
        getState: id => Promise.resolve(store.getState(id)),
        getObject: id => Promise.resolve(id === ADAPTER_OBJECT_ID
            ? ({ _id: id, type: 'adapter', common: { name: 'vis2-materialdesign', version: options.version, installedVersion: options.version }, native: {} } as unknown as ioBroker.Object)
            : store.getObject(id)),
        getHistory(id, request) {
            const rule = options.history[id];
            if (!rule) return Promise.resolve([]);
            const end = Number(request.end ?? Date.now());
            const start = Number(request.start ?? end - 3_600_000);
            return Promise.resolve(historySeries(rule, start, end, Number(request.count ?? 100), options.seed + hashString(id)));
        },
        getEnums: () => Promise.resolve({}),
        readDir: () => Promise.resolve([]),
        getObjectViewSystemCached: () => Promise.resolve({}),
    };
    return new Proxy(api, {
        get(target, prop) {
            if (typeof prop === 'symbol' || prop in target) return Reflect.get(target, prop);
            // Promise resolution and JSON.stringify probe these; answering with a throwing function would break both.
            if (prop === 'then' || prop === 'toJSON') return undefined;
            return () => { throw new Error(`not simulated: ${prop}`); };
        },
    });
}
