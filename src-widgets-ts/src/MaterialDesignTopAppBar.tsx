import React from 'react';
import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { renderIcon } from './MaterialDesignButtons';
import { MAX_DYNAMIC_ITEMS, passWrapperClicks, squarePreview, RenderProps, VisWidget, createInfo, indexedFields, itemCount, designStyle, designStyleClasses, legacyAccent, legacyInk, legacySurface, m3OnColor, iconField, liftWidgetLayer, safeWidgetUrl, setStateValue, sizeCss, stateValue, sanitizeHtml, boolValue as b, numberValue as n, textValue as s } from './widgetUtils';

type Item = { menuId?: string; text?: string; header?: string; divider?: boolean; icon?: string; iconColor?: string; subMenuIconColor?: string; setValueOnMenuToggleClick?: boolean; subMenus?: Item[]; empty?: boolean; url?: string; urlTarget?: string };
type Data = Record<string, unknown> & { oid?: string; navItemCount?: number; drawerItemsDataMethod?: string; drawerItemsJsonString?: string };
type Entry = { item: Item; index: number; depth: number; parent?: Entry; children: Entry[] };
const MAX_SUBMENU_DEPTH = 10;
const px = (v: unknown): string | undefined => { const text = s(v); return text ? (Number.isFinite(Number(text)) ? `${text}px` : text) : undefined; };
// An entry that is no object still takes its number, as a plain "Menu Item": saved views switch on
// those numbers, and the one-level drawer numbered such entries too.
const asItem = (v: unknown): Item => (typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {});
// Empty input is not a broken JSON string, it is a drawer that has not been filled in yet -- an
// error item there greets every freshly inserted widget. Only real content can be malformed.
function parse(v: unknown): Item[] { if (s(v) === '') return []; try { const result: unknown = JSON.parse(s(v)); return Array.isArray(result) ? result.slice(0, MAX_DYNAMIC_ITEMS).map(asItem) : [{ text: 'Error in JSON string', icon: 'alert', iconColor: 'red' }]; } catch { return [{ text: 'Error in JSON string', icon: 'alert', iconColor: 'red' }]; } }
// The object id gets the depth-first number of an entry: the entry, its whole submenu tree, then the
// next entry. With one submenu level that is the numbering saved views already switch on.
function flatten(list: Item[]): Entry[] {
    const flat: Entry[] = [];
    const walk = (children: Item[], parent?: Entry): void => children.forEach(item => {
        const entry: Entry = { item, index: flat.length, depth: parent ? parent.depth + 1 : 0, parent, children: [] };
        flat.push(entry);
        parent?.children.push(entry);
        if (entry.depth < MAX_SUBMENU_DEPTH && Array.isArray(item.subMenus)) walk(item.subMenus.map(asItem), entry);
    });
    walk(list);
    return flat;
}
const ancestors = (entry: Entry): Entry[] => (entry.parent ? [...ancestors(entry.parent), entry.parent] : []);
function items(data: Data): Item[] { if (s(data.drawerItemsDataMethod, 'inputPerEditor') === 'jsonStringObject') return parse(data.drawerItemsJsonString); return Array.from({ length: itemCount(data.navItemCount) }, (_, i) => { let subMenus: Item[] | undefined; if (s(data[`submenus${i}`])) subMenus = parse(data[`submenus${i}`]); const empty = !s(data[`labels${i}`]) && !s(data[`iconDrawer${i}`]) && !s(data[`headers${i}`]) && !s(data[`menuId${i}`]) && !(subMenus && subMenus.length); return { menuId: s(data[`menuId${i}`]), text: s(data[`labels${i}`], 'Menu Item'), header: s(data[`headers${i}`]), divider: b(data[`dividers${i}`]), icon: s(data[`iconDrawer${i}`]), iconColor: s(data[`iconDrawerColor${i}`], s(data.iconDrawerColor, '#44739e')), subMenuIconColor: s(data[`subIconDrawerColor${i}`], s(data.subIconDrawerColor, '#44739e')), setValueOnMenuToggleClick: b(data[`setValueOnMenuToggleClick${i}`]), subMenus, empty, url: s(data[`url${i}`]), urlTarget: s(data[`urlTarget${i}`]) }; }); }
// A menu entry with a URL opens that page instead of selecting a view (upstream-#123). The JSON
// string may come from a state, so the URL goes through the same filter as every other widget link.
function openUrl(url: unknown, target: unknown): void {
    const href = safeWidgetUrl(url);
    if (!href) return;
    if (target === '_self') window.location.assign(href);
    else window.open(href, '_blank', 'noopener,noreferrer');
}
const isSlide = (data: Data): boolean => s(data.subMenuMode) === 'slide';
function isPermanent(data: Data): boolean {
    return s(data.drawerLayout) === 'permanent' || (s(data.drawerLayout) === 'auto' && typeof window !== 'undefined' && window.innerWidth >= n(data.permanentIfResolutionHigherThan, 800));
}

