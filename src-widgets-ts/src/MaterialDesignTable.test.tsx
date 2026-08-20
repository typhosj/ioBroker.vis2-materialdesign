import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignTable from './MaterialDesignTable';

function fixture<T>(value: unknown): T { return value as T; }

function widget(rxData: Record<string, unknown>, values: Record<string, unknown> = {}): MaterialDesignTable {
    const table = new MaterialDesignTable(fixture<ConstructorParameters<typeof MaterialDesignTable>[0]>({ context: {} }));
    table.state = fixture<typeof table.state>({ rxData, values });
    return table;
}

function render(rxData: Record<string, unknown>, values: Record<string, unknown> = {}): string {
    const table = widget(rxData, values);
    return renderToStaticMarkup(table.renderWidgetBody(fixture<Parameters<MaterialDesignTable['renderWidgetBody']>[0]>({})));
}

const rows = '[{"room":"kitchen","temp":21},{"room":"bath","temp":18},{"room":"hall","temp":25}]';

describe('table data source', () => {
    it('reads the rows from the bound state', () => {
        const html = render({ oid: 'table.0.rows', countCols: 2 }, { 'table.0.rows.val': rows });
        expect(html).toContain('kitchen');
        expect(html).toContain('25');
    });

    // `nothing_selected` is what VIS2 writes into an id field the user cleared. Treating it as a
    // real object id would look up a state that cannot exist and leave the table empty, so the
    // static dataJson has to win instead.
    it('falls back to dataJson when the oid field was cleared', () => {
        expect(render({ oid: 'nothing_selected', dataJson: rows, countCols: 2 })).toContain('kitchen');
    });

    it('renders without rows when the JSON is broken', () => {
        const html = render({ dataJson: 'not json', countCols: 2 });
        expect(html).toContain('materialdesign-table');
        expect(html).not.toContain('kitchen');
    });
});

describe('table columns', () => {
    it('hides a column the editor switched off', () => {
        const shown = render({ dataJson: rows, countCols: 2 });
        expect(shown).toContain('kitchen');
        expect(shown).toContain('21');
        const hidden = render({ dataJson: rows, countCols: 2, showColumn1: false });
        expect(hidden).toContain('kitchen');
        expect(hidden).not.toContain('>21<');
    });

    it('labels a column from the editor and falls back to a placeholder', () => {
        expect(render({ dataJson: rows, countCols: 1, label0: 'Room' })).toContain('Room');
        expect(render({ dataJson: rows, countCols: 1 })).toContain('col 0');
    });

    it('escapes markup coming out of a cell value', () => {
        const html = render({ dataJson: '[{"a":"<img src=x onerror=alert(1)>"}]', countCols: 1 });
        expect(html).not.toContain('onerror');
    });
});

describe('table sorting', () => {
    it('orders the rows by the clicked column and keeps the source untouched', () => {
        const table = widget({ dataJson: rows, countCols: 2, sortKey0: 'room' });
        const unsorted = renderToStaticMarkup(table.renderWidgetBody(fixture<Parameters<MaterialDesignTable['renderWidgetBody']>[0]>({})));
        expect(unsorted.indexOf('kitchen')).toBeLessThan(unsorted.indexOf('bath'));

        fixture<{ sortKey: string }>(table).sortKey = 'room';
        const sorted = renderToStaticMarkup(table.renderWidgetBody(fixture<Parameters<MaterialDesignTable['renderWidgetBody']>[0]>({})));
        expect(sorted.indexOf('bath')).toBeLessThan(sorted.indexOf('hall'));
        expect(sorted.indexOf('hall')).toBeLessThan(sorted.indexOf('kitchen'));
    });
});
