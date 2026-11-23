import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignList from './MaterialDesignList';

function fixture<T>(value: unknown): T { return value as T; }

function render(rxData: Record<string, unknown>): string {
    const widget = new MaterialDesignList(fixture<ConstructorParameters<typeof MaterialDesignList>[0]>({ context: {} }));
    widget.state = fixture<typeof widget.state>({ rxData, values: {} });
    return renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignList['renderWidgetBody']>[0]>({})));
}

const row = { countListItems: 1, label0: 'left', subLabel0: 'left second', rightLabel0: 'right', rightSubLabel0: 'right second' };

describe('list styling attributes', () => {
    it('spaces the divider according to its style', () => {
        expect(render({ ...row, dividers0: true, listItemDividerStyle: 'standard' })).not.toContain('margin:0 16px');
        expect(render({ ...row, dividers0: true, listItemDividerStyle: 'padded' })).toContain('margin:0 16px');
        expect(render({ ...row, dividers0: true, listItemDividerStyle: 'inset' })).toContain('margin:0 0 0 72px');
    });

    it('applies the right text fonts', () => {
        const html = render({ ...row, listItemRightFont: 'Neucha', listItemSubRightFont: 'Ubuntu-Bold' });
        expect(html).toContain('font-family:Neucha');
        expect(html).toContain('font-family:Ubuntu-Bold');
    });

    it('keeps the widget header font apart from the row header font', () => {
        const html = render({ ...row, headers: 'widget head', groupHeader0: 'row head', headerFontFamily: 'Georgia', listItemHeaderFont: 'Neucha' });
        expect(html).toContain('font-family:Neucha');
        expect(html).toContain('font-family:Georgia');
        // The row header must not inherit the widget header font any more.
        expect(html.slice(html.indexOf('<li class="mdc-list-group__subheader'))).not.toContain('Georgia');
    });

    it('orders the control against the right text', () => {
        const before = render({ ...row, listType: 'switch', oid0: 'x', distanceBetweenControlAndText: 12 });
        expect(before.indexOf('mdc-switch')).toBeLessThan(before.indexOf('right second'));
        expect(before).toContain('margin-right:12px');
        const after = render({ ...row, listType: 'switch', oid0: 'x', listControlPosition: 'right', distanceBetweenControlAndText: 12 });
        expect(after.indexOf('mdc-switch')).toBeGreaterThan(after.indexOf('right second'));
        expect(after).toContain('margin-left:12px');
    });

    it('separates the three list layouts', () => {
        expect(render(row)).not.toContain('class="materialdesign-list-card');
        const card = render({ ...row, listLayout: 'card' });
        expect(card).toContain('class="materialdesign-list-card"');
        const outlined = render({ ...row, listLayout: 'cardOutlined' });
        expect(outlined).toContain('materialdesign-list-card materialdesign-list-card--outlined');
        // Elevated card keeps the shadow, the outlined one trades it for the hairline border.
        expect(card).toContain('.materialdesign-list-card{background:var(--materialdesign-color-card-background,#fff)');
        expect(card).toContain('.materialdesign-list-card--outlined{border:1px solid var(--materialdesign-color-card-outline,rgba(0,0,0,.12));box-shadow:none}');
    });

    it('leaves the header its room instead of measuring the list against the whole box', () => {
        // Header and list are siblings: a list of `height:100%` hangs one header out of the widget box.
        const card = render({ ...row, headers: 'head', listLayout: 'card' });
        expect(card).toContain('.materialdesign-list-card{background');
        expect(card).not.toContain('height:calc(100% - 8px)');
        expect(card).toContain('flex:1 1 auto');
    });

    it('paints the list background the color group asks for', () => {
        expect(render({ ...row, listBackground: 'rgb(1,2,3)' })).toContain('background:rgb(1,2,3)');
    });

    it('positions the header image and honours the header alignment', () => {
        const left = render({ ...row, headers: 'head', headerImage: 'account', headerDistanceBetweenTextAndImage: 20, alignment: 'center' });
        expect(left).toContain('justify-content:center');
        expect(left).toContain('margin-right:20px');
        const right = render({ ...row, headers: 'head', headerImage: 'account', headerImagePosition: 'right', headerDistanceBetweenTextAndImage: 20 });
        expect(right).toContain('margin-left:20px');
        expect(right.indexOf('materialdesign-list-header"')).toBeLessThan(right.indexOf('margin-left:20px'));
        // `mdc-card` is a column flex box: it would turn the alignment vertical and stack the
        // image above the text, and draw a card frame around the header.
        expect(left).not.toContain('mdc-card');
    });

    // A fixed row height plus the clipping container swallowed the bottom padding, so the option
    // did nothing in any setting; the height has to stay a minimum for it to take part.
    it('reserves the header padding on every side', () => {
        const html = render({ ...row, headers: 'head', header_padding_top: 4, header_padding_right: 8, header_padding_bottom: 12, header_padding_left: 16 });
        expect(html).toContain('padding:4px 8px 12px 16px');
        expect(html).toContain('box-sizing:border-box');
        expect(html).toContain('min-height:60px');
        expect(html).not.toContain('height:65px');
    });
});

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountList(container: HTMLElement, rxData: Record<string, unknown>, values: Record<string, unknown>, setValue: (id: string, value: unknown) => void): () => void {
    const widget = new MaterialDesignList(fixture<ConstructorParameters<typeof MaterialDesignList>[0]>({ context: { setValue } }));
    widget.state = fixture<typeof widget.state>({ rxData, values });
    const root = createRoot(container);
    act(() => root.render(widget.renderWidgetBody(fixture<Parameters<MaterialDesignList['renderWidgetBody']>[0]>({}))));
    return () => act(() => root.unmount());
}