const SWIPE_EDGE = 24;
export function swipeAction(start: { x: number; y: number }, end: { x: number; y: number }, screenWidth: number, right: boolean, open: boolean): 'open' | 'close' | null {
    const inward = (end.x - start.x) * (right ? -1 : 1);
    if (Math.abs(inward) < 50 || Math.abs(inward) < 2 * Math.abs(end.y - start.y)) return null;
    if (open) return inward < 0 ? 'close' : null;
    const fromEdge = right ? start.x >= screenWidth - SWIPE_EDGE : start.x <= SWIPE_EDGE;
    return inward > 0 && fromEdge ? 'open' : null;
}

const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [{ name: 'oid', label: 'oid', type: 'id' }, { name: 'showIndexNum', label: 'showIndexNum', type: 'checkbox' }, { name: 'navItemCount', label: 'navItemCount', type: 'number', default: 1 }, { name: 'navDefaultValue', label: 'navDefaultValue', type: 'number', default: 0 }, { name: 'navDisableDefaultValue', label: 'navDisableDefaultValue', type: 'checkbox' }, { name: 'selectedItemName_oid', label: 'selectedItemName_oid', type: 'id' }] },
    { name: 'topAppBarLayout', label: 'group_topAppBarLayout', fields: [{ name: 'topAppBarLayout', label: 'topAppBarLayout', type: 'select', options: ['standard', 'dense', 'short'], default: 'standard' }, { name: 'showOnlyMenuButton', label: 'showOnlyMenuButton', type: 'checkbox' }, { name: 'titleTopAppBar', label: 'titleTopAppBar', type: 'html', default: 'Material Design Widgets' }, { name: 'colorTopAppBarTitle', label: 'colorTopAppBarTitle', type: 'color' }, { name: 'colorTopAppBarBackground', label: 'colorTopAppBarBackground', type: 'color' }, { name: 'titleFont', label: 'titleFont', type: 'fontname' }, { name: 'titleFontSize', label: 'titleFontSize', type: 'number' }, { name: 'topAppBarIconColor', label: 'topAppBarIconColor', type: 'color' }, { name: 'showSelectedItemAsTitle', label: 'showSelectedItemAsTitle', type: 'checkbox', default: true }, { name: 'showSelectedItemIconInTitle', label: 'showSelectedItemIconInTitle', type: 'checkbox', default: true }, { name: 'iconTitleHeight', label: 'iconTitleHeight', type: 'dimension' }, { name: 'titleDistanceBetweenTextAndImage', label: 'distanceBetweenTextAndImage', type: 'number' }, { name: 'titleIconPosition', label: 'iconPosition', type: 'select', options: ['left', 'right'], default: 'left' }, { name: 'topAppBarZ_index', label: 'topAppBarZ_index', type: 'number', default: 998 }, { name: 'vibrateTopAppBarOnMobilDevices', label: 'vibrateTopAppBarOnMobilDevices', type: 'number', default: 50 }] },
    { name: 'drawerLayout', label: 'group_drawerLayout', fields: [{ name: 'drawerLayout', label: 'drawerLayout', type: 'select', options: ['modal', 'permanent', 'auto'], default: 'modal' }, { name: 'drawerPosition', label: 'drawerPosition', type: 'select', options: ['left', 'right'], default: 'left' }, { name: 'openDrawerBySwipe', label: 'openDrawerBySwipe', type: 'checkbox' }, { name: 'permanentIfResolutionHigherThan', label: 'permanentIfResolutionHigherThan', type: 'number', default: 800 }, { name: 'listItemDividerStyle', label: 'listItemDividerStyle', type: 'select', options: ['standard', 'padded', 'inset'], default: 'standard' }, { name: 'drawerWidth', label: 'drawerWidth', type: 'number' }, { name: 'z_index', label: 'z_index', type: 'number', default: 1000 }, { name: 'showHeader', label: 'showHeader', type: 'checkbox', default: true }, { name: 'headerLabel', label: 'headerLabel', type: 'html' }, { name: 'showLabels', label: 'showLabels', type: 'checkbox', default: true }, { name: 'subMenuMode', label: 'subMenuMode', type: 'select', options: ['inline', 'slide'].map(value => ({ value, label: `subMenuMode_${value}` })), default: 'inline' }, { name: 'collapseOtherSubMenus', label: 'collapseOtherSubMenus', type: 'checkbox', hidden: isSlide }, { name: 'collapseSubMenusOnClose', label: 'collapseSubMenusOnClose', type: 'checkbox' }, { name: 'drawerIconHeight', label: 'drawerIconHeight', type: 'number' }, { name: 'listItemAlignment', label: 'listItemAlignment', type: 'select', options: ['left', 'center', 'right'], default: 'left' }, { name: 'listItemTextFont', label: 'listItemTextFont', type: 'fontname' }, { name: 'listItemHeaderFont', label: 'listItemHeaderFont', type: 'fontname' }, { name: 'listItemTextSize', label: 'listItemTextSize', type: 'text' }, { name: 'vibrateDrawerOnMobilDevices', label: 'vibrateDrawerOnMobilDevices', type: 'number' }] },
    { name: 'drawerColors', label: 'group_drawerColors', fields: ['colorDrawerBackground', 'colorDrawerItemBackground', 'colorDrawerHeaderBackground', 'colorDrawerHeaderText', 'iconDrawerColor', 'iconDrawerColorSelected', 'subIconDrawerColor', 'subIconDrawerColorSelected', 'colorListItemHover', 'colorListItemSelected', 'colorListItemText', 'colorListItemTextSelected', 'colorListItemHeaders', 'colorListItemDivider', 'colorSubItemToggleIcon'].map(name => ({ name, label: name, type: 'color' as const })) },
    { name: 'drawerSubItemsLayout', label: 'group_drawerSubItemsLayout', fields: [{ name: 'listSubItemDividerStyle', label: 'listSubItemDividerStyle', type: 'select', options: ['standard', 'padded', 'inset'], default: 'standard' }, { name: 'colorListSubItemDivider', label: 'colorListSubItemDivider', type: 'color' }, { name: 'drawerSubItemIconHeight', label: 'drawerSubItemIconHeight', type: 'number' }, { name: 'listSubItemAlignment', label: 'listSubItemAlignment', type: 'select', options: ['left', 'center', 'right'], default: 'left' }, { name: 'listItemSubTextFont', label: 'listItemSubTextFont', type: 'fontname' }, { name: 'listSubItemTextSize', label: 'listSubItemTextSize', type: 'text' }, { name: 'showSubItemsLabels', label: 'showSubItemsLabels', type: 'checkbox', default: true }] },
    { name: 'drawerSubItemsColors', label: 'group_drawerSubItemsColors', fields: ['colorDrawerSubBackground', 'colorDrawerSubItemBackground', 'colorListSubItemHover', 'colorListSubItemSelected', 'colorListSubItemText', 'colorListSubItemTextSelected'].map(name => ({ name, label: name, type: 'color' as const })) },
    { name: 'drawerItemsData', label: 'group_drawerItemsData', fields: [{ name: 'drawerItemsDataMethod', label: 'drawerItemsDataMethod', type: 'select', options: ['inputPerEditor', 'jsonStringObject'], default: 'inputPerEditor' }, { name: 'drawerItemsJsonString', label: 'drawerItemsJsonString', type: 'html' }] },
    { name: 'drawerItems', label: 'group_drawerItems', indexFrom: 0, indexTo: 'navItemCount', hidden: (data: Data) => s(data.drawerItemsDataMethod, 'inputPerEditor') !== 'inputPerEditor', fields: indexedFields([{ name: 'menuId', label: 'menuId', type: 'text' }, { name: 'labels', label: 'labels', type: 'html' }, { name: 'headers', label: 'headers', type: 'html' }, { name: 'dividers', label: 'dividers', type: 'checkbox' }, iconField('iconDrawer', 'iconDrawer'), { name: 'iconDrawerColor', label: 'iconDrawerColor', type: 'color' }, { name: 'subIconDrawerColor', label: 'subIconDrawerColor', type: 'color' }, { name: 'setValueOnMenuToggleClick', label: 'setValueOnMenuToggleClick', type: 'checkbox' }, { name: 'submenus', label: 'submenus', type: 'html' }, { name: 'url', label: 'url', type: 'url' }, { name: 'urlTarget', label: 'urlTarget', type: 'select', options: ['_blank', '_self'], default: '_blank' }], data => itemCount(data.navItemCount)) },
];
// The app-bar flex layout, bar elevation and drawer edge came from the removed
// material-components-web.css: without them the section never fills the 64px row and the title
// clings to the top.
const barCss = '.materialdesign-topAppBar-with-Drawer .mdc-top-app-bar{box-shadow:0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12)}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-top-app-bar__row{display:flex;position:relative;box-sizing:border-box;width:100%}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-top-app-bar__section{display:inline-flex;flex:1 1 auto;align-items:center;min-width:0;padding:8px 12px;box-sizing:border-box}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-top-app-bar__title{padding-left:20px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-drawer--dismissible{border-right:1px solid rgba(0,0,0,.12)}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-drawer--dismissible.mdw-drawer-right{border-right:0;border-left:1px solid rgba(0,0,0,.12)}'
    // Legacy drawer items were rounded pills supplied by the base MDC bundle; inline colours still win.
    + '.materialdesign-topAppBar-with-Drawer .mdc-drawer .mdc-list-item{font-size:.875rem;font-weight:500;border-radius:4px;margin:4px 8px}'
    + '.materialdesign-topAppBar-with-Drawer .mdc-drawer .mdc-list-item--activated{background:rgba(68,115,158,.12);color:var(--materialdesign-color-drawer-accent,#44739e)}';
