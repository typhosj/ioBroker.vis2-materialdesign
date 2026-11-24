import React, { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { installShim } from '../runtime/GalleryRxWidget';
import { createRuntime } from '../runtime/runtime';
import { DEFAULT_QUERY } from '../state';
import { mount } from '../ui/testRender';
import { LivePreview, fitScale } from './LivePreview';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeAll(() => installShim());
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

describe('fitScale', () => {
    it('never enlarges and fits the tighter axis', () => {
        expect(fitScale({ width: 160, height: 48 }, { width: 280, height: 160 })).toBe(1);
        expect(fitScale({ width: 420, height: 440 }, { width: 280, height: 160 })).toBeCloseTo(160 / 440);
        expect(fitScale({ width: 'fill', height: 64 }, { width: 300, height: 160 })).toBeCloseTo(0.5);
    });
});

describe('LivePreview', () => {
    it('loads nothing until the card scrolls into view, then renders the widget inert', async () => {
        let trigger: (entries: Array<{ isIntersecting: boolean }>) => void = () => undefined;
        vi.stubGlobal('IntersectionObserver', class { constructor(cb: typeof trigger) { trigger = cb; } observe() {} disconnect() {} });
        const view = mount(<LivePreview box={{ width: 280, height: 160 }} module="MaterialDesignSwitch" query={DEFAULT_QUERY} runtime={createRuntime({ test: true })} />);
        cleanup = () => { view.unmount(); vi.unstubAllGlobals(); };
        expect(view.root.querySelector('[inert]')).toBeNull();
        act(() => trigger([{ isIntersecting: true }]));
        await vi.waitFor(() => expect(view.root.querySelector('[inert]')?.children.length).toBeGreaterThan(0), { timeout: 15_000 });
    });
});
