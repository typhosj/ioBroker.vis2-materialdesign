import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createRuntime } from '../runtime/runtime';
import { DEFAULT_QUERY } from '../state';
import { mount } from '../ui/testRender';
import { Overview } from './Overview';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const runtime = createRuntime({ test: true });
const headings = (props: { search: string; family?: string }): string[] => {
    const view = mount(<Overview query={DEFAULT_QUERY} runtime={runtime} {...props} />); cleanup = view.unmount;
    return [...view.root.querySelectorAll('section:not([hidden]) h2')].map(h => h.textContent ?? '');
};

describe('Overview filters', () => {
    it('shows one family section for a known family and all of them for an unknown one', () => {
        expect(headings({ search: '', family: 'charts' })).toEqual(['Charts']);
        cleanup();
        expect(headings({ search: '', family: 'nope' }).length).toBeGreaterThan(5);
    });
    it('filters on the search text and shows no family section without a hit', () => {
        expect(headings({ search: 'zzzz-no-widget' })).toEqual([]);
    });
    it('says so when the search matches no widget, and not otherwise', () => {
        const miss = mount(<Overview query={DEFAULT_QUERY} runtime={runtime} search="zzzz-no-widget" />); cleanup = miss.unmount;
        expect(miss.root.querySelector('.g-no-results')?.textContent).toBe('No widget matches your search.');
        expect(miss.root.querySelector('a.g-preview-card')).toBeNull();
        cleanup();
        const hit = mount(<Overview family="charts" query={DEFAULT_QUERY} runtime={runtime} search="" />); cleanup = hit.unmount;
        expect(hit.root.querySelector('.g-no-results')).toBeNull();
    });
    it('renders one link card per widget to its widget page', () => {
        const view = mount(<Overview family="charts" query={DEFAULT_QUERY} runtime={runtime} search="" />); cleanup = view.unmount;
        const hrefs = [...view.root.querySelectorAll<HTMLAnchorElement>('a.g-preview-card')].map(a => a.getAttribute('href'));
        expect(hrefs.length).toBeGreaterThan(0);
        expect(hrefs.every(h => h!.startsWith('#/widget/'))).toBe(true);
    });
});
