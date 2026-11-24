import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { FilterChips } from './FilterChips';
import { SegmentedButton } from './SegmentedButton';
import { Tabs } from './Tabs';
import { key, mount } from './testRender';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

function Chips({ initial = 'a' }: { initial?: string }): React.JSX.Element {
    const [value, setValue] = useState(initial);
    return <FilterChips label="Variants" onChange={setValue} options={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B', badge: 'M3' }, { id: 'c', label: 'C' }]} value={value} />;
}

describe('FilterChips', () => {
    it('is a radio group with exactly one tab stop on the selected chip', () => {
        const view = mount(<Chips initial="b" />); cleanup = view.unmount;
        const group = view.root.querySelector('[role="radiogroup"]')!;
        expect(group.getAttribute('aria-label')).toBe('Variants');
        const chips = [...group.querySelectorAll('[role="radio"]')];
        expect(chips.map(c => c.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
        expect(chips.map(c => c.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
        expect(chips[1].textContent).toContain('M3');
    });
    it('moves and selects with arrows, wraps at both ends and jumps with Home/End', () => {
        const view = mount(<Chips />); cleanup = view.unmount;
        const chips = () => [...view.root.querySelectorAll('[role="radio"]')];
        key(chips()[0], 'ArrowLeft');
        expect(chips()[2].getAttribute('aria-checked')).toBe('true');
        expect(document.activeElement).toBe(chips()[2]);
        key(chips()[2], 'ArrowRight');
        expect(chips()[0].getAttribute('aria-checked')).toBe('true');
        key(chips()[0], 'End');
        expect(chips()[2].getAttribute('aria-checked')).toBe('true');
        key(chips()[2], 'Home');
        expect(chips()[0].getAttribute('aria-checked')).toBe('true');
    });
    it('falls back to the first chip as tab stop when the value matches no option', () => {
        const view = mount(<Chips initial="zz" />); cleanup = view.unmount;
        expect([...view.root.querySelectorAll('[role="radio"]')].map(c => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    });
});

describe('SegmentedButton', () => {
    it('marks the chosen segment pressed and reports a click', () => {
        let chosen = '';
        const view = mount(<SegmentedButton label="Theme" onChange={v => { chosen = v; }} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} value="light" />); cleanup = view.unmount;
        const buttons = [...view.root.querySelectorAll('button')];
        expect(view.root.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Theme');
        expect(buttons.map(b => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
        buttons[1].click();
        expect(chosen).toBe('dark');
    });
});

describe('Tabs', () => {
    it('links tabs and panels and activates with arrow keys', () => {
        const view = mount(<Tabs idPrefix="t" label="Sheet" tabs={[{ id: 's', label: 'Settings', panel: <p>one</p> }, { id: 'd', label: 'Data', panel: <p>two</p> }]} />); cleanup = view.unmount;
        const tabs = () => [...view.root.querySelectorAll('[role="tab"]')];
        expect(view.root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Sheet');
        expect(tabs()[0].getAttribute('aria-controls')).toBe('t-panel-s');
        expect(view.root.querySelector('#t-panel-s')!.getAttribute('aria-labelledby')).toBe('t-tab-s');
        key(tabs()[0], 'ArrowRight');
        expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
        expect(view.root.querySelector('[role="tabpanel"]:not([hidden])')!.textContent).toBe('two');
    });
});
