import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignTopAppBar, { dropdownPlace, fitCount, swipeAction } from './MaterialDesignTopAppBar';

function fixture<T>(value: unknown): T { return value as T; }

const isPortal = (node: unknown): node is { children: React.ReactNode; containerInfo: unknown } => typeof node === 'object' && node !== null && 'containerInfo' in node;

function collectByClass(node: React.ReactNode, className: string): Array<React.ReactElement<Record<string, unknown>>> {
    if (Array.isArray(node)) return node.flatMap(child => collectByClass(child, className));
    if (isPortal(node)) return collectByClass(node.children, className);
    if (!React.isValidElement(node)) return [];
    const element = node as React.ReactElement<Record<string, unknown>>;
    const own = typeof element.props.className === 'string' && element.props.className.split(' ').includes(className) ? [element] : [];
    return [...own, ...collectByClass(element.props.children as React.ReactNode, className)];
}

function findPortals(node: React.ReactNode): Array<{ children: React.ReactNode; containerInfo: unknown }> {
    if (Array.isArray(node)) return node.flatMap(findPortals);
    if (isPortal(node)) return [node, ...findPortals(node.children)];
    if (!React.isValidElement(node)) return [];
    return findPortals((node.props as { children?: React.ReactNode }).children);
}

// React 18 keeps `ref` out of `props`; reading it there warns and yields undefined.
function applyRef(element: React.ReactElement, node: HTMLElement): void {
    (element as unknown as { ref: (target: HTMLElement) => void }).ref(node);
}

describe('top app bar dynamic items', () => {
    it('hides empty editor rows while preserving their persisted action index', () => {
        const setValue = vi.fn();
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue } }));
        widget.state = fixture<typeof widget.state>({
            rxData: {
                drawerLayout: 'permanent',
                navItemCount: 3,
                oid: 'test.0.selected',
                selectedItemName_oid: 'test.0.selectedName',
                labels0: 'Alpha',
                menuId0: 'alpha',
                labels2: 'Gamma',
                menuId2: 'gamma',
            },
            values: {},
        });
        const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({}));
        const html = renderToStaticMarkup(tree);
        expect(html).toContain('Alpha');
        expect(html).toContain('Gamma');
        expect(html).not.toContain('Menu Item');

        const rows = collectByClass(tree, 'mdc-list-item');
        expect(rows).toHaveLength(2);
        (rows[1].props.onClick as () => void)();
        expect(setValue.mock.calls).toEqual([
            ['test.0.selected', 2],
            ['test.0.selectedName', 'gamma'],
        ]);
    });

    it('lets clicks through the empty part of the widget box and lifts the wrapper for the modal drawer', () => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData: { navItemCount: 1, labels0: 'Alpha' }, values: {} });
        const closed = widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
        expect((closed.props.style as React.CSSProperties).pointerEvents).toBe('none');
        expect((collectByClass(closed, 'mdc-top-app-bar')[0].props.style as React.CSSProperties).pointerEvents).toBe('auto');

        const wrapper = document.createElement('div');
        const root = document.createElement('div');
        wrapper.appendChild(root);
        wrapper.style.zIndex = '5';
        applyRef(closed, root);
        expect(wrapper.style.zIndex).toBe('5');
        expect(wrapper.style.pointerEvents).toBe('none');

        (widget as unknown as { open: boolean }).open = true;
        const open = widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
        applyRef(open, root);
        expect(wrapper.style.zIndex).toBe('1000');
        expect((collectByClass(open, 'mdc-drawer')[0].props.style as React.CSSProperties).pointerEvents).toBe('auto');
        expect((collectByClass(open, 'mdc-drawer-scrim')[0].props.style as React.CSSProperties).pointerEvents).toBe('auto');

        (widget as unknown as { open: boolean }).open = false;
        applyRef(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement, root);
        expect(wrapper.style.zIndex).toBe('5');

        const editor = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {}, editMode: true }));
        editor.state = fixture<typeof editor.state>({ rxData: { navItemCount: 1, labels0: 'Alpha' }, values: {} });
        applyRef(editor.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement, root);
        expect(wrapper.style.pointerEvents).toBe('');
    });

    it('bounds JSON input and renders a visible error item for malformed data', () => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({
            rxData: { drawerLayout: 'permanent', drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: '{broken' },
            values: {},
        });
        expect(renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})))).toContain('Error in JSON string');
    });

    it('shows no error item while the JSON string is still empty', () => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({
            rxData: { drawerLayout: 'permanent', drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: '' },
            values: {},
        });
        expect(renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})))).not.toContain('Error in JSON string');
    });
});

describe('top app bar title and header (issue #27)', () => {
    const render = (rxData: Record<string, unknown>, open = false): React.ReactElement<Record<string, unknown>> => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData: { navItemCount: 1, labels0: 'Alpha', ...rxData }, values: {} });
        (widget as unknown as { open: boolean }).open = open;
        return widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
    };
    const style = (tree: React.ReactElement, className: string): React.CSSProperties => collectByClass(tree, className)[0].props.style as React.CSSProperties;

    // A cleared title came back as "Material Design Widgets".
    it('keeps a cleared title empty and uses the default only for a title that was never set', () => {
        const title = (value: unknown): string => renderToStaticMarkup(render({ showSelectedItemAsTitle: false, titleTopAppBar: value }));
        expect(title('')).not.toContain('Material Design Widgets');
        expect(title('null')).not.toContain('Material Design Widgets');
        expect(title(undefined)).toContain('Material Design Widgets');
        expect(title(null)).toContain('Material Design Widgets');
        expect(title('Haus')).toContain('Haus');
        expect(renderToStaticMarkup(render({ titleTopAppBar: '' }))).toContain('>Alpha</span></span>');
    });

    it('draws only the menu button when the bar is switched to menu button only', () => {
        const normal = render({});
        expect(style(normal, 'mdc-top-app-bar').width).toBe('100%');
        expect(collectByClass(normal, 'mdc-top-app-bar__title')).toHaveLength(1);

        for (const value of [true, 'true']) {
            const onlyButton = render({ showOnlyMenuButton: value });
            const bar = style(onlyButton, 'mdc-top-app-bar');
            expect(bar.background, String(value)).toBe('transparent');
            expect(bar.boxShadow, String(value)).toBe('none');
            expect(bar.width, String(value)).toBe('auto');
            expect(collectByClass(onlyButton, 'mdc-top-app-bar__title'), String(value)).toHaveLength(0);
            expect(collectByClass(onlyButton, 'mdc-top-app-bar__navigation-icon'), String(value)).toHaveLength(1);
        }
        // Without a bar the icon cannot take the title color: white on a light page was invisible.
        const icon = (rxData: Record<string, unknown>): unknown => style(render(rxData), 'mdc-top-app-bar__navigation-icon').color;
        expect(icon({})).toBe('currentColor');
        expect(icon({ showOnlyMenuButton: true })).toBe('#000');
        expect(icon({ showOnlyMenuButton: true, designStyle: 'material3' })).toBe('var(--md-sys-color-on-surface)');
        expect(icon({ showOnlyMenuButton: true, topAppBarIconColor: 'red' })).toBe('red');
        expect(icon({ showOnlyMenuButton: true, topAppBarIconColor: '' })).toBe('#000');
        for (const value of [false, 'false', '', null, undefined]) {
            expect(style(render({ showOnlyMenuButton: value }), 'mdc-top-app-bar').width, String(value)).toBe('100%');
        }
        // A permanent drawer has no menu button, so nothing of the bar is left to draw.
        const permanent = render({ showOnlyMenuButton: true, drawerLayout: 'permanent' });
        expect(collectByClass(permanent, 'mdc-top-app-bar')).toHaveLength(0);
        expect(collectByClass(permanent, 'mdc-drawer')).toHaveLength(1);
    });

    it('spaces and orders the title icon and the title text', () => {
        const title = (rxData: Record<string, unknown>): React.CSSProperties => style(render({ iconDrawer0: 'home', ...rxData }), 'mdc-top-app-bar__title');
        expect(title({}).gap).toBeUndefined();
        expect(title({}).flexDirection).toBe('row');
        expect(title({ titleDistanceBetweenTextAndImage: 12 }).gap).toBe(12);
        expect(title({ titleDistanceBetweenTextAndImage: '8' }).gap).toBe(8);
        // Emptied, broken or negative input leaves the parts touching as before.
        for (const value of ['', null, undefined, 'abc', -5, 0]) {
            expect(title({ titleDistanceBetweenTextAndImage: value }).gap, String(value)).toBeUndefined();
        }
        expect(title({ titleIconPosition: 'right' }).flexDirection).toBe('row-reverse');
        for (const value of ['left', '', null, undefined, 'top']) {
            expect(title({ titleIconPosition: value }).flexDirection, String(value)).toBe('row');
        }
        const fields = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; label?: string }>);
        expect(fields.find(field => field.name === 'titleDistanceBetweenTextAndImage')?.label).toBe('distanceBetweenTextAndImage');
        expect(fields.find(field => field.name === 'titleIconPosition')?.label).toBe('iconPosition');
    });

    it('colors the drawer header text from its own field', () => {
        expect(style(render({ colorDrawerHeaderText: 'black' }, true), 'mdc-drawer__header').color).toBe('black');
        expect(style(render({ colorDrawerHeaderText: 'black', designStyle: 'material3' }, true), 'mdc-drawer__header').color).toBe('black');
        for (const value of ['', null, undefined]) {
            expect(style(render({ colorDrawerHeaderText: value }, true), 'mdc-drawer__header').color, String(value)).toBe('#fff');
            expect(style(render({ colorDrawerHeaderText: value, designStyle: 'material3' }, true), 'mdc-drawer__header').color, String(value)).toBe('var(--md-sys-color-on-primary)');
        }
        const fields = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.flatMap(group => group.fields.map(field => field.name));
        expect(fields).toContain('colorDrawerHeaderText');
        expect(fields).toContain('showOnlyMenuButton');
    });
});

