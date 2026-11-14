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
