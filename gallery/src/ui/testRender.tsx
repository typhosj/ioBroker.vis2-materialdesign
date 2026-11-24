import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

export function mount(node: React.ReactNode): { root: HTMLElement; rerender(node: React.ReactNode): void; unmount(): void } {
    const root = document.createElement('div');
    document.body.append(root);
    const reactRoot = createRoot(root);
    act(() => reactRoot.render(node));
    return {
        root,
        rerender: next => act(() => reactRoot.render(next)),
        unmount: () => { act(() => reactRoot.unmount()); root.remove(); },
    };
}

export function key(target: Element, keyName: string): void {
    act(() => { target.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true })); });
}