describe('top app bar submenus (issues #30 and #31)', () => {
    const base = {
        drawerLayout: 'permanent',
        navItemCount: 2,
        labels0: 'EG',
        submenus0: '[{"text":"Wohnzimmer","icon":"sofa"},{"text":"Küche"}]',
        labels1: 'OG',
        submenus1: '[{"text":"Bad","icon":"shower"}]',
    };
    // Flat indexes: EG 0, Wohnzimmer 1, Küche 2, OG 3, Bad 4.
    const make = (rxData: Record<string, unknown>): { widget: MaterialDesignTopAppBar; tree: () => React.ReactElement<Record<string, unknown>> } => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue: vi.fn() } }));
        widget.state = fixture<typeof widget.state>({ rxData: { ...base, ...rxData }, values: {} });
        widget.forceUpdate = vi.fn();
        return { widget, tree: () => widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>> };
    };
    const click = (tree: React.ReactElement, text: string): void => {
        const row = collectByClass(tree, 'mdc-list-item').find(element => renderToStaticMarkup(element).includes(`>${text}<`));
        if (!row) throw new Error(`no row ${text}`);
        (row.props.onClick as () => void)();
    };
    // The bar title repeats the selected entry and its icon, so look only inside the drawer.
    const drawer = (tree: React.ReactElement): React.ReactElement<Record<string, unknown>> => collectByClass(tree, 'mdc-drawer')[0];
    const drawerHtml = (tree: React.ReactElement): string => renderToStaticMarkup(drawer(tree));
    const iconColor = (tree: React.ReactElement, icon: string): unknown => (collectByClass(drawer(tree), `mdi-${icon}`)[0].props.style as React.CSSProperties).color;

    it('closes the other submenus when one opens, if switched on', () => {
        for (const value of [true, 'true']) {
            const { tree } = make({ collapseOtherSubMenus: value });
            click(tree(), 'EG');
            expect(drawerHtml(tree()), String(value)).toContain('Wohnzimmer');
            click(tree(), 'OG');
            const html = drawerHtml(tree());
            expect(html, String(value)).toContain('Bad');
            expect(html, String(value)).not.toContain('Wohnzimmer');
            click(tree(), 'OG');
            expect(drawerHtml(tree()), String(value)).not.toContain('Bad');
        }
        for (const value of [false, 'false', '', null, undefined]) {
            const { tree } = make({ collapseOtherSubMenus: value });
            click(tree(), 'EG');
            click(tree(), 'OG');
            const html = drawerHtml(tree());
            expect(html, String(value)).toContain('Wohnzimmer');
            expect(html, String(value)).toContain('Bad');
        }
        const fields = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; type?: string }>);
        expect(fields.find(field => field.name === 'collapseOtherSubMenus')?.type).toBe('checkbox');
    });

    it('closes the other submenus when a selection from outside opens one, if switched on', () => {
        const run = (collapseOtherSubMenus: boolean): string => {
            const { widget, tree } = make({ collapseOtherSubMenus, navDefaultValue: 1 });
            tree();
            widget.state = fixture<typeof widget.state>({ rxData: { ...base, collapseOtherSubMenus, navDefaultValue: 4 }, values: {} });
            return drawerHtml(tree());
        };
        expect(run(true)).toContain('Bad');
        expect(run(true)).not.toContain('Wohnzimmer');
        expect(run(false)).toContain('Bad');
        expect(run(false)).toContain('Wohnzimmer');
    });

    // The arrow stayed "open" on the parent of the selected entry after that parent was collapsed.
    it('points the toggle arrow at the real open state of the submenu', () => {
        const { tree } = make({ navDefaultValue: 1 });
        expect(collectByClass(tree(), 'mdi-menu-up')).toHaveLength(1);
        click(tree(), 'EG');
        const collapsed = tree();
        expect(drawerHtml(collapsed)).not.toContain('Wohnzimmer');
        expect(collectByClass(collapsed, 'mdi-menu-up')).toHaveLength(0);
        expect(collectByClass(collapsed, 'mdi-menu-down')).toHaveLength(2);
    });

    it('aligns the entry text with the alignment option of its level', () => {
        const textAlign = (rxData: Record<string, unknown>, text: string): unknown => {
            const span = collectByClass(make({ navDefaultValue: 2, ...rxData }).tree(), 'mdc-list-item__text').find(element => renderToStaticMarkup(element).includes(text));
            return (span!.props.style as React.CSSProperties).textAlign;
        };
        expect(textAlign({ listItemAlignment: 'center' }, 'OG')).toBe('center');
        expect(textAlign({ listItemAlignment: 'right' }, 'OG')).toBe('right');
        expect(textAlign({ listItemAlignment: 'center', listSubItemAlignment: 'right' }, 'Küche')).toBe('right');
        expect(textAlign({ listItemAlignment: 'right' }, 'Küche')).toBe('left');
        for (const value of ['', null, undefined]) {
            expect(textAlign({ listItemAlignment: value }, 'OG'), String(value)).toBe('left');
            expect(textAlign({ listSubItemAlignment: value }, 'Küche'), String(value)).toBe('left');
        }
    });

    it('colors submenu icons from the parent entry, the JSON key and the global field', () => {
        // Küche (2) is selected so that the sofa icon of Wohnzimmer shows its normal color.
        const editor = (rxData: Record<string, unknown>): unknown => iconColor(make({ navDefaultValue: 2, ...rxData }).tree(), 'sofa');
        expect(editor({ subIconDrawerColor0: 'green' })).toBe('green');
        expect(editor({ subIconDrawerColor0: 'green', subIconDrawerColor: 'blue' })).toBe('green');
        expect(editor({ subIconDrawerColor: 'blue' })).toBe('blue');
        expect(editor({ subIconDrawerColor0: 'green', submenus0: '[{"text":"Wohnzimmer","icon":"sofa","iconColor":"red"},{"text":"Küche"}]' })).toBe('red');
        for (const value of ['', null, undefined]) {
            expect(editor({ subIconDrawerColor0: value }), String(value)).toBe('#44739e');
        }

        const json = (items: unknown, rxData: Record<string, unknown> = {}): unknown => iconColor(make({ navDefaultValue: 2, drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: JSON.stringify(items), ...rxData }).tree(), 'sofa');
        const subMenus = [{ text: 'Wohnzimmer', icon: 'sofa' }, { text: 'Küche' }];
        expect(json([{ text: 'EG', subMenuIconColor: 'green', subMenus }])).toBe('green');
        expect(json([{ text: 'EG', subMenus }], { subIconDrawerColor: 'blue' })).toBe('blue');
        expect(json([{ text: 'EG', subMenuIconColor: '', subMenus }], { subIconDrawerColor: 'blue' })).toBe('blue');
    });

    it('uses the active icon colors for the selected entry only', () => {
        const color = (rxData: Record<string, unknown>, icon: string): unknown => iconColor(make({ iconDrawer1: 'home', ...rxData }).tree(), icon);
        expect(color({ navDefaultValue: 3, iconDrawerColorSelected: 'orange' }, 'home')).toBe('orange');
        expect(color({ navDefaultValue: 0, iconDrawerColorSelected: 'orange' }, 'home')).toBe('#44739e');
        expect(color({ navDefaultValue: 1, subIconDrawerColorSelected: 'purple', iconDrawerColorSelected: 'orange' }, 'sofa')).toBe('purple');
        expect(color({ navDefaultValue: 1, iconDrawerColorSelected: 'orange' }, 'sofa')).toBe('orange');
        expect(color({ navDefaultValue: 2, subIconDrawerColorSelected: 'purple' }, 'sofa')).toBe('#44739e');
        for (const value of ['', null, undefined]) {
            expect(color({ navDefaultValue: 3, iconDrawerColorSelected: value }, 'home'), String(value)).toBe('#44739e');
            expect(color({ navDefaultValue: 1, subIconDrawerColorSelected: value, subIconDrawerColor0: 'green' }, 'sofa'), String(value)).toBe('green');
        }
        expect(color({ navDefaultValue: 3, iconDrawerColorSelected: 'orange', designStyle: 'material3' }, 'home')).toBe('orange');
        expect(color({ navDefaultValue: 0, designStyle: 'material3' }, 'home')).toBe('var(--md-sys-color-primary)');
    });
});

describe('top app bar modal menu (upstream-#124 and #123)', () => {
    const base = {
        drawerLayout: 'modal',
        oid: 'test.0.nav',
        navItemCount: 2,
        labels0: 'EG',
        submenus0: '[{"text":"Wohnzimmer","icon":"sofa"},{"text":"Küche"}]',
        labels1: 'OG',
        submenus1: '[{"text":"Bad","icon":"shower"}]',
    };
    // Flat indexes: EG 0, Wohnzimmer 1, Küche 2, OG 3, Bad 4.
    const make = (rxData: Record<string, unknown>) => {
        const setValue = vi.fn();
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue } }));
        widget.state = fixture<typeof widget.state>({ rxData: { ...base, ...rxData }, values: {} });
        widget.forceUpdate = vi.fn();
        const tree = (): React.ReactElement<Record<string, unknown>> => widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
        const press = (className: string): void => (collectByClass(tree(), className)[0].props.onClick as () => void)();
        const click = (text: string): void => {
            const row = collectByClass(tree(), 'mdc-list-item').find(element => renderToStaticMarkup(element).includes(`>${text}<`));
            if (!row) throw new Error(`no row ${text}`);
            (row.props.onClick as () => void)();
        };
        const drawerHtml = (): string => renderToStaticMarkup(collectByClass(tree(), 'mdc-drawer')[0]);
        return { widget, setValue, press, click, drawerHtml };
    };
    const MENU = 'mdc-top-app-bar__navigation-icon';

    it('shows the submenus closed after the menu was closed, if switched on', () => {
        for (const close of ['mdc-drawer-scrim', MENU]) {
            for (const collapse of [true, false]) {
                const { press, click, drawerHtml } = make({ collapseSubMenusOnClose: collapse });
                press(MENU);
                click('EG');
                expect(drawerHtml()).toContain('Wohnzimmer');
                press(close);
                press(MENU);
                expect(drawerHtml().includes('Wohnzimmer'), `${close} ${collapse}`).toBe(!collapse);
            }
        }
    });

    it('keeps the submenu closed when the selection that closed the menu comes back from the state', () => {
        for (const collapse of [true, false]) {
            const { widget, setValue, press, click, drawerHtml } = make({ collapseSubMenusOnClose: collapse });
            press(MENU);
            click('EG');
            click('Wohnzimmer');
            expect(setValue).toHaveBeenCalledWith('test.0.nav', 1);
            widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.nav.val': 1 } });
            press(MENU);
            expect(drawerHtml().includes('Wohnzimmer'), String(collapse)).toBe(!collapse);
        }
    });

    it('opens the URL of an entry in a new tab instead of selecting it', () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        try {
            const json = make({ drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: '[{"text":"Doku","url":"https://example.com/doc"},{"text":"Böse","url":"javascript:alert(1)"}]' });
            json.press(MENU);
            json.click('Doku');
            expect(open).toHaveBeenCalledWith('https://example.com/doc', '_blank', 'noopener,noreferrer');
            expect(json.setValue).not.toHaveBeenCalled();
            // The modal menu closes after the click, as after any other entry.
            expect(renderToStaticMarkup(collectByClass(json.widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})), 'mdc-drawer-scrim')[0] ?? <i />)).toBe('<i></i>');
            json.press(MENU);
            json.click('Böse');
            expect(open).toHaveBeenCalledTimes(1);
            expect(json.setValue).not.toHaveBeenCalled();

            const editor = make({ navItemCount: 1, submenus0: '', labels0: 'Wetter', url0: 'https://example.com/weather', urlTarget0: '_blank' });
            editor.press(MENU);
            editor.click('Wetter');
            expect(open).toHaveBeenLastCalledWith('https://example.com/weather', '_blank', 'noopener,noreferrer');

            // Same key in the JSON string as in the editor; `_self` navigates the tab, no popup.
            const assign = vi.fn();
            vi.stubGlobal('location', { ...window.location, assign });
            const self = make({ drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: '[{"text":"Hier","url":"https://example.com/here","urlTarget":"_self"}]' });
            self.press(MENU);
            self.click('Hier');
            expect(assign).toHaveBeenCalledWith('https://example.com/here');
            expect(open).toHaveBeenCalledTimes(2);
        } finally {
            vi.unstubAllGlobals();
            open.mockRestore();
        }
        const fields = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; options?: string[] }>);
        // Indexed group: the field is declared once, vis-2 appends the row index when it stores it.
        expect(fields.find(field => field.name === 'urlTarget')?.options).toEqual(['_blank', '_self']);
    });
});


