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

// The columns used to be `Object.keys(row)[index]` — read per row, so a row carrying one key fewer
// silently shifted every one of its columns left.
describe('table columns', () => {
    it('reads every row against the first row\'s keys', () => {
        const html = render({
            dataJson: '[{"a":"a1","b":"b1"},{"b":"b2"}]',
            countCols: 2,
        });
        // Two rows of two cells each. The second row has no "a", so its first cell stays empty and
        // "b2" belongs in its SECOND cell — reading that row's own keys put it in the first.
        const cells = html.split('<td').slice(1);
        expect(cells).toHaveLength(4);
        expect(cells[0]).toContain('a1');
        expect(cells[1]).toContain('b1');
        expect(cells[2]).not.toContain('b2');
        expect(cells[3]).toContain('b2');
    });
});
