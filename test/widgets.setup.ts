class TestVisRxWidget {
    props: Record<string, unknown>;
    state: { rxData: Record<string, unknown>; values: Record<string, unknown> } = { rxData: {}, values: {} };

    constructor(props: Record<string, unknown> = {}) {
        this.props = props;
    }

    static t(value: string): string {
        return value;
    }

    componentDidMount(): void {}
    componentWillUnmount(): void {}
    forceUpdate(): void {}
    renderWidgetBody(): null { return null; }
    setState(value: Record<string, unknown>): void { Object.assign(this.state, value); }

    render(): null {
        return null;
    }
}

Object.defineProperty(window, 'visRxWidget', { configurable: true, value: TestVisRxWidget });

// jsdom ships no <canvas> implementation, so its getContext() logs a
// "Not implemented" error the moment chart.js (pulled in by the chart widgets)
// touches a canvas. No test asserts on canvas pixels, so replace getContext with
// a no-op stub to keep the test output clean.
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
}

// Node 26 defines its own experimental `localStorage` global, and that getter yields undefined
// unless the process was started with --localstorage-file. It shadows the implementation jsdom
// installs, so `window.localStorage` is undefined on node 26 while it works on 22 and 24. Widgets
// only ever run in a real browser, so the missing API is a test-environment artefact — give the
// tests a plain in-memory Storage when the environment has none.
if (!window.localStorage) {
    const entries = new Map<string, string>();
    const storage: Storage = {
        get length(): number { return entries.size; },
        key: (index: number): string | null => [...entries.keys()][index] ?? null,
        getItem: (key: string): string | null => entries.get(key) ?? null,
        setItem: (key: string, value: string): void => { entries.set(key, String(value)); },
        removeItem: (key: string): void => { entries.delete(key); },
        clear: (): void => entries.clear(),
    };
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
}
