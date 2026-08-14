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

        (widget as unknown as { open: boolean }).open = true;
        const open = widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement<Record<string, unknown>>;
        applyRef(open, root);
        expect(wrapper.style.zIndex).toBe('1000');
        expect((collectByClass(open, 'mdc-drawer')[0].props.style as React.CSSProperties).pointerEvents).toBe('auto');
        expect((collectByClass(open, 'mdc-drawer-scrim')[0].props.style as React.CSSProperties).pointerEvents).toBe('auto');

        (widget as unknown as { open: boolean }).open = false;
        applyRef(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})) as React.ReactElement, root);
        expect(wrapper.style.zIndex).toBe('5');
    });

    it('bounds JSON input and renders a visible error item for malformed data', () => {
        const widget = new MaterialDesignTopAppBar(fixture<ConstructorParameters<typeof MaterialDesignTopAppBar>[0]>({ context: {} }));
        widget.state = fixture<typeof widget.state>({
            rxData: { drawerLayout: 'permanent', drawerItemsDataMethod: 'jsonStringObject', drawerItemsJsonString: '{broken' },
            values: {},
        });
        expect(renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignTopAppBar['renderWidgetBody']>[0]>({})))).toContain('Error in JSON string');
    });
});