// The accessible name the browser would compute for the native input.
function nameOf(input: HTMLElement): string {
    const ids = input.getAttribute('aria-labelledby');
    if (ids) return ids.split(' ').map(id => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    return input.getAttribute('aria-label')?.trim() ?? '';
}

describe('list toggle rows are named', () => {
    const json = JSON.stringify([{ text: 'Lamp', subText: 'Hall', objectId: 'lamp' }, { text: '', objectId: 'empty' }, { text: '<b>Bold</b> text', objectId: 'bold' }]);
    const cases: Array<{ name: string; rxData: Record<string, unknown>; labels: string[] }> = [];
    for (const listType of ['switch', 'checkbox']) {
        for (const designStyle of ['legacy', 'material3']) {
            const base = { designStyle, listType };
            cases.push({ name: `${listType} ${designStyle} with labels`, rxData: { ...base, countListItems: 2, label0: 'Lamp', subLabel0: 'Hall', oid0: 'a', label1: 'Fan', oid1: 'b' }, labels: ['Lamp', 'Fan'] });
            cases.push({ name: `${listType} ${designStyle} without labels`, rxData: { ...base, countListItems: 2, label0: '', oid0: 'a', label1: '<b></b>', oid1: 'b' }, labels: ['Item 0', 'Item 1'] });
            cases.push({ name: `${listType} ${designStyle} JSON rows`, rxData: { ...base, listItemDataMethod: 'jsonStringObject', json_string_oid: 'rows' }, labels: ['Lamp', 'Item 1', 'Bold text'] });
        }
    }

    it.each(cases)('names every control after its label: $name', ({ rxData, labels }) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const setValue = vi.fn();
        const unmount = mountList(container, rxData, { 'rows.val': json }, setValue);
        const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
        expect(inputs.map(nameOf)).toEqual(labels);
        const sub = container.querySelector('.mdc-list-item__secondary-text');
        if (sub) expect(document.getElementById(inputs[0].getAttribute('aria-describedby') ?? '')).toBe(sub);
        act(() => inputs[0].click());
        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue.mock.calls[0][1]).toBe(true);
        unmount();
        container.remove();
    });

    it.each(cases.filter(c => c.name.endsWith('without labels')))('falls back per row: $name', ({ rxData }) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const unmount = mountList(container, rxData, {}, vi.fn());
        const [emptyText, markupOnly] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
        // label0 '' falls back to the visible text "Item 0", so the name is taken from the row.
        expect(emptyText.getAttribute('aria-label')).toBeNull();
        expect(document.getElementById(emptyText.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Item 0');
        // `<b></b>` shows nothing, so the control carries the fallback name itself.
        expect(markupOnly.getAttribute('aria-label')).toBe('Item 1');
        expect(markupOnly.hasAttribute('aria-labelledby')).toBe(false);
        unmount();
        container.remove();
    });
    it.each(['switch', 'checkbox', 'switch_readonly', 'checkbox_readonly'].flatMap(listType => ['legacy', 'material3'].map(designStyle => ({ listType, designStyle }))))('keeps the ids apart between two lists on one page:  ', ({ listType, designStyle }) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const first = document.createElement('div');
        const second = document.createElement('div');
        container.append(first, second);
        const rxData = { designStyle, listType, countListItems: 2, label0: 'Same', oid0: 'a', label1: 'Other', oid1: 'b' };
        const unmounts = [mountList(first, rxData, {}, vi.fn()), mountList(second, rxData, {}, vi.fn())];
        const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
        const ids = inputs.map(input => input.getAttribute('aria-labelledby'));
        expect(new Set(ids).size).toBe(4);
        expect(inputs.map(nameOf)).toEqual(['Same', 'Other', 'Same', 'Other']);
        const all = Array.from(container.querySelectorAll('[id]')).map(el => el.id);
        expect(new Set(all).size).toBe(all.length);
        unmounts.forEach(unmount => unmount());
        container.remove();
    });
});
