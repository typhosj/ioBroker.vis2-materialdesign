import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignTopAppBar from './MaterialDesignTopAppBar';

function fixture<T>(value: unknown): T { return value as T; }

function collectByClass(node: React.ReactNode, className: string): Array<React.ReactElement<Record<string, unknown>>> {
    if (Array.isArray(node)) return node.flatMap(child => collectByClass(child, className));
    if (!React.isValidElement(node)) return [];
    const element = node as React.ReactElement<Record<string, unknown>>;
    const own = typeof element.props.className === 'string' && element.props.className.split(' ').includes(className) ? [element] : [];
    return [...own, ...collectByClass(element.props.children as React.ReactNode, className)];
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

describe('top app bar submenus (issue #31)', () => {
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
