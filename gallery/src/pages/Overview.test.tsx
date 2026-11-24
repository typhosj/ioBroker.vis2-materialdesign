import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { FAMILIES } from '../catalog/catalog';
import { translate } from '../runtime/i18n';
import { createRuntime } from '../runtime/runtime';
import { DEFAULT_QUERY } from '../state';
import { widgetIndex } from '../runtime/widgets';
import { mount } from '../ui/testRender';
import { Overview } from './Overview';
import { FAMILY_ORDER } from './navigation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const runtime = createRuntime({ test: true });
const headings = (props: { search: string; family?: string }): string[] => {
    const view = mount(<Overview query={DEFAULT_QUERY} runtime={runtime} {...props} />); cleanup = view.unmount;
    return [...view.root.querySelectorAll('section:not([hidden]) h2')].map(h => h.textContent ?? '');
};

describe('Overview filters', () => {
    it('shows one untitled family section for a known family and all of them for an unknown one', () => {
        expect(headings({ search: '', family: 'charts' })).toEqual([]);
        cleanup();
        const only = mount(<Overview family="charts" query={DEFAULT_QUERY} runtime={runtime} search="" />); cleanup = only.unmount;
        expect(only.root.querySelectorAll('section').length).toBe(1);
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

describe('Overview search by family name', () => {
    it.each(FAMILY_ORDER)('lists every widget of the family when the search is its name (%s)', fam => {
        const name = translate(`gallery_family_${fam}`);
        const found = mount(<Overview query={DEFAULT_QUERY} runtime={runtime} search={name} />); cleanup = found.unmount;
        const expected = widgetIndex.filter(e => (FAMILIES[e.module]?.family ?? 'values') === fam).length;
        const shown = [...found.root.querySelectorAll('section')].find(sec => sec.querySelector('h2')?.textContent === name);
        expect(shown?.querySelectorAll('a.g-preview-card').length).toBe(expected);
    });
});

describe('Overview headings', () => {
    const h1s = (props: { family?: string }): string[] => {
        const view = mount(<Overview query={DEFAULT_QUERY} runtime={runtime} search="" {...props} />); cleanup = view.unmount;
        return [...view.root.querySelectorAll('h1')].map(h => h.textContent ?? '');
    };
    it('has exactly one h1, the gallery title, on the start page', () => {
        expect(h1s({})).toEqual(['Material Design widgets for vis-2']);
    });
    it('has exactly one h1, the family name, on a family page, without a repeated h2', () => {
        const view = mount(<Overview family="charts" query={DEFAULT_QUERY} runtime={runtime} search="" />); cleanup = view.unmount;
        expect([...view.root.querySelectorAll('h1')].map(h => h.textContent)).toEqual(['Charts']);
        expect(view.root.querySelectorAll('h2').length).toBe(0);
    });
    it('falls back to the start page heading for an unknown family', () => {
        expect(h1s({ family: 'nope' })).toEqual(['Material Design widgets for vis-2']);
    });
});
