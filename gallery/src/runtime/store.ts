export type StateListener = (id: string, state: ioBroker.State | null) => void;
export interface StoreOptions { ackDelayMs?: number; now?: () => number }

const FROM = 'system.adapter.gallery.0';

export class Store {
    private readonly states = new Map<string, ioBroker.State>();
    private readonly listeners = new Map<string, Set<StateListener>>();
    private readonly ackTimers = new Map<string, number>();
    private readonly initial: Record<string, ioBroker.StateValue>;
    private readonly objects: Record<string, ioBroker.Object>;
    private readonly options: StoreOptions;

    constructor(initial: Record<string, ioBroker.StateValue>, objects: Record<string, ioBroker.Object>, options: StoreOptions = {}) {
        this.initial = initial;
        this.objects = objects;
        this.options = options;
        this.load();
    }

    private now(): number {
        return this.options.now?.() ?? Date.now();
    }

    private load(): void {
        const ts = this.now();
        this.states.clear();
        for (const [id, val] of Object.entries(this.initial)) {
            this.states.set(id, { val, ack: true, ts, lc: ts, from: FROM, q: 0 });
        }
    }

    getState(id: string): ioBroker.State | null {
        return this.states.get(id) ?? null;
    }

    getObject(id: string): ioBroker.Object | null {
        return this.objects[id] ?? null;
    }

    ids(): string[] {
        return [...this.states.keys()].sort();
    }

    setState(id: string, val: ioBroker.StateValue, ack = false): void {
        const old = this.states.get(id);
        const ts = this.now();
        const state: ioBroker.State = { val, ack, ts, lc: old && old.val === val ? old.lc : ts, from: FROM, q: 0 };
        this.states.set(id, state);
        window.clearTimeout(this.ackTimers.get(id));
        this.ackTimers.delete(id);
        this.emit(id, state);
        if (ack) return;
        const confirm = (): void => {
            this.ackTimers.delete(id);
            if (this.states.get(id) === state) this.setState(id, val, true);
        };
        const delay = this.options.ackDelayMs ?? 150;
        if (delay <= 0) confirm();
        else this.ackTimers.set(id, window.setTimeout(confirm, delay));
    }

    subscribe(id: string, listener: StateListener): () => void {
        let set = this.listeners.get(id);
        if (!set) {
            set = new Set();
            this.listeners.set(id, set);
        }
        set.add(listener);
        return () => {
            set.delete(listener);
            if (!set.size) this.listeners.delete(id);
        };
    }

    listenerCount(id: string): number {
        return this.listeners.get(id)?.size ?? 0;
    }

    reset(): void {
        this.ackTimers.forEach(timer => window.clearTimeout(timer));
        this.ackTimers.clear();
        this.load();
        for (const id of [...this.listeners.keys()]) this.emit(id, this.getState(id));
    }

    private emit(id: string, state: ioBroker.State | null): void {
        this.listeners.get(id)?.forEach(listener => listener(id, state));
    }
}
