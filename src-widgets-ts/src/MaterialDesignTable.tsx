import React from 'react';
import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { MAX_DYNAMIC_ITEMS, squarePreview, RenderProps, VisWidget, boundedCount, createInfo, designStyle, designStyleClasses, stateValue, sanitizeHtml } from './widgetUtils';

type Data = Record<string, unknown> & { oid?: string; dataJson?: string; countCols?: number };
type Row = Record<string, unknown>;
const s = (value: unknown, fallback = ''): string => value === undefined || value === null || value === '' || value === 'null' ? fallback : typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" ? String(value) : fallback;
const n = (value: unknown, fallback = 0): number => value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) ? fallback : Number(value);
const b = (value: unknown, fallback = false): boolean => value === undefined || value === null || value === '' ? fallback : value === true || value === 'true' || value === 1 || value === '1';
const size = (value: unknown): string | undefined => { const text = s(value); return text && text !== 'auto' ? (Number.isFinite(Number(text)) ? `${text}px` : text) : undefined; };
const valueFor = (row: Row, key: string): unknown => row[key];
function rows(input: unknown): Row[] {
    try {
        const parsed: unknown = typeof input === 'string' ? JSON.parse(input.replace(/\n/g, ' ').replace(/\t/g, '')) : input;
        if (Array.isArray(parsed)) return parsed.filter((row): row is Row => !!row && typeof row === 'object');
        if (!parsed || typeof parsed !== 'object') return [];
        return Object.values(parsed as Record<string, unknown>).map(value => value && typeof value === 'object' && '_data' in value ? (value as { _data: Row })._data : value).filter((row): row is Row => !!row && typeof row === 'object');
    } catch { return []; }
}
function bound(text: string, row: Row): string { return text.replace(/#\[obj\.(.*?)\]/g, (_all, key: string) => s(valueFor(row, key))); }

// Base MDC data-table typography came from the removed material-components-web.css bundle; only the
// colour/height overrides lived in widgets.css. The widget sets geometry inline, but the header lost its
// 500 weight and cells lost the .875rem/letter-spacing/vertical-align defaults. Re-vendor those here; they
// only apply where the editor sets no explicit font-size (inline wins otherwise).
const tableCss = '.materialdesign-table .mdc-data-table__header-cell,.materialdesign-table .mdc-data-table__cell{font-size:.875rem;vertical-align:middle}'
    + '.materialdesign-table .mdc-data-table__header-cell:focus-visible{outline:2px solid #44739e;outline-offset:-2px}'
    + '.materialdesign-table .mdc-data-table__header-cell{font-weight:500;letter-spacing:.00714em}'
    + '.materialdesign-table .mdc-data-table__cell{letter-spacing:.01786em}';
// Material 3 (Phase 7, ../../MATERIAL3_PLAN.md): card-variant surface + outline from tokens; the
// data-driven header/row/divider colors are tokenised inline in the render.
const tableM3Css = '.materialdesign-table.mdw-style-material3 .materialdesign-table-card{background:var(--md-sys-color-surface-container-low)}'
    + '.materialdesign-table.mdw-style-material3 .materialdesign-table-card--outlined{border-color:var(--md-sys-color-outline-variant)}';
const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [{ name: 'oid', label: 'oid', type: 'id' }, { name: 'dataJson', label: 'dataJson', type: 'html' }, { name: 'countCols', label: 'countCols', type: 'number', default: 1 }, { name: 'debug', label: 'debug', type: 'checkbox' }] },
    { name: 'tableLayout', label: 'group_tableLayout', fields: [{ name: 'tableLayout', label: 'tableLayout', type: 'select', options: ['standard', 'card', 'cardOutlined'], default: 'standard' }, { name: 'showHeader', label: 'showHeader', type: 'checkbox', default: true }, { name: 'fixedHeader', label: 'fixedHeader', type: 'checkbox' }, { name: 'roundBorder', label: 'roundBorder', type: 'checkbox', default: true }, { name: 'headerRowHeight', label: 'headerRowHeight', type: 'number' }, { name: 'headerTextSize', label: 'headerTextSize', type: 'text' }, { name: 'headerFontFamily', label: 'headerFontFamily', type: 'fontname' }, { name: 'rowHeight', label: 'rowHeight', type: 'number' }] },
    { name: 'color', label: 'group_color', fields: ['colorBackground', 'colorHeaderRowBackground', 'colorHeaderRowText', 'colorRowBackground', 'colorRowBackgroundHover', 'colorRowText', 'borderColor', 'dividers'].map(name => ({ name, label: name, type: 'color' as const })) },
    { name: 'columnLayout', label: 'group_columnLayout', indexFrom: 0, indexTo: 'countCols', fields: [{ name: 'showColumn', label: 'showColumn', type: 'checkbox', default: true }, { name: 'colType', label: 'colType', type: 'select', options: ['text', 'image'], default: 'text' }, { name: 'columnWidth', label: 'columnWidth', type: 'number' }, { name: 'colNoWrap', label: 'colNoWrap', type: 'checkbox' }, { name: 'label', label: 'label', type: 'html' }, { name: 'textAlign', label: 'textAlign', type: 'select', options: ['left', 'right', 'center'], default: 'center' }, { name: 'colTextSize', label: 'colTextSize', type: 'text' }, { name: 'padding_left', label: 'padding_left', type: 'number' }, { name: 'padding_right', label: 'padding_right', type: 'number' }, { name: 'fontFamily', label: 'fontFamily', type: 'fontname' }, { name: 'colTextColor', label: 'colTextColor', type: 'color' }, { name: 'prefix', label: 'prefix', type: 'html' }, { name: 'suffix', label: 'suffix', type: 'html' }, { name: 'imageSize', label: 'imageSize', type: 'number' }, { name: 'sortKey', label: 'sortKey', type: 'text' }] },
];

