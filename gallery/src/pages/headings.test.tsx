import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_QUERY } from '../state';
import { mount } from '../ui/testRender';
import { About } from './About';
import { DashboardPage } from './DashboardPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

const outline = (node: React.JSX.Element): string[] => {
    const view = mount(node); cleanup = view.unmount;
    return [...view.root.querySelectorAll('h1, h2, h3')].map(h => `${h.tagName.toLowerCase()} ${h.textContent}`);
};

describe('page headings', () => {
    it('About has one h1 and its sections are h2', () => {
        const headings = outline(<About />);
        expect(headings.filter(h => h.startsWith('h1'))).toEqual(['h1 About']);
        expect(headings.indexOf('h1 About')).toBe(0);
        expect(headings.slice(1).every(h => h.startsWith('h2'))).toBe(true);
    });
    it.each([['tablet', 'Wall tablet'], ['phone', 'Phone']])('the %s dashboard has one h1, the board name', (name, title) => {
        const headings = outline(<DashboardPage name={name} query={DEFAULT_QUERY} />);
        expect(headings).toEqual([`h1 ${title}`]);
    });
});
