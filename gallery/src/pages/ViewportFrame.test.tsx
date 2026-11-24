import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_QUERY } from '../state';
import { mount } from '../ui/testRender';
import { DashboardPage } from './DashboardPage';
import { ViewportFrame } from './Stage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const style = (node: React.JSX.Element): string => {
    const view = mount(node); cleanup = view.unmount;
    return view.root.querySelector('iframe')!.getAttribute('style') ?? '';
};

describe('ViewportFrame', () => {
    it('fits the window when the route names no viewport', () => {
        expect(style(<ViewportFrame path={['widget', 'Switch']} query={DEFAULT_QUERY} />)).toContain('width: 100%');
    });
    it.each([['phone', 390], ['tablet', 1920], ['desktop', 1920]] as const)('frames an explicit %s viewport', (vp, width) => {
        expect(style(<ViewportFrame path={['widget', 'Switch']} query={{ ...DEFAULT_QUERY, vp }} />)).toContain(`width: ${width}px`);
    });
    it('fits the window for an explicit fit', () => {
        expect(style(<ViewportFrame path={['widget', 'Switch']} query={{ ...DEFAULT_QUERY, vp: 'fit' }} />)).toContain('width: 100%');
    });
});

describe('DashboardPage viewport', () => {
    it.each([['tablet', 1920], ['phone', 390]] as const)('shows the %s board in its own device by default', (name, width) => {
        expect(style(<DashboardPage name={name} query={DEFAULT_QUERY} />)).toContain(`width: ${width}px`);
    });
    it('fits the window only when the route asks for fit', () => {
        expect(style(<DashboardPage name="tablet" query={{ ...DEFAULT_QUERY, vp: 'fit' }} />)).toContain('width: 100%');
    });
});
