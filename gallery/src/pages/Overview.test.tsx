import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_QUERY } from '../state';
import { mount } from '../ui/testRender';
import { Overview } from './Overview';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const headings = (props: { search: string; family?: string }): string[] => {
    const view = mount(<Overview query={DEFAULT_QUERY} {...props} />); cleanup = view.unmount;
    return [...view.root.querySelectorAll('section:not([hidden]) h2')].map(h => h.textContent ?? '');
};

describe('Overview filters', () => {
    it('shows one family section for a known family and all of them for an unknown one', () => {
        expect(headings({ search: '', family: 'charts' })).toEqual(['Charts']);
        cleanup();
        expect(headings({ search: '', family: 'nope' }).length).toBeGreaterThan(5);
    });
    it('filters on the search text and shows no family section without a hit', () => {
        expect(headings({ search: 'zzzz-no-widget' })).toEqual(['Example dashboards']);
    });
});
