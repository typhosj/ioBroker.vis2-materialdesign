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

    it('positions the header image and honours the header alignment', () => {
        const left = render({ ...row, headers: 'head', headerImage: 'account', headerDistanceBetweenTextAndImage: 20, alignment: 'center' });
        expect(left).toContain('justify-content:center');
        expect(left).toContain('margin-right:20px');
        const right = render({ ...row, headers: 'head', headerImage: 'account', headerImagePosition: 'right', headerDistanceBetweenTextAndImage: 20 });
        expect(right).toContain('margin-left:20px');
        expect(right.indexOf('materialdesign-list-header"')).toBeLessThan(right.indexOf('margin-left:20px'));
    });
});
