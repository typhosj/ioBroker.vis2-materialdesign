import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { NavDrawer } from './NavDrawer';
import { Sheet } from './Sheet';
import { key, mount } from './testRender';
import { windowClassFor } from './useWindowClass';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

describe('windowClassFor', () => {
    it('uses the M3 window class boundaries', () => {
        expect([0, 599, 600, 1239, 1240, 1599, 1600].map(windowClassFor)).toEqual(['compact', 'compact', 'medium', 'medium', 'expanded', 'expanded', 'large']);
    });
});

describe('Sheet', () => {
    it('traps focus while modal, closes on Escape and returns focus to the opener', () => {
        const opener = document.createElement('button'); document.body.append(opener); opener.focus();
        let open = true; const held: { view?: ReturnType<typeof mount> } = {};
        const render = (): React.JSX.Element => <Sheet label="Settings" modal onClose={() => { open = false; held.view?.rerender(render()); }} open={open} side="end"><button type="button">first</button><button type="button">last</button></Sheet>;
        const view = mount(render()); held.view = view; cleanup = () => { view.unmount(); opener.remove(); };
        const dialog = view.root.querySelector('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-label')).toBe('Settings');
        expect(dialog.contains(document.activeElement)).toBe(true);
        const buttons = [...dialog.querySelectorAll('button')];
        buttons[buttons.length - 1].focus();
        key(buttons[buttons.length - 1], 'Tab');
        expect(document.activeElement).toBe(buttons[0]);
        key(dialog, 'Escape');
        expect(view.root.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(opener);
    });
    it('keeps focus on an input inside the sheet when the parent re-renders with a new onClose', () => {
        const opener = document.createElement('button'); document.body.append(opener); opener.focus();
        const render = (): React.JSX.Element => <Sheet closeLabel="Close" label="Settings" modal onClose={() => undefined} open side="end"><button type="button">before</button><input /></Sheet>;
        const view = mount(render()); cleanup = () => { view.unmount(); opener.remove(); };
        const input = view.root.querySelector('input')!;
        input.focus();
        view.rerender(render());
        expect(document.activeElement).toBe(input);
        expect(view.root.querySelector('.g-sheet-close')!.getAttribute('aria-label')).toBe('Close');
    });
    it('renders a fixed sheet as a complementary region without a trap', () => {
        const view = mount(<Sheet label="Settings" modal={false} onClose={() => undefined} open side="end"><p>x</p></Sheet>); cleanup = view.unmount;
        expect(view.root.querySelector('aside[aria-label="Settings"]')).not.toBeNull();
        expect(view.root.querySelector('[role="dialog"]')).toBeNull();
    });
});

describe('focus trap on the document', () => {
    const openSheet = (): { view: ReturnType<typeof mount>; opener: HTMLButtonElement; isOpen: () => boolean } => {
        const opener = document.createElement('button'); document.body.append(opener); opener.focus();
        let open = true; const held: { view?: ReturnType<typeof mount> } = {};
        const render = (): React.JSX.Element => <Sheet label="Settings" modal onClose={() => { open = false; held.view?.rerender(render()); }} open={open} side="end"><button type="button">first</button><button type="button">last</button></Sheet>;
        const view = mount(render()); held.view = view; cleanup = () => { view.unmount(); opener.remove(); };
        return { view, opener, isOpen: () => open };
    };
    it('wraps Shift+Tab from the dialog node to the last focusable', () => {
        const { view } = openSheet();
        const dialog = view.root.querySelector<HTMLElement>('[role="dialog"]')!;
        dialog.focus();
        key(dialog, 'Tab', { shiftKey: true });
        const buttons = [...dialog.querySelectorAll('button')];
        expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    });
    it('sends Tab from the dialog node to the first focusable', () => {
        const { view } = openSheet();
        const dialog = view.root.querySelector<HTMLElement>('[role="dialog"]')!;
        dialog.focus();
        key(dialog, 'Tab');
        expect(document.activeElement).toBe(dialog.querySelector('button'));
    });
    it('closes on Escape while focus is on the body and returns focus to the opener', () => {
        const { view, opener, isOpen } = openSheet();
        (document.activeElement as HTMLElement).blur();
        expect(document.activeElement).toBe(document.body);
        key(document.body, 'Escape');
        expect(isOpen()).toBe(false);
        expect(view.root.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(opener);
    });
    it('treats Tab with focus outside the dialog as the edge', () => {
        const { view } = openSheet();
        const dialog = view.root.querySelector<HTMLElement>('[role="dialog"]')!;
        (document.activeElement as HTMLElement).blur();
        key(document.body, 'Tab');
        expect(document.activeElement).toBe(dialog.querySelector('button'));
    });
    it('pulls focus that lands outside the open dialog back inside', () => {
        const { view } = openSheet();
        const outside = document.createElement('button'); document.body.append(outside);
        outside.focus();
        expect(view.root.querySelector('[role="dialog"]')!.contains(document.activeElement)).toBe(true);
        outside.remove();
    });
    it('traps Tab in a modal NavDrawer and closes it on Escape, returning focus to the opener', () => {
        const opener = document.createElement('button'); document.body.append(opener); opener.focus();
        let open = true; const held: { view?: ReturnType<typeof mount> } = {};
        const render = (): React.JSX.Element => <NavDrawer footer={<button type="button">reset</button>} label="Navigation" modal onClose={() => { open = false; held.view?.rerender(render()); }} open={open} sections={[{ items: [{ href: '#/', label: 'Overview', icon: 'home', current: true }] }]} />;
        const view = mount(render()); held.view = view; cleanup = () => { view.unmount(); opener.remove(); };
        const dialog = view.root.querySelector<HTMLElement>('[role="dialog"]')!;
        const items = [...dialog.querySelectorAll<HTMLElement>('a[href], button')];
        items[items.length - 1].focus();
        key(dialog, 'Tab');
        expect(document.activeElement).toBe(items[0]);
        dialog.focus();
        key(dialog, 'Tab', { shiftKey: true });
        expect(document.activeElement).toBe(items[items.length - 1]);
        (document.activeElement as HTMLElement).blur();
        key(document.body, 'Escape');
        expect(open).toBe(false);
        expect(document.activeElement).toBe(opener);
    });
});

describe('NavDrawer', () => {
    it('marks the current page and labels the sections', () => {
        const view = mount(<NavDrawer label="Navigation" modal={false} onClose={() => undefined} open sections={[{ items: [{ href: '#/', label: 'Overview', icon: 'home', current: false }] }, { label: 'Widgets', items: [{ href: '#/family/buttons', label: 'Buttons', icon: 'gesture-tap-button', current: true }] }]} />); cleanup = view.unmount;
        const nav = view.root.querySelector('nav[aria-label="Navigation"]')!;
        expect(nav.querySelector('[aria-current="page"]')!.textContent).toContain('Buttons');
        expect(nav.querySelectorAll('[aria-current]').length).toBe(1);
        expect(nav.textContent).toContain('Widgets');
    });
    it('is not in the DOM while modal and closed', () => {
        const view = mount(<NavDrawer label="Navigation" modal onClose={() => undefined} open={false} sections={[]} />); cleanup = view.unmount;
        expect(view.root.querySelector('nav')).toBeNull();
    });
});
