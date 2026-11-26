import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignIconList, { scrollIntoBox } from './MaterialDesignIconList';

function fixture<T>(value: unknown): T { return value as T; }

function render(rxData: Record<string, unknown>): string {
    const widget = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values: {} });
    return renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>({})));
}

describe('icon list SVG coloring', () => {
    const svg = { countListItems: 1, listType0: 'text', listImage0: '/backitup.admin/backitup.svg' };

    it('keeps a multi-color SVG as an image while no icon color is set', () => {
        const html = render(svg);
        expect(html).toContain('<img');
        expect(html).not.toContain('mask-image');
    });

    it('masks it only once an icon color is picked', () => {
        const html = render({ ...svg, listImageColor0: '#ff0000' });
        expect(html).toContain('mask-image');
        expect(html).toContain('#ff0000');
    });
});

describe('icon list box layout', () => {
    const list = { countListItems: 1, listType0: 'text', text0: 'row' };

    it('moves the header with its alignment and leaves it its room', () => {
        // The header row is a flex container, so `text-align` alone never moved it, and the card
        // below measured itself against the whole widget box - one header height too tall.
        const html = render({ ...list, headers: 'head', alignment: 'center', cardUse: true });
        expect(html).toContain('justify-content:center');
        expect(html).not.toContain('height:calc(100% - 6px)');
        expect(html).toContain('flex:0 0 auto');
    });

    it('reserves the header padding on every side', () => {
        const html = render({ ...list, headers: 'head', header_padding_bottom: 12 });
        expect(html).toContain('padding:6px 16px 12px 16px');
        expect(html).toContain('min-height:60px');
    });
});

// upstream-#108: in a long list the active entry could sit out of view.
describe('icon list scroll to active', () => {
    type Box = { top: number; bottom: number; left: number; right: number };
    const rect = (element: HTMLElement, box: Box): void => { element.getBoundingClientRect = () => fixture<DOMRect>(box); };
    const size = (element: HTMLElement, values: Record<string, number>): void => {
        for (const [key, value] of Object.entries(values)) Object.defineProperty(element, key, { configurable: true, value });
    };
    const scene = () => {
        const root = document.createElement('div');
        const box = document.createElement('div');
        const entry = document.createElement('div');
        box.style.overflowY = 'auto';
        box.style.overflowX = 'hidden';
        root.appendChild(box);
        box.appendChild(entry);
        size(box, { scrollHeight: 1000, clientHeight: 200, scrollWidth: 100, clientWidth: 100 });
        rect(box, { top: 0, bottom: 200, left: 0, right: 100 });
        return { root, box, entry };
    };

    it('scrolls the list box down or up just enough to show the entry', () => {
        const { root, box, entry } = scene();
        rect(entry, { top: 450, bottom: 500, left: 0, right: 100 });
        scrollIntoBox(entry, root);
        expect(box.scrollTop).toBe(300);
        rect(entry, { top: -80, bottom: -30, left: 0, right: 100 });
        box.scrollTop = 300;
        scrollIntoBox(entry, root);
        expect(box.scrollTop).toBe(220);
    });

    it('leaves a visible entry where it is and lines up an oversized one with its top', () => {
        const { root, box, entry } = scene();
        rect(entry, { top: 50, bottom: 100, left: 0, right: 100 });
        scrollIntoBox(entry, root);
        expect(box.scrollTop).toBe(0);
        rect(entry, { top: 100, bottom: 600, left: 0, right: 100 });
        scrollIntoBox(entry, root);
        expect(box.scrollTop).toBe(100);
    });

    it('scrolls a horizontal list sideways', () => {
        const { root, box, entry } = scene();
        box.style.overflowY = 'hidden';
        box.style.overflowX = 'auto';
        size(box, { scrollHeight: 200, clientHeight: 200, scrollWidth: 900, clientWidth: 100 });
        rect(entry, { top: 0, bottom: 50, left: 300, right: 360 });
        scrollIntoBox(entry, root);
        expect(box.scrollLeft).toBe(260);
    });

    it('never scrolls past the widget root, so the view and the page stay put', () => {
        const page = document.createElement('div');
        const { root, box, entry } = scene();
        size(box, { scrollHeight: 200, clientHeight: 200 });
        page.style.overflowY = 'auto';
        size(page, { scrollHeight: 5000, clientHeight: 500 });
        rect(page, { top: 0, bottom: 500, left: 0, right: 100 });
        page.appendChild(root);
        rect(entry, { top: 900, bottom: 950, left: 0, right: 100 });
        scrollIntoBox(entry, root);
        expect(page.scrollTop).toBe(0);
    });

    const list = { countListItems: 3, listType0: 'buttonState', oid0: 'a.0.x', listTypeButtonStateValue0: '1', listType1: 'buttonState', oid1: 'a.0.x', listTypeButtonStateValue1: '2', listType2: 'buttonState', oid2: 'a.0.x', listTypeButtonStateValue2: '3' };

    it('marks only the active entry', () => {
        const widget = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData: list, values: { 'a.0.x.val': 2 } });
        const html = renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>({})));
        expect(html.match(/data-active="true"/g)).toHaveLength(1);
    });

    it('follows only a change of the active entry, and only when switched on', () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const run = (scrollToActive: boolean): number[] => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const root = createRoot(container);
            const widget = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: {} }));
            // Renders with entry `value` active and lets the widget react as after a real update.
            const show = (value: number): HTMLElement => {
                widget.state = fixture<typeof widget.state>({ rxData: { ...list, scrollToActive }, values: { 'a.0.x.val': value } });
                act(() => root.render(widget.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>({}))));
                const box = container.querySelector<HTMLElement>('.materialdesign-icon-list-scroll')!;
                size(box, { scrollHeight: 1000, clientHeight: 200, scrollWidth: 100, clientWidth: 100 });
                rect(box, { top: 0, bottom: 200, left: 0, right: 100 });
                container.querySelectorAll<HTMLElement>('.materialdesign-icon-list-item').forEach((entry, index) => rect(entry, { top: 250 + 200 * index, bottom: 300 + 200 * index, left: 0, right: 100 }));
                widget.componentDidUpdate(widget.props, widget.state);
                return box;
            };
            try {
                const box = show(2);
                const first = box.scrollTop;
                // The user scrolls back; a re-render with the same active entry must leave that alone.
                box.scrollTop = 0;
                show(2);
                const unchanged = box.scrollTop;
                show(3);
                return [first, unchanged, box.scrollTop];
            } finally {
                act(() => root.unmount());
                container.remove();
            }
        };
        expect(run(true)).toEqual([300, 0, 500]);
        expect(run(false)).toEqual([0, 0, 0]);
    });

    it('offers the option as a checkbox', () => {
        const fields = MaterialDesignIconList.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; type?: string }>);
        expect(fields.find(field => field.name === 'scrollToActive')?.type).toBe('checkbox');
    });
});

