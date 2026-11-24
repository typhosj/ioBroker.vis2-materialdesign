import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRuntime } from '../runtime/runtime';
import { parseRoute } from '../state';
import { mount } from '../ui/testRender';
import { navSections } from './navigation';
import { Shell } from './Shell';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const type = (input: Element, value: string): void => {
    act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

describe('navSections', () => {
    it('lists overview, every family once and dashboards and about, with the current family marked', () => {
        const sections = navSections(parseRoute('#/family/charts?theme=dark'));
        const items = sections.flatMap(s => s.items);
        expect(items.filter(i => i.current).map(i => i.href)).toEqual(['#/family/charts?theme=dark']);
        expect(items.filter(i => i.href.startsWith('#/family/')).length).toBe(11);
        expect(items.map(i => i.href)).toEqual(expect.arrayContaining(['#/?theme=dark', '#/dashboard/tablet?theme=dark', '#/about?theme=dark']));
    });
    it('marks the family of the open widget page', () => {
        const items = navSections(parseRoute('#/widget/Calendar')).flatMap(s => s.items);
        expect(items.find(i => i.current)?.href).toBe('#/family/calendar');
    });
    it('marks nothing for an unknown widget or family', () => {
        expect(navSections(parseRoute('#/widget/Nope')).flatMap(s => s.items).some(i => i.current)).toBe(false);
        expect(navSections(parseRoute('#/family/nope')).flatMap(s => s.items).some(i => i.current)).toBe(false);
    });
});

describe('Shell', () => {
    it('renders the top app bar with theme, style and language groups and a labelled navigation', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1700 });
        const view = mount(<Shell onSearch={() => undefined} route={parseRoute('#/')} runtime={createRuntime({ test: true })} search=""><p>content</p></Shell>); cleanup = view.unmount;
        const groups = [...view.root.querySelectorAll('[role="group"]')].map(g => g.getAttribute('aria-label'));
        expect(groups.length).toBe(3);
        expect(view.root.querySelector('nav')).not.toBeNull();
        expect(view.root.querySelector('input[type="search"]')).not.toBeNull();
        expect(view.root.querySelector('main')!.textContent).toBe('content');
    });
    it('hides the drawer behind a menu button below 1240 px', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
        const view = mount(<Shell onSearch={() => undefined} route={parseRoute('#/')} runtime={createRuntime({ test: true })} search=""><p /></Shell>); cleanup = view.unmount;
        expect(view.root.querySelector('nav')).toBeNull();
        act(() => view.root.querySelector<HTMLButtonElement>('.g-topbar .mdi-menu')!.click());
        expect(view.root.querySelector('nav')).not.toBeNull();
    });
    it.each(['#/widget/Switch', '#/about'])('typing in the search on %s opens the overview, keeps the query and drops the variant', from => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1700 });
        const onSearch = vi.fn();
        const view = mount(<Shell onSearch={onSearch} route={parseRoute(`${from}?theme=dark&variant=on`)} runtime={createRuntime({ test: true })} search=""><p /></Shell>); cleanup = view.unmount;
        location.hash = from;
        type(view.root.querySelector('input[type="search"]')!, 'sw');
        expect(location.hash).toBe('#/?theme=dark');
        expect(location.hash).not.toContain('variant=');
        expect(onSearch).toHaveBeenCalledWith('sw');
    });
    it('filters in place on a family page', () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1700 });
        const view = mount(<Shell onSearch={() => undefined} route={parseRoute('#/family/charts')} runtime={createRuntime({ test: true })} search=""><p /></Shell>); cleanup = view.unmount;
        location.hash = '#/family/charts';
        type(view.root.querySelector('input[type="search"]')!, 'sw');
        expect(location.hash).toBe('#/family/charts');
    });
});
