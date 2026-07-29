import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignTable from './MaterialDesignTable';

function fixture<T>(value: unknown): T { return value as T; }

function render(rxData: Record<string, unknown>): string {
    const table = new MaterialDesignTable(fixture<ConstructorParameters<typeof MaterialDesignTable>[0]>({ context: {} }));
    table.state = fixture<typeof table.state>({ rxData, values: {} });
    return renderToStaticMarkup(table.renderWidgetBody(fixture<Parameters<MaterialDesignTable['renderWidgetBody']>[0]>({})));
}

const rows = '[{"a":1},{"a":2},{"a":3},{"a":4}]';
const count = (html: string, color: string): number => html.split(`background:${color}`).length - 1;

describe('table row colors (upstream #127)', () => {
    it('paints every second row in its own color', () => {
        const html = render({ dataJson: rows, colorRowBackground: '#111111', colorRowBackgroundOdd: '#222222' });
        expect(count(html, '#111111')).toBe(2);
        expect(count(html, '#222222')).toBe(2);
    });

    it('keeps one row color when no alternating color is set', () => {
        const html = render({ dataJson: rows, colorRowBackground: '#111111' });
        expect(count(html, '#111111')).toBe(4);
    });
});