// upstream-#193: the ioBroker Android app puts its own button over the top left corner, right on
// top of the menu button. The menu button and the drawer move to the right together.
describe('top app bar drawer position', () => {
    type Style = React.CSSProperties;
    const render = (rxData: Record<string, unknown>, open = false): React.ReactElement => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({ rxData: { navItemCount: 1, labels0: 'Alpha', ...rxData }, values: {} });
        (widget as unknown as { open: boolean }).open = open;
        return widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({}));
    };
    const style = (tree: React.ReactElement, className: string): Style => collectByClass(tree, className)[0]?.props.style as Style;
    // Order of the menu button and the title inside the bar.
    const order = (tree: React.ReactElement): string[] => {
        const section = collectByClass(tree, 'mdc-top-app-bar__section')[0];
        return React.Children.toArray(section.props.children as React.ReactNode)
            .filter(React.isValidElement)
            .map(child => {
                const raw = (child as React.ReactElement<Record<string, unknown>>).props.className;
                const className = typeof raw === 'string' ? raw : '';
                return className.includes('navigation-icon') ? 'button' : className.includes('title') ? 'title' : className;
            });
    };

    it('keeps the menu button and the drawer on the left by default and for unknown values', () => {
        for (const drawerPosition of [undefined, '', 'left', 'middle', 7]) {
            const tree = render({ drawerPosition }, true);
            expect(order(tree)).toEqual(['button', 'title']);
            expect(style(tree, 'mdc-drawer')).toMatchObject({ left: 0 });
            expect(style(tree, 'mdc-drawer').right).toBeUndefined();
            expect(style(tree, 'mdc-top-app-bar')).toMatchObject({ left: 0 });
            expect(collectByClass(tree, 'mdw-drawer-right')).toHaveLength(0);
        }
        expect(style(render({ drawerLayout: 'permanent' }), 'mdc-top-app-bar')).toMatchObject({ left: 256, width: 'calc(100% - 256px)' });
    });

    it('puts the menu button after the title and opens the drawer from the right edge', () => {
        const tree = render({ drawerPosition: 'right' }, true);
        expect(order(tree)).toEqual(['title', 'button']);
        expect(style(tree, 'mdc-top-app-bar__navigation-icon')).toMatchObject({ marginLeft: 'auto' });
        expect(style(tree, 'mdc-drawer')).toMatchObject({ right: 0 });
        expect(style(tree, 'mdc-drawer').left).toBeUndefined();
        expect(style(tree, 'mdc-top-app-bar')).toMatchObject({ right: 0, width: '100%' });
        expect(style(tree, 'mdc-top-app-bar').left).toBeUndefined();
        expect(collectByClass(tree, 'mdc-drawer-scrim')).toHaveLength(1);
    });

    it('leaves room for a permanent drawer on the right and draws its edge on the left side', () => {
        const tree = render({ drawerPosition: 'right', drawerLayout: 'permanent', drawerWidth: 300 });
        expect(style(tree, 'mdc-top-app-bar')).toMatchObject({ right: 300, width: 'calc(100% - 300px)' });
        expect(style(tree, 'mdc-top-app-bar').left).toBeUndefined();
        expect(style(tree, 'mdc-drawer')).toMatchObject({ right: 0, width: 300 });
        const drawer = collectByClass(tree, 'mdc-drawer')[0];
        expect(String(drawer.props.className).split(' ')).toEqual(expect.arrayContaining(['mdc-drawer--dismissible', 'mdw-drawer-right']));
        const css = renderToStaticMarkup(tree);
        expect(css).toContain('.mdc-drawer--dismissible.mdw-drawer-right{border-right:0;border-left:1px solid');
        expect(collectByClass(tree, 'mdc-top-app-bar__navigation-icon')).toHaveLength(0);
    });

    it('anchors the lone menu button to the right edge', () => {
        const tree = render({ drawerPosition: 'right', showOnlyMenuButton: true });
        expect(order(tree)).toEqual(['button']);
        expect(style(tree, 'mdc-top-app-bar')).toMatchObject({ right: 0, width: 'auto' });
        expect(style(tree, 'mdc-top-app-bar').left).toBeUndefined();
    });

    it('offers the position as a field of the drawer layout', () => {
        const group = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.find(entry => entry.name === 'drawerLayout');
        const field = (group?.fields as Array<{ name: string; type?: string; options?: string[]; default?: unknown }>).find(entry => entry.name === 'drawerPosition');
        expect(field).toMatchObject({ type: 'select', options: ['left', 'right'], default: 'left' });
    });
});

describe('swipe opens and closes the drawer (upstream #95)', () => {
    const W = 1000;
    it.each([
        ['open from the left edge', { x: 10, y: 300 }, { x: 120, y: 310 }, false, false, 'open'],
        ['open from the edge exactly at 24 px', { x: 24, y: 300 }, { x: 100, y: 300 }, false, false, 'open'],
        ['not from 25 px', { x: 25, y: 300 }, { x: 200, y: 300 }, false, false, null],
        ['not for a short swipe', { x: 5, y: 300 }, { x: 54, y: 300 }, false, false, null],
        ['not for a mostly vertical move', { x: 5, y: 300 }, { x: 80, y: 340 }, false, false, null],
        ['not towards the edge while closed', { x: 20, y: 300 }, { x: -60, y: 300 }, false, false, null],
        ['open from the right edge for a right drawer', { x: 990, y: 300 }, { x: 880, y: 300 }, true, false, 'open'],
        ['not from the left edge for a right drawer', { x: 10, y: 300 }, { x: 120, y: 300 }, true, false, null],
        ['close a left drawer with a swipe to the left anywhere', { x: 500, y: 300 }, { x: 400, y: 300 }, false, true, 'close'],
        ['keep it open for a swipe inwards', { x: 100, y: 300 }, { x: 300, y: 300 }, false, true, null],
        ['close a right drawer with a swipe to the right', { x: 600, y: 300 }, { x: 700, y: 310 }, true, true, 'close'],
    ] as const)('%s', (_name, start, end, right, open, action) => {
        expect(swipeAction(start, end, W, right, open)).toBe(action);
    });

    type Swipe = { onTouchStart: (e: unknown) => void; onTouchEnd: (e: unknown) => void; componentDidMount: () => void; componentWillUnmount: () => void; root: unknown };
    const make = (rxData: Record<string, unknown>, editMode = false, rects = 1) => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue: vi.fn() }, editMode }));
        widget.state = fixture<typeof widget.state>({ rxData: { drawerLayout: 'modal', navItemCount: 1, ...rxData }, values: {} });
        widget.forceUpdate = vi.fn();
        const api = fixture<Swipe>(widget);
        // A widget inside a hidden view (display: none) has no client rects.
        api.root = { getClientRects: () => Array.from({ length: rects }, () => ({})) };
        const swipe = (x1: number, x2: number) => {
            api.onTouchStart({ touches: [{ clientX: x1, clientY: 300 }] });
            api.onTouchEnd({ changedTouches: [{ clientX: x2, clientY: 300 }] });
        };
        const drawerShown = () => collectByClass(widget.renderWidgetBody(fixture<Parameters<typeof widget.renderWidgetBody>[0]>({})), 'mdc-drawer').length > 0;
        return { swipe, drawerShown, api };
    };

    it('opens and closes the modal drawer with the option on', () => {
        const w = make({ openDrawerBySwipe: true });
        w.swipe(5, 150);
        expect(w.drawerShown()).toBe(true);
        w.swipe(600, 400);
        expect(w.drawerShown()).toBe(false);
    });

    it.each([
        ['the option is off', {}, false],
        ['the drawer is permanent', { openDrawerBySwipe: true, drawerLayout: 'permanent' }, false],
        ['the editor is open', { openDrawerBySwipe: true }, true],
    ])('does nothing when %s', (_name, rxData, editMode) => {
        const w = make(rxData, editMode);
        const before = w.drawerShown();
        w.swipe(5, 150);
        expect(w.drawerShown()).toBe(before);
    });

    it('leaves the drawer of a bar in a view that is mounted but not shown closed', () => {
        const hidden = make({ openDrawerBySwipe: true }, false, 0);
        hidden.swipe(5, 150);
        expect(hidden.drawerShown()).toBe(false);
        hidden.api.root = null;
        hidden.swipe(5, 150);
        expect(hidden.drawerShown()).toBe(false);
    });

    it('ignores a second finger and a touch end without a start', () => {
        const w = make({ openDrawerBySwipe: true });
        w.api.onTouchEnd({ changedTouches: [{ clientX: 150, clientY: 300 }] });
        w.api.onTouchStart({ touches: [{ clientX: 5, clientY: 300 }, { clientX: 50, clientY: 300 }] });
        w.api.onTouchEnd({ changedTouches: [{ clientX: 150, clientY: 300 }] });
        expect(w.drawerShown()).toBe(false);
    });
});

