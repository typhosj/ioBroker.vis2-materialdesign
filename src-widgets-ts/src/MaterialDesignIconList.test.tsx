import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignIconList from './MaterialDesignIconList';

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