describe('icon list items per row', () => {
    // Each entry carries the gap as margin on both sides; a basis of 100% / n left no room for it,
    // so with any gap only n - 1 entries fit and the last one wrapped (as in the original widget).
    it('subtracts the gaps from each entry basis, so the configured number fits in a row', () => {
        const html = render({ countListItems: 3, maxItemsperRow: 3, itemGaps: 6 });
        expect(html).toContain('flex:1 1 calc(100% / var(--materialdesign-icon-list-items-per-row) - 2 * var(--materialdesign-icon-list-items-gaps))');
        expect(html).toContain('--materialdesign-icon-list-items-per-row:3');
        expect(html).toContain('--materialdesign-icon-list-items-gaps:6px');
    });
});

describe('icon list fresh and toggle entries', () => {
    function renderWith(rxData: Record<string, unknown>, values: Record<string, unknown>): string {
        const widget = new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData, values });
        return renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignIconList['renderWidgetBody']>[0]>({})));
    }
    const toggle = { countListItems: 1, listType0: 'buttonToggle', oid0: 'a.0.x', listImage0: 'lightbulb' };
    const tint = 'rgba(68, 115, 158, 0.2)';

    it('labels an entry without text, sub text or icon, so a fresh widget shows something', () => {
        expect(render({})).toContain('Item 0');
        expect(render({ countListItems: 2, label1: 'Kitchen' })).toContain('Item 0');
        expect(render({ countListItems: 2, label1: 'Kitchen' })).not.toContain('Item 1');
    });

    it('keeps an icon-only or sub-text-only entry without a label', () => {
        expect(render({ countListItems: 1, listImage0: 'lightbulb' })).not.toContain('Item 0');
        expect(render({ countListItems: 1, listImageActive0: 'lightbulb' })).not.toContain('Item 0');
        expect(render({ countListItems: 1, subLabel0: 'second' })).not.toContain('Item 0');
        expect(render({ countListItems: 1, label0: '' })).toContain('Item 0');
        expect(render({ countListItems: 1, listType0: 'buttonToggle', oid0: 'a.0.x' })).toContain('Item 0');
    });

    it('labels blank JSON entries too, and leaves the JSON error entry as it is', () => {
        const json = { listItemDataMethod: 'jsonStringObject', json_string_oid: 'a.0.json' };
        const html = renderWith(json, { 'a.0.json.val': JSON.stringify([{}, { text: 'Kitchen' }, { image: 'lightbulb' }]) });
        expect(html).toContain('Item 0');
        expect(html).not.toContain('Item 1');
        expect(html).not.toContain('Item 2');
        const broken = renderWith(json, { 'a.0.json.val': '[{' });
        expect(broken).toContain('Error in JSON string');
        expect(broken).not.toContain('Item 0');
    });

    it('marks an active Classic toggle without its own fill, and only the active one', () => {
        expect(renderWith(toggle, { 'a.0.x.val': true })).toContain(tint);
        expect(renderWith(toggle, { 'a.0.x.val': false })).not.toContain(tint);
        expect(renderWith(toggle, {})).not.toContain(tint);
    });

    it('keeps a configured fill instead of the mark', () => {
        expect(renderWith({ ...toggle, buttonBgColor0: '#123456' }, { 'a.0.x.val': true })).not.toContain(tint);
        expect(renderWith({ ...toggle, buttonBgColor0: 'transparent' }, { 'a.0.x.val': true })).not.toContain(tint);
        expect(renderWith({ ...toggle, buttonBgColor0: 'transparent', buttonLayout: 'full' }, { 'a.0.x.val': true })).not.toContain('rgba(68, 115, 158');
        expect(renderWith({ ...toggle, buttonBgColorActive0: '#654321' }, { 'a.0.x.val': true })).toContain('#654321');
    });

    it('marks an active full-width button in both styles', () => {
        const full = { ...toggle, buttonLayout: 'full' };
        expect(renderWith(full, { 'a.0.x.val': true })).toContain('rgba(68, 115, 158, 0.08)');
        expect(renderWith(full, { 'a.0.x.val': true })).not.toContain(tint);
        expect(renderWith({ ...full, designStyle: 'material3' }, { 'a.0.x.val': true })).toContain('color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent)');
        expect(renderWith({ ...full, designStyle: 'material3' }, { 'a.0.x.val': false })).not.toContain('16%, transparent');
    });
});
