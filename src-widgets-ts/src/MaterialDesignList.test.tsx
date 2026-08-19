import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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
        expect(card).toContain('.materialdesign-list-card--outlined{border:1px solid rgba(0,0,0,.12);box-shadow:none}');
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
});