const barM3Css = '.materialdesign-topAppBar-with-Drawer.mdw-style-material3 .mdc-drawer .mdc-list-item{color:var(--md-sys-color-on-surface)}'
    + '.materialdesign-topAppBar-with-Drawer.mdw-style-material3 .mdc-drawer .mdc-list-item--activated{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}'
    + '.materialdesign-topAppBar-with-Drawer.mdw-style-material3 .mdc-drawer--dismissible{border-right-color:var(--md-sys-color-outline-variant)}'
    + '.materialdesign-topAppBar-with-Drawer.mdw-style-material3 .mdc-drawer--dismissible.mdw-drawer-right{border-left-color:var(--md-sys-color-outline-variant)}';
const slideCss = '.materialdesign-topAppBar-with-Drawer .mdw-slide-from-end{animation:mdw-slide-from-end .15s ease-out}'
    + '.materialdesign-topAppBar-with-Drawer .mdw-slide-from-start{animation:mdw-slide-from-start .15s ease-out}'
    + '@keyframes mdw-slide-from-end{from{transform:translateX(24px);opacity:0}}@keyframes mdw-slide-from-start{from{transform:translateX(-24px);opacity:0}}'
    + '@media (prefers-reduced-motion:reduce){.materialdesign-topAppBar-with-Drawer .mdw-slide{animation:none}}';