describe('top app bar submenus over several levels (fork #32)', () => {
    const tree = [
        { text: 'Haus', subMenuIconColor: 'green', subMenus: [
            { text: 'EG', menuId: 'eg', subMenus: [{ text: 'Wohnzimmer', subMenuIconColor: 'red', subMenus: [{ text: 'Licht', icon: 'lightbulb' }] }, { text: 'Küche', icon: 'fridge' }] },
            { text: 'OG', subMenus: [{ text: 'Bad' }] },
        ] },
        { text: 'Garten' },
    ];
    // Depth first: Haus 0, EG 1, Wohnzimmer 2, Licht 3, Küche 4, OG 5, Bad 6, Garten 7.
    const make = (rxData: Record<string, unknown> = {}, items: unknown = tree) => {
        const setValue = vi.fn();
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue } }));
        widget.state = fixture<typeof widget.state>({ rxData: { drawerLayout: 'permanent', oid: 'test.0.page', drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: JSON.stringify(items), showIndexNum: true, ...rxData }, values: {} });
        widget.forceUpdate = vi.fn();
        const render = (): React.ReactElement<Record<string, unknown>> => collectByClass(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})), 'mdc-drawer')[0];
        const row = (text: string) => collectByClass(render(), 'mdc-list-item').find(element => renderToStaticMarkup(element).includes(`${text}<`));
        const click = (text: string): void => { const found = row(text); if (!found) throw new Error(`no row ${text}`); (found.props.onClick as () => void)(); };
        const html = (): string => renderToStaticMarkup(render());
        return { widget, setValue, render, row, click, html };
    };

    it('numbers the entries depth first and opens the path to the selected entry', () => {
        const p = make({ navDefaultValue: 3 });
        const html = p.html();
        for (const label of ['[0] Haus', '[1] EG', '[2] Wohnzimmer', '[3] Licht', '[4] Küche', '[5] OG', '[7] Garten']) expect(html).toContain(label);
        expect(html).not.toContain('Bad');
    });

    it('writes the index and the whole path of the selected entry', () => {
        const p = make({ selectedItemName_oid: 'test.0.name' });
        p.click('Haus');
        p.click('EG');
        p.click('Wohnzimmer');
        p.click('Licht');
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 3);
        expect(p.setValue).toHaveBeenCalledWith('test.0.name', 'Haus.eg.Wohnzimmer.Licht');
        p.click('Garten');
        expect(p.setValue).toHaveBeenCalledWith('test.0.name', 'Garten');
    });

    it('closes the other branches of a level but keeps the open path, if switched on', () => {
        const run = (collapseOtherSubMenus: boolean): string => {
            const p = make({ collapseOtherSubMenus, navDefaultValue: 3 });
            p.click('OG');
            return p.html();
        };
        expect(run(true)).toContain('Bad');
        expect(run(true)).toContain('EG');
        expect(run(true)).not.toContain('Wohnzimmer');
        expect(run(false)).toContain('Bad');
        expect(run(false)).toContain('Licht');
    });

    it('collapses one level without closing its parents', () => {
        const p = make({ navDefaultValue: 3 });
        p.click('Wohnzimmer');
        const html = p.html();
        expect(html).not.toContain('Licht');
        expect(html).toContain('Küche');
        expect(html).toContain('OG');
    });

    it('indents every level below the first one step further', () => {
        const p = make({ navDefaultValue: 3 });
        const padding = (text: string): unknown => (p.row(text)!.props.style as React.CSSProperties).padding;
        expect(padding('Haus')).toBe('0 8px');
        expect(padding('EG')).toBe('0 8px');
        expect(padding('Wohnzimmer')).toBe('0 8px 0 24px');
        expect(padding('Licht')).toBe('0 8px 0 40px');
    });

    // The numbers of 1.4.0, which drew a string or number entry as "Menu Item" and counted it.
    it('keeps the numbers of a one-level menu that holds entries which are no objects', () => {
        const p = make({ navDefaultValue: 3 }, ['x', { text: 'A', subMenus: [5, { text: 'A2' }] }, { text: 'B' }]);
        for (const label of ['[0] Menu Item', '[1] A', '[2] Menu SubItem', '[3] A2', '[4] B']) expect(p.html()).toContain(label);
    });

    it('gives the submenu list of every level the submenu background', () => {
        const backgrounds = (rxData: Record<string, unknown>): unknown[] => collectByClass(make({ navDefaultValue: 3, ...rxData }).render(), 'mdc-sub-list').map(list => (list.props.style as React.CSSProperties).background);
        expect(backgrounds({ colorDrawerSubBackground: 'rgba(0,0,0,.1)' })).toEqual(['rgba(0,0,0,.1)', 'rgba(0,0,0,.1)', 'rgba(0,0,0,.1)']);
        expect(backgrounds({})).toEqual([undefined, undefined, undefined]);
    });

    it('colors submenu icons from the nearest parent that sets a submenu icon color', () => {
        const p = make({ navDefaultValue: 3, subIconDrawerColor: 'blue' });
        const color = (icon: string): unknown => (collectByClass(p.render(), `mdi-${icon}`)[0].props.style as React.CSSProperties).color;
        expect(color('lightbulb')).toBe('red');
        expect(color('fridge')).toBe('green');
    });

    it('draws malformed entries as plain entries with their number and stops after ten submenu levels', () => {
        const broken = make({}, [null, 7, [], { text: 'A', subMenus: 'x' }, { text: 'B', subMenus: [null, { text: 'B1' }] }]);
        for (const label of ['[0] Menu Item', '[1] Menu Item', '[2] Menu Item', '[3] A']) expect(broken.html()).toContain(label);
        expect(collectByClass(broken.row('A'), 'mdi-menu-down')).toHaveLength(0);
        broken.click('B');
        expect(broken.html()).toContain('[5] Menu SubItem');
        expect(broken.html()).toContain('[6] B1');

        let deep: Record<string, unknown> = { text: 'L15' };
        for (let level = 14; level >= 0; level--) deep = { text: `L${level}`, subMenus: [deep] };
        const p = make({ navDefaultValue: 10 }, [deep]);
        const html = p.html();
        expect(html).toContain('[10] L10');
        expect(html).not.toContain('L11');
        expect(collectByClass(p.row('L10'), 'mdi-menu-down')).toHaveLength(0);
    });

    describe('submenus in place of the list', () => {
        const slide = (rxData: Record<string, unknown> = {}, items: unknown = tree) => {
            const p = make({ subMenuMode: 'slide', ...rxData }, items);
            const back = (): React.ReactElement<Record<string, unknown>> | undefined => collectByClass(p.render(), 'mdw-submenu-back')[0];
            const rows = (): string[] => collectByClass(p.render(), 'mdc-list-item').map(element => renderToStaticMarkup(element).replace(/<[^>]*>/g, ''));
            return { ...p, back, rows };
        };
        const key = (element: React.ReactElement<Record<string, unknown>> | undefined, name: string): void => (element!.props.onKeyDown as (event: unknown) => void)({ key: name, preventDefault: vi.fn() });

        it('shows one level and steps into a submenu in its place', () => {
            const p = slide();
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
            expect(p.back()).toBeUndefined();
            p.click('Haus');
            expect(p.rows()).toEqual(['[1] EG', '[5] OG']);
            expect(renderToStaticMarkup(p.back())).toContain('Haus');
            p.click('EG');
            expect(p.rows()).toEqual(['[2] Wohnzimmer', '[4] Küche']);
            expect(renderToStaticMarkup(p.back())).toContain('EG');
        });

        it('steps back one level from the back row and with the left arrow or Escape', () => {
            const p = slide();
            p.click('Haus');
            p.click('EG');
            (p.back()!.props.onClick as () => void)();
            expect(p.rows()).toEqual(['[1] EG', '[5] OG']);
            key(p.back(), 'Enter');
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
            p.click('Haus');
            key(p.row('OG'), 'ArrowLeft');
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
            p.click('Haus');
            key(p.row('EG'), 'Escape');
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
            key(p.row('Garten'), 'ArrowLeft');
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
        });

        it('opens on the level of the selected entry and writes the same index and path', () => {
            const p = slide({ navDefaultValue: 3, selectedItemName_oid: 'test.0.name' });
            expect(p.rows()).toEqual(['[3] Licht']);
            p.click('Licht');
            expect(p.setValue).toHaveBeenCalledWith('test.0.page', 3);
            expect(p.setValue).toHaveBeenCalledWith('test.0.name', 'Haus.eg.Wohnzimmer.Licht');
            p.widget.state = fixture<typeof p.widget.state>({ ...p.widget.state, values: { 'test.0.page.val': 7 } });
            expect(p.rows()).toEqual(['[0] Haus', '[7] Garten']);
        });

        it('stays in a submenu whose entry also writes its index when stepped into', () => {
            const p = slide({ navDefaultValue: 2 }, [{ text: 'Haus', setValueOnMenuToggleClick: true, subMenus: [{ text: 'EG' }] }, { text: 'Garten' }]);
            p.click('Haus');
            expect(p.setValue).toHaveBeenCalledWith('test.0.page', 0);
            p.widget.state = fixture<typeof p.widget.state>({ ...p.widget.state, values: { 'test.0.page.val': 0 } });
            expect(p.rows()).toEqual(['[1] EG']);
        });

        it('draws every level flat, marks submenus with a forward arrow and gives deeper levels the submenu background', () => {
            const p = slide({ navDefaultValue: 3, colorDrawerSubBackground: 'rgba(0,0,0,.1)' });
            expect((p.row('Licht')!.props.style as React.CSSProperties).padding).toBe('0 8px');
            const list = (): React.ReactElement<Record<string, unknown>> => collectByClass(p.render(), 'mdc-list')[0];
            expect((list().props.style as React.CSSProperties).background).toBe('rgba(0,0,0,.1)');
            key(p.back(), 'Enter');
            key(p.back(), 'Enter');
            key(p.back(), 'Enter');
            expect(collectByClass(p.row('Haus'), 'mdi-chevron-right')).toHaveLength(1);
            expect(collectByClass(p.row('Haus'), 'mdi-menu-down')).toHaveLength(0);
            expect((list().props.style as React.CSSProperties | undefined)?.background).toBeUndefined();
        });

        it('falls back to the first level when the open submenu is gone from the JSON', () => {
            const p = slide();
            p.click('Haus');
            p.widget.state = fixture<typeof p.widget.state>({ ...p.widget.state, rxData: { ...p.widget.state.rxData, drawerItemsJsonString: '[{"text":"Neu"},"x"]' } });
            expect(p.rows()).toEqual(['[0] Neu', '[1] Menu Item']);
            expect(p.back()).toBeUndefined();
        });

        it('keeps the submenus below their entry for an unknown mode', () => {
            const p = make({ subMenuMode: 'sideways', navDefaultValue: 3 });
            expect(p.html()).toContain('Garten');
            expect(p.html()).toContain('Licht');
            expect(collectByClass(p.render(), 'mdw-submenu-back')).toHaveLength(0);
        });

        it('returns to the first level when the menu closes, if switched on', () => {
            for (const collapse of [true, false]) {
                const p = slide({ drawerLayout: 'modal', collapseSubMenusOnClose: collapse });
                (p.widget as unknown as { open: boolean }).open = true;
                p.click('Haus');
                (collectByClass(p.widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})), 'mdc-drawer-scrim')[0].props.onClick as () => void)();
                (p.widget as unknown as { open: boolean }).open = true;
                expect(p.rows(), String(collapse)).toEqual(collapse ? ['[0] Haus', '[7] Garten'] : ['[1] EG', '[5] OG']);
            }
        });

        it('moves the focus to the back row after stepping in and to the entry after stepping back', () => {
            vi.useFakeTimers();
            try {
                const p = slide();
                const host = document.createElement('div');
                document.body.appendChild(host);
                (p.widget as unknown as { root: HTMLElement }).root = host;
                const paint = (): void => { host.innerHTML = renderToStaticMarkup(p.render()); };
                paint();
                p.click('Haus');
                paint();
                vi.runAllTimers();
                expect(document.activeElement?.classList.contains('mdw-submenu-back')).toBe(true);
                key(p.back(), 'Enter');
                paint();
                vi.runAllTimers();
                expect(document.activeElement?.textContent).toContain('Haus');
                host.remove();
            } finally {
                vi.useRealTimers();
            }
        });

        it('hides the accordion option, which has no meaning with one level shown', () => {
            const fields = MaterialDesignTopAppBar.getWidgetInfo().visAttrs.flatMap(group => group.fields);
            const field = (name: string) => fields.find(entry => entry.name === name) as { hidden?: (data: Record<string, unknown>) => boolean; options?: unknown[]; default?: unknown };
            expect(field('subMenuMode').options).toEqual([{ value: 'inline', label: 'subMenuMode_inline' }, { value: 'slide', label: 'subMenuMode_slide' }]);
            expect(field('subMenuMode').default).toBe('inline');
            expect(field('collapseOtherSubMenus').hidden?.({ subMenuMode: 'slide' })).toBe(true);
            expect(field('collapseOtherSubMenus').hidden?.({})).toBe(false);
        });
    });
});