export default class MaterialDesignTable extends VisWidget {
    private sortKey = ''; private sortAsc = true; private hoverRow = -1;
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-Table', 'Table', attrs), visPrev: squarePreview('F04EB'), visDefaultStyle: { width: 400, height: 250 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignTable.getWidgetInfo(); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as unknown as Data;
        // Material 3 (Phase 7): unset header/row/divider colors fall back to semantic tokens; an explicit
        // saved color still wins (m3 = token when empty). Sorting, hover, data parsing unchanged.
        const isM3 = designStyle(data) === 'material3';
        const m3 = (v: unknown, token: string): string | undefined => s(v) || (isM3 ? token : undefined);
        const m3f = (v: unknown, token: string, fb: string): string => s(v) || (isM3 ? token : fb);
        const rowText = m3(data.colorRowText, 'var(--md-sys-color-on-surface)');
        const headerText = m3(data.colorHeaderRowText, 'var(--md-sys-color-on-surface)');
        const source = s(data.oid) && s(data.oid) !== 'nothing_selected' ? stateValue(this.state, s(data.oid)) : data.dataJson;
        let content = rows(source);
        const cols = Array.from({ length: boundedCount(data.countCols, 1, MAX_DYNAMIC_ITEMS - 1) + 1 }, (_, index) => index).filter(index => b(data[`showColumn${index}`], true));
        if (this.sortKey) content = [...content].sort((left, right) => { const a = valueFor(left, this.sortKey), z = valueFor(right, this.sortKey); return (a! < z! ? -1 : a! > z! ? 1 : 0) * (this.sortAsc ? 1 : -1); });
        const layout = s(data.tableLayout) === 'cardOutlined' ? ' materialdesign-table-card materialdesign-table-card--outlined' : s(data.tableLayout) === 'card' ? ' materialdesign-table-card' : '';
        const selectSort = (index: number): void => { const key = s(data[`sortKey${index}`], Object.keys(content[0] || {})[index] || ''); if (!key) return; this.sortAsc = key === this.sortKey ? !this.sortAsc : true; this.sortKey = key; this.forceUpdate(); };
        const cell = (row: Row, index: number): React.JSX.Element => { const key = Object.keys(row)[index]; const raw = key === undefined ? '' : valueFor(row, key); const prefix = bound(s(data[`prefix${index}`]), row), suffix = bound(s(data[`suffix${index}`]), row); const image = s(data[`colType${index}`]) === 'image'; return <td className="mdc-data-table__cell" style={{ color: s(data[`colTextColor${index}`]) || rowText, fontFamily: s(data[`fontFamily${index}`]), fontSize: size(data[`colTextSize${index}`]), paddingLeft: n(data[`padding_left${index}`], 8), paddingRight: n(data[`padding_right${index}`], 8), textAlign: s(data[`textAlign${index}`], 'center') as React.CSSProperties['textAlign'], whiteSpace: b(data[`colNoWrap${index}`]) ? 'nowrap' : undefined }}>{image && s(raw) ? <><span dangerouslySetInnerHTML={{ __html: sanitizeHtml(prefix) }} /><img alt="" src={s(raw)} style={{ maxHeight: n(data.rowHeight) ? n(data.rowHeight) : undefined, maxWidth: n(data[`imageSize${index}`]) || undefined, verticalAlign: 'middle' }} /><span dangerouslySetInnerHTML={{ __html: sanitizeHtml(suffix) }} /></> : <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(`${prefix}${s(raw)}${suffix}`) }} />}</td>; };
        return <div className={`materialdesign-widget materialdesign-table${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ''}`} style={{ background: s(data.colorBackground), height: '100%', overflow: b(data.fixedHeader) ? 'auto' : undefined, width: '100%' }}><style>{tableCss}{isM3 ? tableM3Css : ''}</style><div className={`mdc-data-table${layout}`} style={{ border: `1px solid ${s(data.borderColor, 'transparent')}`, borderRadius: b(data.roundBorder, true) ? undefined : 0, width: '100%' }}><table className="mdc-data-table__table" aria-label="Material Design Widgets Table" style={{ borderCollapse: 'collapse', width: '100%' }}><thead style={{ position: b(data.fixedHeader) ? 'sticky' : undefined, top: 0, zIndex: 1 }}><tr className="mdc-data-table__header-row" style={{ background: m3(data.colorHeaderRowBackground, 'var(--md-sys-color-surface-container-high)'), color: headerText, height: n(data.headerRowHeight) || undefined }}>{b(data.showHeader, true) ? cols.map(index => <th key={index} aria-sort={this.sortKey === s(data[`sortKey${index}`], Object.keys(content[0] || {})[index] || "") ? (this.sortAsc ? "ascending" : "descending") : "none"} className="mdc-data-table__header-cell" onClick={() => selectSort(index)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectSort(index); } }} scope="col" tabIndex={0} style={{ color: headerText, cursor: 'pointer', fontFamily: s(data.headerFontFamily), fontSize: size(data.headerTextSize), paddingLeft: n(data[`padding_left${index}`], 8), paddingRight: n(data[`padding_right${index}`], 8), textAlign: s(data[`textAlign${index}`], 'center') as React.CSSProperties['textAlign'], width: n(data[`columnWidth${index}`]) || undefined }}><span dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data[`label${index}`], `col ${index}`)) }} /> {this.sortKey === s(data[`sortKey${index}`], Object.keys(content[0] || {})[index] || '') ? (this.sortAsc ? '▲' : '▼') : null}</th>) : null}</tr></thead><tbody className="mdc-data-table__content">{content.map((row, rowIndex) => <tr className="mdc-data-table__row" key={rowIndex} onMouseEnter={() => { this.hoverRow = rowIndex; this.forceUpdate(); }} onMouseLeave={() => { this.hoverRow = -1; this.forceUpdate(); }} style={{ background: this.hoverRow === rowIndex ? m3f(data.colorRowBackgroundHover, 'var(--md-sys-color-surface-container-high)', s(data.colorRowBackground)) : s(data.colorRowBackground), borderBottom: `1px solid ${m3f(data.dividers, 'var(--md-sys-color-outline-variant)', 'transparent')}`, color: rowText, height: n(data.rowHeight) || undefined }}>{cols.map(index => <React.Fragment key={index}>{cell(row, index)}</React.Fragment>)}</tr>)}</tbody></table></div></div>;
    }
}