export default class MaterialDesignTopAppBar extends VisWidget {
    private open = false; private expanded = new Set<number>(); private lastSelected = -1;
    // The entry whose submenu fills the drawer when submenus open in place of the list; null is the first level.
    private drill: number | null = null; private slideMove: '' | 'forward' | 'back' = '';
    private swipeStart: { x: number; y: number; open: boolean } | null = null;
    private root: HTMLElement | null = null;
    private readonly onTouchStart = (event: TouchEvent): void => {
        this.swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, open: this.open } : null;
    };
    private readonly onTouchEnd = (event: TouchEvent): void => {
        const start = this.swipeStart;
        this.swipeStart = null;
        const data = this.state.rxData as unknown as Data;
        const touch = event.changedTouches[0];
        if (!start || !touch || !b(data.openDrawerBySwipe) || this.props.editMode || isPermanent(data) || start.open !== this.open) return;
        // The listener sits on the document, and vis-2 keeps views with "always render" mounted while
        // another view is shown: their bars must not open a drawer for a swipe meant for this one.
        if (!this.root?.getClientRects().length) return;
        const action = swipeAction(start, { x: touch.clientX, y: touch.clientY }, window.innerWidth, s(data.drawerPosition) === 'right', this.open);
        if (action === 'open') { this.open = true; this.forceUpdate(); } else if (action === 'close') this.closeDrawer(data);
    };
    componentDidMount(): void {
        super.componentDidMount();
        document.addEventListener('touchstart', this.onTouchStart, { passive: true });
        document.addEventListener('touchend', this.onTouchEnd, { passive: true });
    }
    componentWillUnmount(): void {
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchend', this.onTouchEnd);
        super.componentWillUnmount?.();
    }
    private closeDrawer(data: Data): void { this.open = false; if (b(data.collapseSubMenusOnClose)) { this.expanded.clear(); this.drill = null; } this.slideMove = ''; this.forceUpdate(); }
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-TopAppBar-Navigation', 'Top App Bar', attrs, ['drawerColors', 'drawerSubItemsLayout', 'drawerSubItemsColors']), visPrev: squarePreview('F06FC'), visDefaultStyle: { width: 400, height: 270 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignTopAppBar.getWidgetInfo(); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props); const data = this.state.rxData as unknown as Data;
        const isM3 = designStyle(data) === 'material3';
        const m3f = (v: unknown, token: string, fb: string): string => s(v) || (isM3 ? token : fb);
        // The classic drawer surface follows the theme now; its entries inherit the page color, which
        // was white on white while the surface stayed fixed white and vis-2 ran dark.
        // The drawer paints its own surface — a theme binding can even make it dark on a light page —
        // while its entries used to inherit the page color: black on a dark drawer, white on a white
        // one. They take the ink the surface asks for now, and the page theme where the surface is a
        // CSS variable this code cannot read.
        const drawerSurface = m3f(data.colorDrawerBackground, 'var(--md-sys-color-surface)', legacySurface(this.isDarkTheme()));
        const drawerInk = isM3 ? 'var(--md-sys-color-on-surface)' : m3OnColor(drawerSurface) || legacyInk(this.isDarkTheme());
        const m3Icon = (color: string): string => isM3 && color === '#44739e' ? 'var(--md-sys-color-primary)' : color;
        const accordion = b(data.collapseOtherSubMenus);
        const collapseOnClose = b(data.collapseSubMenusOnClose);
        const closeDrawer = (): void => this.closeDrawer(data);
        const list = items(data); const current = stateValue(this.state, s(data.oid)); const selected = current === undefined && !b(data.navDisableDefaultValue) ? n(data.navDefaultValue) : n(current); const permanent = isPermanent(data); const visible = permanent || this.open; const flat = flatten(list); const chosen = flat.find(entry => entry.index === selected);
        // Only auto-open on an actual selection change; otherwise a manual collapse is overridden on every
        // re-render.
        // Except for a closed menu that collapses on close: the selection that closed it comes back
        // from the state only afterwards and would open its submenu again.
        if (selected !== this.lastSelected) {
            this.lastSelected = selected;
            const keepCollapsed = collapseOnClose && !visible;
            if (!keepCollapsed && chosen?.parent) { if (accordion) this.expanded.clear(); ancestors(chosen).forEach(entry => this.expanded.add(entry.index)); }
            if (!keepCollapsed && chosen) { this.drill = chosen.parent?.index ?? null; this.slideMove = ''; }
        }
        const slide = isSlide(data);
        const level = slide && this.drill !== null && flat[this.drill]?.children.length ? flat[this.drill] : undefined;
        const focusLater = (selector: string): void => { setTimeout(() => this.root?.querySelector<HTMLElement>(selector)?.focus(), 0); };
        const stepBack = (): void => { if (!level) return; this.drill = level.parent?.index ?? null; this.slideMove = 'back'; focusLater(`[data-index="${level.index}"]`); this.forceUpdate(); };
        // A cleared title is saved as "" and must stay empty; only a title never set gets the default.
        const title = b(data.showSelectedItemAsTitle, true) && chosen ? chosen.item.text : data.titleTopAppBar == null ? 'Material Design Widgets' : s(data.titleTopAppBar); const select = (entry: Entry): void => { if (n(data.vibrateDrawerOnMobilDevices) > 0) navigator.vibrate?.(n(data.vibrateDrawerOnMobilDevices)); if (entry.children.length) { if (slide) { this.drill = entry.index; this.slideMove = 'forward'; focusLater('.mdw-submenu-back'); /* Its index coming back from the state must not throw the user out to the level holding it. */ if (entry.item.setValueOnMenuToggleClick) this.lastSelected = entry.index; } else if (this.expanded.has(entry.index)) this.expanded.delete(entry.index); else { if (accordion) { this.expanded.clear(); ancestors(entry).forEach(open => this.expanded.add(open.index)); } this.expanded.add(entry.index); } if (entry.item.setValueOnMenuToggleClick) setStateValue(this.props, s(data.oid), entry.index); this.forceUpdate(); return; } if (entry.item.url) { openUrl(entry.item.url, entry.item.urlTarget); if (!permanent) closeDrawer(); return; } setStateValue(this.props, s(data.oid), entry.index); if (s(data.selectedItemName_oid)) setStateValue(this.props, s(data.selectedItemName_oid), [...ancestors(entry), entry].map(step => s(step.item.menuId, step.item.text)).join('.')); if (!permanent) closeDrawer(); window.scrollTo?.({ top: 0, left: 0 }); };
        const iconColor = (entry: Entry): string => {
            const inherited = ancestors(entry).map(step => s(step.item.subMenuIconColor)).reverse().find(Boolean);
            const base = s(entry.item.iconColor) || (entry.parent ? inherited || s(data.subIconDrawerColor) : s(data.iconDrawerColor));
            if (entry.index !== selected) return base;
            return (entry.parent ? s(data.subIconDrawerColorSelected, s(data.iconDrawerColorSelected)) : s(data.iconDrawerColorSelected)) || base;
        };
        const itemNode = (entry: Entry): React.JSX.Element => <div key={entry.index} className={`mdc-list-item${entry.index === selected ? ' mdc-list-item--activated' : ''}${entry.parent ? ' mdc-sub-list-item isSubItem' : ''}`} data-index={entry.index} onClick={() => select(entry)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(entry); } else if (level && (event.key === 'ArrowLeft' || event.key === 'Escape')) { event.preventDefault(); stepBack(); } }} role="button" tabIndex={entry.index === selected ? 0 : -1} style={{ alignItems: 'center', background: entry.index === selected ? s(entry.parent ? data.colorListSubItemSelected : data.colorListItemSelected) : s(entry.parent ? data.colorDrawerSubItemBackground : data.colorDrawerItemBackground), boxSizing: 'border-box', color: (entry.index === selected ? s(entry.parent ? data.colorListSubItemTextSelected : data.colorListItemTextSelected) : s(entry.parent ? data.colorListSubItemText : data.colorListItemText)) || drawerInk, cursor: 'pointer', display: 'flex', fontFamily: s(entry.parent ? data.listItemSubTextFont : data.listItemTextFont), fontSize: px(entry.parent ? data.listSubItemTextSize : data.listItemTextSize), justifyContent: entry.parent ? s(data.listSubItemAlignment, 'left') : s(data.listItemAlignment, 'left'), minHeight: 40, padding: !slide && entry.depth > 1 ? `0 8px 0 ${8 + 16 * (entry.depth - 1)}px` : '0 8px', textAlign: 'left', width: 'auto' }}>{renderIcon(s(entry.item.icon), m3Icon(iconColor(entry)), n(entry.parent ? data.drawerSubItemIconHeight : data.drawerIconHeight, 24), true)}{(entry.parent ? b(data.showSubItemsLabels, true) : b(data.showLabels, true)) ? <span className="mdc-list-item__text" style={{ flex: 1, marginLeft: 16, textAlign: (entry.parent ? s(data.listSubItemAlignment, 'left') : s(data.listItemAlignment, 'left')) as React.CSSProperties['textAlign'] }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(`${b(data.showIndexNum) ? `[${entry.index}] ` : ''}${s(entry.item.text, entry.parent ? 'Menu SubItem' : 'Menu Item')}`) }} /> : null}{entry.children.length ? renderIcon(slide ? 'chevron-right' : this.expanded.has(entry.index) ? 'menu-up' : 'menu-down', m3f(data.colorSubItemToggleIcon, 'var(--md-sys-color-on-surface-variant)', '#44739e'), 20, true) : null}</div>;
        const dividerNode = (entry: Entry): React.JSX.Element | null => {
            if (!entry.item.divider) return null;
            const layout = s(entry.parent ? data.listSubItemDividerStyle : data.listItemDividerStyle, 'standard');
            const margin = layout === 'padded' ? '0 16px' : layout === 'inset' ? '0 0 0 72px' : 0;
            return <hr key={`divider${entry.index}`} className={entry.parent ? 'mdc-sublist-divider' : 'mdc-list-divider'} style={{ border: 0, borderBottom: `1px solid ${m3f(entry.parent ? data.colorListSubItemDivider : data.colorListItemDivider, 'var(--md-sys-color-outline-variant)', 'rgba(0,0,0,.12)')}`, margin }} />;
        };
        const subList = (entry: Entry): React.JSX.Element | null => (!entry.children.length || !this.expanded.has(entry.index) ? null : <nav className="mdc-list mdc-sub-list" style={{ background: s(data.colorDrawerSubBackground) || undefined, display: 'block' }}>{entry.children.map(child => <React.Fragment key={`sub${child.index}`}>{itemNode(child)}{dividerNode(child)}{subList(child)}</React.Fragment>)}</nav>);
        const backText = level ? s(level.item.text, level.parent ? 'Menu SubItem' : 'Menu Item') : '';
        const backRow = level ? <div className="mdw-submenu-back" role="button" tabIndex={0} aria-label={`${VisWidget.t('ariaSubMenuBack')}: ${backText.replace(/<[^>]*>/g, '').trim()}`} onClick={stepBack} onKeyDown={event => { if (['Enter', ' ', 'ArrowLeft', 'Escape'].includes(event.key)) { event.preventDefault(); stepBack(); } }} style={{ alignItems: 'center', borderBottom: `1px solid ${m3f(data.colorListSubItemDivider, 'var(--md-sys-color-outline-variant)', 'rgba(0,0,0,.12)')}`, boxSizing: 'border-box', color: s(data.colorListSubItemText) || drawerInk, cursor: 'pointer', display: 'flex', fontFamily: s(data.listItemSubTextFont) || undefined, fontSize: px(data.listSubItemTextSize), fontWeight: 500, gap: 16, minHeight: 48, padding: '0 16px' }}>{renderIcon('arrow-left', m3f(data.colorSubItemToggleIcon, 'var(--md-sys-color-on-surface-variant)', '#44739e'), 20, true)}<span dangerouslySetInnerHTML={{ __html: sanitizeHtml(backText) }} /></div> : null;
        const hoverCss = [
            s(data.colorListItemHover) && `.materialdesign-topAppBar-with-Drawer .mdc-list-item:not(.isSubItem):hover{background:${s(data.colorListItemHover)}}`,
            s(data.colorListSubItemHover) && `.materialdesign-topAppBar-with-Drawer .mdc-list-item.isSubItem:hover{background:${s(data.colorListSubItemHover)}}`,
        ].filter(Boolean).join('');
        const layout = s(data.topAppBarLayout, 'standard');
        const onlyButton = b(data.showOnlyMenuButton);
        // Without the bar behind it the icon cannot take the title color, which is meant for the bar.
        const menuIconColor = s(data.topAppBarIconColor) || (!onlyButton ? 'currentColor' : isM3 ? 'var(--md-sys-color-on-surface)' : legacyInk(this.isDarkTheme()));
        const barHeight = layout === 'dense' ? 48 : layout === 'short' ? 56 : 64;
        const drawerWidth = n(data.drawerWidth, 256);
        const right = s(data.drawerPosition) === 'right';
        const edge = (offset: number): React.CSSProperties => (right ? { right: offset } : { left: offset });
        const toggleDrawer = (): void => { if (this.open) closeDrawer(); else { this.open = true; this.forceUpdate(); } if (n(data.vibrateTopAppBarOnMobilDevices) > 0) navigator.vibrate?.(n(data.vibrateTopAppBarOnMobilDevices)); };
        const menuButton = !permanent ? <button aria-label={VisWidget.t('ariaOpenMenu')} className="mdc-icon-button mdc-top-app-bar__navigation-icon" onClick={toggleDrawer} style={{ alignItems: 'center', background: 'transparent', border: 0, color: menuIconColor, display: 'inline-flex', height: 48, justifyContent: 'center', marginLeft: right ? 'auto' : undefined, padding: 12, width: 48 }}>{renderIcon('menu', menuIconColor, 24, true)}</button> : null;
        // The widget box has to be as tall as the drawer, but only the bar and the drawer are drawn in
        // it: the transparent rest lets clicks through, and bar, drawer and scrim take them back with `auto`.
        return <div className={`materialdesign-widget materialdesign-topAppBar-with-Drawer${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ''}`} ref={element => { this.root = element; liftWidgetLayer(element, visible && !permanent ? n(data.z_index, 1000) : null); passWrapperClicks(element, this.props.editMode); }} style={{ '--materialdesign-color-drawer-accent': legacyAccent(this.isDarkTheme()), height: '100%', overflow: 'hidden', pointerEvents: 'none', position: 'relative', width: '100%' } as React.CSSProperties}><style>{barCss + hoverCss + (isM3 ? barM3Css : '') + (slide ? slideCss : '')}</style>{onlyButton && permanent ? null : <header className={`mdc-top-app-bar mdc-top-app-bar--${layout}`} style={{ background: onlyButton ? 'transparent' : m3f(data.colorTopAppBarBackground, 'var(--md-sys-color-primary)', '#44739e'), boxShadow: onlyButton ? 'none' : undefined, color: m3f(data.colorTopAppBarTitle, 'var(--md-sys-color-on-primary)', '#fff'), fontFamily: s(data.titleFont), fontSize: isM3 && !s(data.titleFontSize) ? undefined : sizeCss(data.titleFontSize, 20), height: barHeight, ...edge(permanent ? drawerWidth : 0), padding: 0, pointerEvents: 'auto', position: 'absolute', top: 0, width: onlyButton ? 'auto' : permanent ? `calc(100% - ${drawerWidth}px)` : '100%', zIndex: n(data.topAppBarZ_index, 998) }}><div className="mdc-top-app-bar__row" style={{ height: barHeight }}><section className="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">{right ? null : menuButton}{onlyButton ? null : <span className="mdc-top-app-bar__title" style={{ alignItems: 'center', display: 'flex', flexDirection: s(data.titleIconPosition) === 'right' ? 'row-reverse' : 'row', gap: n(data.titleDistanceBetweenTextAndImage) > 0 ? n(data.titleDistanceBetweenTextAndImage) : undefined }}>{b(data.showSelectedItemIconInTitle, true) && chosen?.item.icon ? renderIcon(chosen.item.icon, m3f(data.colorTopAppBarTitle, 'var(--md-sys-color-on-primary)', '#fff'), n(data.iconTitleHeight, 30), true) : null}<span dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(title)) }} /></span>}{right ? menuButton : null}</section></div></header>}{visible ? <><aside className={`mdc-drawer${permanent ? ' mdc-drawer--dismissible mdc-drawer--open' : ' mdc-drawer--modal mdc-drawer--open'}${right ? ' mdw-drawer-right' : ''}`} style={{ background: drawerSurface, height: '100%', ...edge(0), pointerEvents: 'auto', position: 'absolute', top: 0, width: drawerWidth, zIndex: n(data.z_index, 1000) }}>{b(data.showHeader, true) ? <div className="mdc-drawer__header" style={{ background: m3f(data.colorDrawerHeaderBackground, 'var(--md-sys-color-primary)', '#44739e'), color: m3f(data.colorDrawerHeaderText, 'var(--md-sys-color-on-primary)', '#fff'), padding: 16 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data.headerLabel)) }} /> : null}<div className="mdc-drawer__content" style={{ height: `calc(100% - ${b(data.showHeader, true) ? 64 : 0}px)`, overflowY: 'auto' }}><nav key={slide ? `level${level?.index ?? 'top'}` : undefined} className={`mdc-list${level ? ' mdc-sub-list' : ''}${this.slideMove ? ` mdw-slide mdw-slide-from-${(this.slideMove === 'back') !== right ? 'start' : 'end'}` : ''}`} style={level ? { background: s(data.colorDrawerSubBackground) || undefined } : undefined}>{backRow}{(level ? level.children : flat.filter(entry => !entry.parent && !entry.item.empty)).map(entry => <React.Fragment key={`item${entry.index}`}>{entry.item.header && !entry.parent ? <div className="mdc-list-group__subheader" style={{ color: m3f(data.colorListItemHeaders, 'var(--md-sys-color-on-surface-variant)', ''), fontFamily: s(data.listItemHeaderFont) || undefined, padding: '12px 16px' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.item.header) }} /> : null}{itemNode(entry)}{dividerNode(entry)}{slide ? null : subList(entry)}</React.Fragment>)}</nav></div></aside>{!permanent ? <div className="mdc-drawer-scrim" onClick={closeDrawer} style={{ background: 'rgba(0,0,0,.32)', inset: 0, pointerEvents: 'auto', position: 'absolute', zIndex: n(data.z_index, 1000) - 1 }} /> : null}</> : null}</div>;
    }
}