describe('horizontal navigation helpers (upstream #60)', () => {
    it.each([
        ['all fit without More', [100, 100, 100], 80, 300, 3],
        ['the rest goes into More', [100, 100, 100], 80, 299, 2],
        ['More counts against the room', [100, 100, 100], 120, 299, 1],
        ['exactly fitting beside More', [100, 100, 100], 99, 299, 2],
        ['only More when no entry fits beside it', [200, 100], 150, 299, 0],
        ['no room', [100], 80, 0, 0],
        ['negative room', [100], 80, -5, 0],
        ['an empty bar', [], 80, 0, 0],
        ['an empty bar with negative room', [], 80, -1, 0],
    ] as const)('fitCount: %s', (_name, widths, more, available, expected) => {
        expect(fitCount([...widths], more, available)).toBe(expected);
    });

    it.each([
        ['inside the window', 100, 1280, 800, { left: 100, top: 64, maxHeight: 728 }],
        ['pushed back from the right edge', 1200, 1280, 800, { left: 1016, top: 64, maxHeight: 728 }],
        ['kept off the left edge', -20, 1280, 800, { left: 8, top: 64, maxHeight: 728 }],
        ['a window narrower than the dropdown', 100, 200, 800, { left: 8, top: 64, maxHeight: 728 }],
        ['a window too low for one row', 100, 1280, 100, { left: 100, top: 64, maxHeight: 48 }],
    ] as const)('dropdownPlace: %s', (_name, left, viewWidth, viewHeight, expected) => {
        expect(dropdownPlace(left, 64, 256, viewWidth, viewHeight)).toEqual(expected);
    });
});

describe('top app bar horizontal navigation (upstream #60)', () => {
    const menu = [
        { text: 'Home', icon: 'home' },
        { text: 'Haus', header: 'Gebäude', subMenus: [
            { text: 'EG', menuId: 'eg', subMenus: [{ text: 'Wohnzimmer' }, { text: 'Küche' }] },
            { text: 'OG' },
        ] },
        { text: 'Web', url: 'https://example.org/' },
        { text: 'Garten', divider: true },
    ];
    // Depth first: Home 0, Haus 1, EG 2, Wohnzimmer 3, Küche 4, OG 5, Web 6, Garten 7.
    type Api = { root: unknown; dropdownEl: unknown; fit: number; menu: unknown; open: boolean; onPointerDown: (event: unknown) => void; onScroll: (event: unknown) => void; onWindowResize: () => void; onTouchStart: (event: unknown) => void; onTouchEnd: (event: unknown) => void; measure: () => void; componentDidMount: () => void; componentWillUnmount: () => void };
    const viewport = (width: number, height = 800): void => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    };
    afterEach(() => { viewport(1024, 768); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
    const make = (rxData: Record<string, unknown> = {}, { editMode = false, width = 1280, items = menu, id = 'w000001' } = {}) => {
        viewport(width);
        const setValue = vi.fn();
        // componentDidMount subscribes states through the socket.
        const socket = { subscribeState: vi.fn().mockResolvedValue(undefined), unsubscribeState: vi.fn() };
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: { setValue, socket }, editMode, id }));
        widget.state = fixture<typeof widget.state>({ rxData: { drawerLayout: 'horizontal', oid: 'test.0.page', drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: JSON.stringify(items), ...rxData }, values: {} });
        widget.forceUpdate = vi.fn();
        const api = fixture<Api>(widget);
        const render = (): React.ReactElement<Record<string, unknown>> => widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
        const text = (element: React.ReactElement | undefined): string => (element ? renderToStaticMarkup(element).replace(/<[^>]*>/g, '') : '');
        const bar = () => collectByClass(collectByClass(render(), 'mdw-bar-entries')[0], 'mdw-bar-entry');
        const labels = (): string[] => bar().map(text);
        const entry = (label: string) => { const found = bar().find(element => text(element) === label); if (!found) throw new Error(`no bar entry ${label}`); return found; };
        const press = (label: string): void => (entry(label).props.onClick as () => void)();
        const dropdown = () => collectByClass(render(), 'mdw-dropdown')[0];
        const rows = (): string[] => collectByClass(dropdown(), 'mdc-list-item').map(text);
        const row = (label: string) => { const found = collectByClass(dropdown(), 'mdc-list-item').find(element => text(element) === label); if (!found) throw new Error(`no row ${label}`); return found; };
        const click = (label: string): void => (row(label).props.onClick as () => void)();
        const key = (element: React.ReactElement<Record<string, unknown>> | undefined, name: string): void => (element!.props.onKeyDown as (event: unknown) => void)({ key: name, preventDefault: vi.fn() });
        const select = (index: number): void => { widget.state = fixture<typeof widget.state>({ ...widget.state, values: { 'test.0.page.val': index } }); };
        return { widget, api, setValue, render, bar, labels, entry, press, dropdown, rows, row, click, key, select, text };
    };

    it('shows the top-level entries in the bar instead of a menu button and a drawer', () => {
        const p = make();
        expect(p.labels()).toEqual(['Home', 'Haus', 'Web', 'Garten']);
        expect(collectByClass(p.render(), 'mdc-top-app-bar__navigation-icon')).toHaveLength(0);
        expect(collectByClass(p.render(), 'mdc-drawer')).toHaveLength(0);
        expect(collectByClass(p.entry('Haus'), 'mdi-menu-down')).toHaveLength(1);
        expect(collectByClass(p.entry('Home'), 'mdi-menu-down')).toHaveLength(0);
    });

    it('skips empty editor entries but keeps their numbers', () => {
        const p = make({ drawerItemsDataMethod: 'inputPerEditor', navItemCount: 3, labels0: 'A', labels2: 'C' });
        expect(p.labels()).toEqual(['A', 'C']);
        p.press('C');
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 2);
    });

    it('writes the index and the path of a leaf entry and opens a URL entry through the filter', () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const p = make({ selectedItemName_oid: 'test.0.name' });
        p.press('Home');
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 0);
        expect(p.setValue).toHaveBeenCalledWith('test.0.name', 'Home');
        p.press('Web');
        expect(open).toHaveBeenCalledWith('https://example.org/', '_blank', 'noopener,noreferrer');
        expect(p.setValue).not.toHaveBeenCalledWith('test.0.page', 6);
        const evil = make({}, { items: [{ text: 'X', url: 'javascript:alert(1)' }] });
        open.mockClear();
        evil.press('X');
        expect(open).not.toHaveBeenCalled();
    });

    it('marks the top-level entry that holds the selection with a background', () => {
        const active = (rxData: Record<string, unknown>): string[] => make(rxData).bar().filter(element => String(element.props.className).includes('mdw-bar-entry--active')).map(element => renderToStaticMarkup(element).replace(/<[^>]*>/g, ''));
        expect(active({ navDefaultValue: 3 })).toEqual(['Haus']);
        expect(active({ navDefaultValue: 0 })).toEqual(['Home']);
        expect(active({ navDefaultValue: 99 })).toEqual([]);
        expect(active({ navDisableDefaultValue: true })).toEqual([]);
    });

    it.each([
        ['at the default 800 px', {}, 800, true],
        ['below the default', {}, 799, false],
        ['with an empty width field', { permanentIfResolutionHigherThan: '' }, 799, false],
        ['with a text in the width field', { permanentIfResolutionHigherThan: 'abc' }, 800, true],
        ['with 0 on a phone', { permanentIfResolutionHigherThan: 0 }, 360, true],
        ['below an own width', { permanentIfResolutionHigherThan: 1000 }, 999, false],
    ])('shows the bar or falls back to the modal drawer %s', (_name, rxData, width, barShown) => {
        const p = make(rxData, { width });
        expect(collectByClass(p.render(), 'mdw-bar-entries').length > 0).toBe(barShown);
        expect(collectByClass(p.render(), 'mdc-top-app-bar__navigation-icon').length > 0).toBe(!barShown);
    });

    it('keeps an unknown layout value modal', () => {
        const p = make({ drawerLayout: 'sideways' });
        expect(collectByClass(p.render(), 'mdw-bar-entries')).toHaveLength(0);
        expect(collectByClass(p.render(), 'mdc-top-app-bar__navigation-icon')).toHaveLength(1);
    });

    it('closes an open drawer when the window grows into the bar and does not reopen it', () => {
        const p = make({}, { width: 500 });
        (collectByClass(p.render(), 'mdc-top-app-bar__navigation-icon')[0].props.onClick as () => void)();
        expect(collectByClass(p.render(), 'mdc-drawer')).toHaveLength(1);
        viewport(1280);
        expect(collectByClass(p.render(), 'mdc-drawer')).toHaveLength(0);
        viewport(500);
        expect(collectByClass(p.render(), 'mdc-drawer')).toHaveLength(0);
    });

    it('re-renders once per animation frame when the window is resized', () => {
        let frame: FrameRequestCallback | undefined;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        const p = make();
        p.api.componentDidMount();
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('resize'));
        expect(p.widget.forceUpdate).not.toHaveBeenCalled();
        frame!(0);
        expect(p.widget.forceUpdate).toHaveBeenCalledTimes(1);
        p.api.componentWillUnmount();
        frame = undefined;
        window.dispatchEvent(new Event('resize'));
        expect(frame).toBeUndefined();
    });

    it('ignores the swipe in the bar', () => {
        const p = make({ openDrawerBySwipe: true });
        p.api.root = { getClientRects: () => [{}] };
        p.api.onTouchStart({ touches: [{ clientX: 5, clientY: 300 }] });
        p.api.onTouchEnd({ changedTouches: [{ clientX: 150, clientY: 300 }] });
        expect(p.api.open).toBe(false);
    });

    it('ignores the menu-button-only option in the bar and caps the title at half the bar', () => {
        const p = make({ showOnlyMenuButton: true, titleTopAppBar: 'Zuhause', showSelectedItemAsTitle: false });
        const title = collectByClass(p.render(), 'mdc-top-app-bar__title')[0];
        expect(renderToStaticMarkup(title)).toContain('Zuhause');
        expect((title.props.style as React.CSSProperties).maxWidth).toBe('50%');
        expect(p.labels()).toEqual(['Home', 'Haus', 'Web', 'Garten']);
    });

    it('names the bar for screen readers and marks entries with a submenu as disclosure buttons', () => {
        const p = make();
        expect(collectByClass(p.render(), 'mdw-bar-entries')[0].props['aria-label']).toBe('ariaNavigation');
        const haus = p.entry('Haus').props;
        // The disclosure pattern has no aria-haspopup: it would announce an arrow-key menu that is not there.
        expect([haus['aria-haspopup'], haus['aria-expanded'], haus['aria-controls']]).toEqual([undefined, false, 'mdw-nav-w000001']);
        const home = p.entry('Home').props;
        expect([home['aria-haspopup'], home['aria-expanded'], home['aria-controls']]).toEqual([undefined, undefined, undefined]);
        expect(p.entry('Home').type).toBe('button');
    });

    it('shows only icons with a tooltip when labels are off', () => {
        const p = make({ showLabels: false });
        const home = p.bar()[0];
        expect(collectByClass(home, 'mdi-home')).toHaveLength(1);
        expect([home.props['aria-label'], home.props.title]).toEqual(['Home', 'Home']);
        expect(renderToStaticMarkup(home)).not.toContain('>Home<');
    });

    it('prefixes the index in the bar when the index option is on', () => {
        expect(make({ showIndexNum: true }).labels()).toEqual(['[0] Home', '[1] Haus', '[6] Web', '[7] Garten']);
    });

    // The bar entry sits inside the section padding: its bottom is 56, the bar's bottom 64.
    const anchorAt = (p: ReturnType<typeof make>, left: number): void => {
        p.api.root = { querySelector: (selector: string) => ({ getBoundingClientRect: () => (selector === '.mdc-top-app-bar' ? { left: 0, bottom: 64 } : { left, bottom: 56 }) }), contains: () => false };
    };

    it('opens the submenu of a bar entry in a dropdown over the page', () => {
        const p = make();
        anchorAt(p, 1200);
        p.press('Haus');
        expect(p.rows()).toEqual(['EG', 'OG']);
        expect(p.entry('Haus').props['aria-expanded']).toBe(true);
        const portals = findPortals(p.render());
        expect(portals).toHaveLength(1);
        expect(portals[0].containerInfo).toBe(document.body);
        const outer = collectByClass(p.render(), 'materialdesign-topAppBar-with-Drawer').find(element => collectByClass(element, 'mdw-dropdown').length && !collectByClass(element, 'mdw-bar-entries').length)!;
        expect(outer.props.style).toMatchObject({ left: 1016, top: 64, position: 'fixed', zIndex: 1000, width: 256 });
        expect((p.dropdown().props.style as React.CSSProperties).maxHeight).toBe(728);
        expect(p.dropdown().props.id).toBe('mdw-nav-w000001');
    });

    it('draws the dropdown inside the widget box in the editor', () => {
        const p = make({}, { editMode: true });
        anchorAt(p, 100);
        p.press('Haus');
        expect(p.rows()).toEqual(['EG', 'OG']);
        expect(findPortals(p.render())).toHaveLength(0);
    });

    it('carries the Material 3 classes into the portalled dropdown', () => {
        const p = make({ designStyle: 'material3' });
        anchorAt(p, 100);
        p.press('Haus');
        const outer = findPortals(p.render())[0].children as React.ReactElement<Record<string, unknown>>;
        expect(String(outer.props.className)).toContain('mdw-style-material3');
    });

    it('closes the dropdown with a second press and when a leaf in the bar is chosen', () => {
        const p = make();
        p.press('Haus');
        p.press('Haus');
        expect(p.dropdown()).toBeUndefined();
        p.press('Haus');
        p.press('Home');
        expect(p.dropdown()).toBeUndefined();
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 0);
    });

    it('writes the index of an entry that also writes on toggle and keeps its dropdown open', () => {
        const p = make({}, { items: [{ text: 'Haus', setValueOnMenuToggleClick: true, subMenus: [{ text: 'EG' }] }, { text: 'Garten' }] as unknown as typeof menu });
        p.press('Haus');
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 0);
        p.select(0);
        expect(p.rows()).toEqual(['EG']);
    });

    it('unfolds deeper levels inside the dropdown and writes index and path', () => {
        const p = make({ selectedItemName_oid: 'test.0.name' });
        p.press('Haus');
        p.click('EG');
        expect(p.rows()).toEqual(['EG', 'Wohnzimmer', 'Küche', 'OG']);
        p.click('Wohnzimmer');
        expect(p.setValue).toHaveBeenCalledWith('test.0.page', 3);
        expect(p.setValue).toHaveBeenCalledWith('test.0.name', 'Haus.eg.Wohnzimmer');
        expect(p.dropdown()).toBeUndefined();
    });

    it('steps through levels in place inside the dropdown, with the bar entry as the floor', () => {
        const p = make({ subMenuMode: 'slide' });
        const back = () => collectByClass(p.dropdown(), 'mdw-submenu-back')[0];
        p.press('Haus');
        expect(p.rows()).toEqual(['EG', 'OG']);
        expect(back()).toBeUndefined();
        p.click('EG');
        expect(p.rows()).toEqual(['Wohnzimmer', 'Küche']);
        expect(renderToStaticMarkup(back())).toContain('EG');
        (back().props.onClick as () => void)();
        expect(p.rows()).toEqual(['EG', 'OG']);
        expect(back()).toBeUndefined();
        p.key(p.row('OG'), 'Escape');
        expect(p.dropdown()).toBeUndefined();
    });

    it('opens on the level or with the path of the selected entry', () => {
        const slide = make({ subMenuMode: 'slide', navDefaultValue: 3 });
        slide.press('Haus');
        expect(slide.rows()).toEqual(['Wohnzimmer', 'Küche']);
        const inline = make({ navDefaultValue: 3 });
        inline.press('Haus');
        expect(inline.rows()).toEqual(['EG', 'Wohnzimmer', 'Küche', 'OG']);
    });

    it('closes on a pointer down outside and on a page scroll, not inside the dropdown or on the bar', () => {
        const p = make();
        const dropdown = document.createElement('div');
        const row = dropdown.appendChild(document.createElement('span'));
        const barEntry = document.createElement('button');
        p.api.dropdownEl = dropdown;
        p.api.root = { contains: (node: Node) => node === barEntry, querySelector: () => null };
        p.api.menu = 1;
        p.api.onPointerDown({ target: row });
        p.api.onPointerDown({ target: barEntry });
        expect(p.api.menu).toBe(1);
        p.api.onPointerDown({ target: document.body });
        expect(p.api.menu).toBeNull();
        p.api.menu = 1;
        p.api.onScroll({ target: row });
        expect(p.api.menu).toBe(1);
        p.api.onScroll({ target: document });
        expect(p.api.menu).toBeNull();
    });

    it('closes on a window resize', () => {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
        const p = make();
        p.press('Haus');
        p.api.onWindowResize();
        expect(p.api.menu).toBeNull();
    });

    it('shows every submenu closed after the dropdown closed, if switched on', () => {
        const run = (collapseSubMenusOnClose: boolean): string[] => {
            const p = make({ collapseSubMenusOnClose });
            p.press('Haus');
            p.click('EG');
            p.press('Haus');
            p.press('Haus');
            return p.rows();
        };
        expect(run(true)).toEqual(['EG', 'OG']);
        expect(run(false)).toEqual(['EG', 'Wohnzimmer', 'Küche', 'OG']);
    });

    it('moves focus into the dropdown with the down arrow and back to the bar with Escape', () => {
        vi.useFakeTimers();
        const p = make();
        const focused: string[] = [];
        const host = { querySelector: (selector: string) => ({ focus: () => focused.push(selector), getBoundingClientRect: () => ({ left: 100, bottom: 64 }) }), contains: () => false };
        p.api.root = host;
        p.key(p.entry('Haus'), 'ArrowDown');
        vi.runAllTimers();
        expect(p.rows()).toEqual(['EG', 'OG']);
        expect(focused.at(-1)).toBe('#mdw-nav-w000001 .mdw-submenu-back, #mdw-nav-w000001 .mdc-list-item');
        p.key(p.row('OG'), 'Escape');
        vi.runAllTimers();
        expect(p.dropdown()).toBeUndefined();
        expect(focused.at(-1)).toBe('[data-bar-index="1"]');
    });

    it('puts every dropdown row in the tab order but keeps the roving index in the drawer', () => {
        const p = make();
        p.press('Haus');
        expect(collectByClass(p.dropdown(), 'mdc-list-item').map(element => element.props.tabIndex)).toEqual([0, 0]);
        const drawer = make({}, { width: 500 });
        (collectByClass(drawer.render(), 'mdc-top-app-bar__navigation-icon')[0].props.onClick as () => void)();
        expect(collectByClass(collectByClass(drawer.render(), 'mdc-drawer')[0], 'mdc-list-item').map(element => element.props.tabIndex)).toEqual([0, -1, -1, -1]);
    });

    it('moves the entries that do not fit into More and lists them there with header and divider', () => {
        const p = make();
        p.api.fit = 1;
        expect(p.labels()).toEqual(['Home', 'navMore']);
        p.press('navMore');
        const html = renderToStaticMarkup(p.dropdown());
        expect(p.rows()).toEqual(['Haus', 'Web', 'Garten']);
        expect(html).toContain('Gebäude');
        expect(collectByClass(p.dropdown(), 'mdc-list-divider')).toHaveLength(1);
        expect(p.entry('navMore').props['aria-expanded']).toBe(true);
        expect(p.entry('navMore').props['aria-haspopup']).toBeUndefined();
    });

    it('shows only More when no entry fits and no More when all fit', () => {
        const p = make();
        p.api.fit = 0;
        expect(p.labels()).toEqual(['navMore']);
        p.api.fit = 4;
        expect(p.labels()).toEqual(['Home', 'Haus', 'Web', 'Garten']);
    });

    it('marks More when the selection sits in an entry inside it', () => {
        const p = make({ navDefaultValue: 3 });
        p.api.fit = 1;
        expect(p.bar().filter(element => String(element.props.className).includes('mdw-bar-entry--active')).map(p.text)).toEqual(['navMore']);
    });

    it('steps into a submenu in place inside More, with the More list as the floor', () => {
        const p = make({ subMenuMode: 'slide' });
        p.api.fit = 1;
        p.press('navMore');
        p.click('Haus');
        expect(p.rows()).toEqual(['EG', 'OG']);
        (collectByClass(p.dropdown(), 'mdw-submenu-back')[0].props.onClick as () => void)();
        expect(p.rows()).toEqual(['Haus', 'Web', 'Garten']);
        expect(collectByClass(p.dropdown(), 'mdw-submenu-back')).toHaveLength(0);
    });

    // offsetWidth and clientWidth round to whole pixels, the layout does not.
    const box = (width: number) => ({ offsetWidth: Math.round(width), clientWidth: Math.floor(width), getBoundingClientRect: () => ({ width }) });

    it('measures the hidden copy and re-renders only when the count changes', () => {
        const p = make();
        const probe = { querySelectorAll: () => [box(100), box(100), box(100), box(100)], querySelector: () => box(80) };
        let room = 300;
        p.api.root = { querySelector: (selector: string) => (selector === '.mdw-bar-probe' ? probe : box(room)) };
        p.api.measure();
        expect(p.api.fit).toBe(2);
        expect(p.widget.forceUpdate).toHaveBeenCalledTimes(1);
        p.api.measure();
        expect(p.widget.forceUpdate).toHaveBeenCalledTimes(1);
        room = 400;
        p.api.measure();
        expect(p.api.fit).toBe(4);
        p.api.root = { querySelector: () => null };
        p.api.measure();
        expect(p.api.fit).toBe(4);
    });

    it('renders the hidden copy with every entry and More, out of the accessibility tree', () => {
        const p = make();
        p.api.fit = 1;
        const probe = collectByClass(p.render(), 'mdw-bar-probe')[0];
        expect(probe.props['aria-hidden']).toBe('true');
        const copies = collectByClass(probe, 'mdw-bar-entry');
        expect(copies).toHaveLength(5);
        expect(copies.every(copy => copy.props.tabIndex === -1 && copy.props.onClick === undefined)).toBe(true);
    });

    it('measures again when the widget box changes size and stops on unmount', () => {
        const observe = vi.fn();
        const disconnect = vi.fn();
        let changed: (() => void) | undefined;
        vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { changed = callback; } observe = observe; disconnect = disconnect; });
        const p = make();
        const root = { querySelector: () => null };
        p.api.root = root;
        const measure = vi.spyOn(p.api, 'measure');
        p.api.componentDidMount();
        expect(observe).toHaveBeenCalledWith(root);
        measure.mockClear();
        changed!();
        expect(measure).toHaveBeenCalledTimes(1);
        p.api.componentWillUnmount();
        expect(disconnect).toHaveBeenCalled();
    });

    it('mounts without a ResizeObserver', () => {
        vi.stubGlobal('ResizeObserver', undefined);
        const p = make();
        p.api.root = { querySelector: () => null };
        expect(() => { p.api.componentDidMount(); p.api.componentWillUnmount(); }).not.toThrow();
    });

    it('offers horizontal as a layout and shows the switch width only for auto and horizontal', () => {
        const fields = (MaterialDesignTopAppBar.getWidgetInfo().visAttrs.find(group => group.name === 'drawerLayout')!.fields) as Array<{ name: string; options?: unknown[]; hidden?: (data: Record<string, unknown>) => boolean }>;
        expect(fields.find(field => field.name === 'drawerLayout')!.options).toEqual(['modal', 'permanent', 'auto', 'horizontal']);
        const hidden = fields.find(field => field.name === 'permanentIfResolutionHigherThan')!.hidden!;
        expect([{}, { drawerLayout: 'modal' }, { drawerLayout: 'permanent' }, { drawerLayout: 'auto' }, { drawerLayout: 'horizontal' }].map(hidden)).toEqual([true, true, true, false, false]);
    });

    it('has the More label and the navigation name in every language', () => {
        const dictionaries = import.meta.glob<Record<string, string>>('../../admin/i18n/*.json', { eager: true, import: 'default' });
        expect(Object.keys(dictionaries)).toHaveLength(11);
        for (const [file, words] of Object.entries(dictionaries)) {
            for (const key of ['navMore', 'ariaNavigation', 'permanentIfResolutionHigherThan']) expect(words[key], `${file} ${key}`).toBeTruthy();
            expect(words.permanentIfResolutionHigherThan, file).toContain('horizontal');
        }
    });

    const drawerRows = (p: ReturnType<typeof make>): string[] => collectByClass(collectByClass(p.render(), 'mdc-drawer')[0], 'mdc-list-item').map(p.text);
    const openDrawer = (p: ReturnType<typeof make>): void => (collectByClass(p.render(), 'mdc-top-app-bar__navigation-icon')[0].props.onClick as () => void)();
    const event = (rest: Record<string, unknown>) => ({ preventDefault: vi.fn(), shiftKey: false, ...rest });
    const focusSpy = (p: ReturnType<typeof make>, rows: unknown[] = []) => {
        const focused: string[] = [];
        const target = (selector: string) => ({ focus: () => focused.push(selector), getBoundingClientRect: () => ({ left: 100, bottom: 64 }) });
        p.api.root = { querySelector: target, contains: (node: unknown) => node === 'bar' };
        p.api.dropdownEl = { querySelector: target, querySelectorAll: () => rows, contains: (node: unknown) => node === 'row' || rows.includes(node) };
        return focused;
    };

    it('opens the drawer on the first level after a dropdown closed and the window narrowed', () => {
        const p = make({ subMenuMode: 'slide' });
        p.press('Haus');
        p.press('Haus');
        viewport(500);
        openDrawer(p);
        expect(drawerRows(p)).toEqual(['Home', 'Haus', 'Web', 'Garten']);
        expect(collectByClass(p.render(), 'mdw-submenu-back')).toHaveLength(0);
    });

    it('closes the submenus of the drawer when the window grows into the bar, if switched on', () => {
        const run = (collapseSubMenusOnClose: boolean): string[] => {
            const p = make({ subMenuMode: 'slide', collapseSubMenusOnClose }, { width: 500 });
            openDrawer(p);
            (collectByClass(collectByClass(p.render(), 'mdc-drawer')[0], 'mdc-list-item').find(element => p.text(element) === 'Haus')!.props.onClick as () => void)();
            viewport(1280);
            p.render();
            viewport(500);
            openDrawer(p);
            return drawerRows(p);
        };
        expect(run(true)).toEqual(['Home', 'Haus', 'Web', 'Garten']);
        expect(run(false)).toEqual(['EG', 'OG']);
    });

    it('closes the dropdown with Escape on the focused bar entry and keeps the focus there', () => {
        vi.useFakeTimers();
        const p = make();
        const focused = focusSpy(p);
        const nav = () => collectByClass(p.render(), 'mdw-bar-entries')[0];
        const idle = event({ key: 'Escape' });
        (nav().props.onKeyDown as (e: unknown) => void)(idle);
        expect(idle.preventDefault).not.toHaveBeenCalled();
        p.press('Haus');
        (nav().props.onKeyDown as (e: unknown) => void)(event({ key: 'Escape' }));
        vi.runAllTimers();
        expect(p.dropdown()).toBeUndefined();
        expect(focused.at(-1)).toBe('[data-bar-index="1"]');
    });

    it('moves Tab from the open bar entry into the dropdown and Shift+Tab from its first row back', () => {
        vi.useFakeTimers();
        const p = make();
        const first = { name: 'first' };
        const last = { name: 'last' };
        const focused = focusSpy(p, [first, last]);
        p.press('Haus');
        const tab = event({ key: 'Tab' });
        (p.entry('Haus').props.onKeyDown as (e: unknown) => void)(tab);
        vi.runAllTimers();
        expect(tab.preventDefault).toHaveBeenCalled();
        expect(focused.at(-1)).toBe('#mdw-nav-w000001 .mdw-submenu-back, #mdw-nav-w000001 .mdc-list-item');
        const back = event({ key: 'Tab', shiftKey: true, target: first });
        (p.dropdown().props.onKeyDown as (e: unknown) => void)(back);
        vi.runAllTimers();
        expect(back.preventDefault).toHaveBeenCalled();
        expect(focused.at(-1)).toBe('[data-bar-index="1"]');
        expect(p.dropdown()).toBeDefined();
        const inside = event({ key: 'Tab', shiftKey: true, target: last });
        (p.dropdown().props.onKeyDown as (e: unknown) => void)(inside);
        expect(inside.preventDefault).not.toHaveBeenCalled();
    });

    it('closes the dropdown on Tab from its last row and moves on to the next bar entry', () => {
        vi.useFakeTimers();
        const p = make();
        const last = { name: 'last' };
        const focused = focusSpy(p, [{ name: 'first' }, last]);
        p.press('Haus');
        const tab = event({ key: 'Tab', target: last });
        (p.dropdown().props.onKeyDown as (e: unknown) => void)(tab);
        vi.runAllTimers();
        expect(tab.preventDefault).toHaveBeenCalled();
        expect(p.dropdown()).toBeUndefined();
        expect(focused.at(-1)).toBe('[data-bar-index="6"]');
    });

    it('puts the focus back on the open bar entry on Tab from the last row when no entry follows', () => {
        vi.useFakeTimers();
        const p = make();
        const last = { name: 'last' };
        const focused = focusSpy(p, [{ name: 'first' }, last]);
        p.api.fit = 1;
        p.press('navMore');
        focused.length = 0;
        const end = event({ key: 'Tab', target: last });
        (p.dropdown().props.onKeyDown as (e: unknown) => void)(end);
        expect(focused).toEqual(['[data-bar-index="more"]']);
        expect(end.preventDefault).not.toHaveBeenCalled();
        expect(p.dropdown()).toBeUndefined();
    });

    it('closes the dropdown when the focus leaves it and the bar, not when it stays inside', () => {
        const p = make();
        focusSpy(p);
        p.press('Haus');
        const blur = (relatedTarget: unknown): void => (p.dropdown().props.onBlur as (e: unknown) => void)({ relatedTarget });
        blur('row');
        blur('bar');
        // Clicking empty space moves the focus to no element; the pointer-down rule closes then.
        blur(null);
        expect(p.api.menu).toBe(1);
        blur(document.body);
        expect(p.api.menu).toBeNull();
    });

    it('closes the dropdown when the focus leaves the bar entry for the page, not for the dropdown or the bar', () => {
        const p = make();
        focusSpy(p);
        p.press('Haus');
        const nav = (): React.ReactElement<Record<string, unknown>> => collectByClass(p.render(), 'mdw-bar-entries')[0];
        const blur = (relatedTarget: unknown): void => (nav().props.onBlur as (e: unknown) => void)({ relatedTarget });
        blur('row');
        blur('bar');
        blur(null);
        expect(p.api.menu).toBe(1);
        // Shift+Tab out of the first bar entry.
        blur(document.body);
        expect(p.api.menu).toBeNull();
    });

    it.each([
        ['spaces and quotes', 'w0 "1\'', 'mdw-nav-w01'],
        ['selector characters', 'w#2.x]', 'mdw-nav-w2x'],
    ])('keeps only safe characters of a widget id with %s in the dropdown id', (_name, id, expected) => {
        const p = make({}, { id });
        p.press('Haus');
        expect(p.dropdown().props.id).toBe(expected);
        expect(p.entry('Haus').props['aria-controls']).toBe(expected);
    });

    it.each([['empty', ''], ['without one safe character', '#." ']])('gives every widget its own dropdown id when the widget id is %s', (_name, id) => {
        const ids = [make({}, { id }), make({}, { id })].map(p => { p.press('Haus'); return String(p.dropdown().props.id); });
        expect(ids[0]).toMatch(/^mdw-nav-u\d+$/);
        expect(ids[1]).toMatch(/^mdw-nav-u\d+$/);
        expect(ids[0]).not.toBe(ids[1]);
    });

    it('lets the dropdown start at the bottom of the bar, not of the entry', () => {
        const p = make();
        anchorAt(p, 300);
        p.press('Haus');
        const outer = findPortals(p.render())[0].children as React.ReactElement<Record<string, unknown>>;
        expect(outer.props.style).toMatchObject({ left: 300, top: 64 });
    });

    it('keeps the active background when the pointer hovers the active entry, and hover only for pointers that hover', () => {
        const p = make();
        const css = String((React.Children.toArray(p.render().props.children as React.ReactNode) as Array<React.ReactElement<{ children: string }>>).find(child => child.type === 'style')!.props.children);
        expect(css).toContain('@media (hover:hover){.materialdesign-topAppBar-with-Drawer .mdw-bar-entry:hover::before{opacity:.08}}');
        expect(css).toContain('.materialdesign-topAppBar-with-Drawer .mdw-bar-entry--active::before,.materialdesign-topAppBar-with-Drawer .mdw-bar-entry--active:hover::before{opacity:.16}');
    });

    it('keeps a gap between the title and the first entry, as a margin outside the measured room', () => {
        const style = collectByClass(make().render(), 'mdw-bar-entries')[0].props.style as React.CSSProperties;
        expect(style.marginLeft).toBe(8);
        expect(style.padding ?? style.paddingLeft).toBeUndefined();
    });

    it('cuts a long title with an ellipsis in the bar and leaves the other layouts as they were', () => {
        const parts = (p: ReturnType<typeof make>) => {
            const title = collectByClass(p.render(), 'mdc-top-app-bar__title')[0];
            return { title, text: (React.Children.toArray(title.props.children as React.ReactNode) as Array<React.ReactElement<Record<string, unknown>>>).at(-1)! };
        };
        const bar = parts(make({ navDefaultValue: 0 }));
        expect(bar.text.props.style).toEqual({ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
        const modal = parts(make({ navDefaultValue: 0 }, { width: 500 }));
        expect(modal.text.props.style).toBeUndefined();
        expect((modal.title.props.style as React.CSSProperties).flex).toBeUndefined();
        expect((bar.title.props.style as React.CSSProperties).flex).toBeUndefined();
    });

    it('keeps the label of an entry without an icon when labels are off', () => {
        const p = make({ showLabels: false });
        const haus = p.entry('Haus');
        expect([haus.props['aria-label'], haus.props.title]).toEqual([undefined, undefined]);
        expect(p.bar()[0].props['aria-label']).toBe('Home');
    });

    it('closes the submenus when one dropdown replaces another, if switched on', () => {
        const items = [{ text: 'A', subMenus: [{ text: 'A1', subMenus: [{ text: 'A1x' }] }] }, { text: 'B', subMenus: [{ text: 'B1' }] }] as unknown as typeof menu;
        const run = (collapseSubMenusOnClose: boolean): string[] => {
            const p = make({ collapseSubMenusOnClose }, { items });
            p.press('A');
            p.click('A1');
            p.press('B');
            p.press('A');
            return p.rows();
        };
        expect(run(true)).toEqual(['A1']);
        expect(run(false)).toEqual(['A1', 'A1x']);
    });

    it('opens on the first level of the entry, not on the level of the selection, when submenus close on close', () => {
        const p = make({ subMenuMode: 'slide', collapseSubMenusOnClose: true, navDefaultValue: 3 });
        p.press('Haus');
        expect(p.rows()).toEqual(['EG', 'OG']);
    });

    it('closes a dropdown whose entry is gone or has no submenu any more after a data change', () => {
        const change = (next: unknown[]): ReturnType<typeof make> => {
            const p = make();
            p.press('Haus');
            p.widget.state = fixture<typeof p.widget.state>({ ...p.widget.state, rxData: { ...p.widget.state.rxData, drawerItemsJsonString: JSON.stringify(next) } });
            return p;
        };
        const gone = change([{ text: 'Home' }]);
        expect(gone.dropdown()).toBeUndefined();
        expect(gone.api.menu).toBeNull();
        const leaf = change([{ text: 'Home' }, { text: 'Garten' }]);
        expect(leaf.dropdown()).toBeUndefined();
        const more = make();
        more.api.fit = 1;
        more.press('navMore');
        more.api.fit = 4;
        expect(more.dropdown()).toBeUndefined();
        expect(more.api.menu).toBeNull();
    });

    it('measures again once the web fonts have loaded', async () => {
        let loaded!: () => void;
        Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise<void>(resolve => { loaded = resolve; }) } });
        try {
            const p = make();
            p.api.root = { querySelector: () => null };
            const measure = vi.spyOn(p.api, 'measure');
            p.api.componentDidMount();
            expect(measure).toHaveBeenCalledTimes(1);
            loaded();
            await Promise.resolve();
            await Promise.resolve();
            expect(measure).toHaveBeenCalledTimes(2);
            p.api.componentWillUnmount();
        } finally {
            delete (document as { fonts?: unknown }).fonts;
        }
    });

    it('measures with fractional widths, so a last entry that would overflow by a fraction goes into More', () => {
        const p = make();
        const probe = { querySelectorAll: () => [box(100.4), box(100.4)], querySelector: () => box(80) };
        p.api.root = { querySelector: (selector: string) => (selector === '.mdw-bar-probe' ? probe : box(200.6)) };
        p.api.measure();
        expect(p.api.fit).toBe(1);
    });

    it('keeps a scroll inside the dropdown from scrolling the page behind it', () => {
        const p = make();
        p.press('Haus');
        expect((p.dropdown().props.style as React.CSSProperties).overscrollBehavior).toBe('contain');
    });

    it('gives the portalled dropdown the ink of its surface, so headers do not take the page colour', () => {
        const p = make();
        p.api.fit = 1;
        p.press('navMore');
        const ink = (collectByClass(p.dropdown(), 'mdc-list-item')[0].props.style as React.CSSProperties).color;
        expect(ink).toBeTruthy();
        expect((p.dropdown().props.style as React.CSSProperties).color).toBe(ink);
        const drawer = make({}, { width: 500 });
        openDrawer(drawer);
        expect((collectByClass(drawer.render(), 'mdc-drawer')[0].props.style as React.CSSProperties).color).toBeUndefined();
    });

    it('vibrates when a bar entry opens its dropdown, as a drawer entry does', () => {
        const vibrate = vi.fn();
        Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
        try {
            const p = make({ vibrateDrawerOnMobilDevices: 30 });
            p.press('Haus');
            expect(vibrate).toHaveBeenCalledWith(30);
            vibrate.mockClear();
            p.press('Haus');
            expect(vibrate).not.toHaveBeenCalled();
        } finally {
            delete (navigator as { vibrate?: unknown }).vibrate;
        }
    });
});
