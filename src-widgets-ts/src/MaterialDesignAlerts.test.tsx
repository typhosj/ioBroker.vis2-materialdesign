import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignAlerts from './MaterialDesignAlerts';

function fixture<T>(value: unknown): T { return value as T; }

function widget(rxData: Record<string, unknown>, values: Record<string, unknown> = {}, id = 'w00001'): MaterialDesignAlerts {
    const setValue = vi.fn();
    const alerts = new MaterialDesignAlerts(fixture<ConstructorParameters<typeof MaterialDesignAlerts>[0]>({ id, context: { setValue } }));
    alerts.state = fixture<typeof alerts.state>({ rxData, values });
    return alerts;
}

function render(rxData: Record<string, unknown>, values: Record<string, unknown> = {}, id = 'w00001'): string {
    const alerts = widget(rxData, values, id);
    return renderToStaticMarkup(alerts.renderWidgetBody(fixture<Parameters<MaterialDesignAlerts['renderWidgetBody']>[0]>({})));
}

const two = JSON.stringify([{ text: 'first' }, { text: 'second' }]);

describe('alert list', () => {
    it('renders one alert per JSON entry', () => {
        const html = render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': two });
        expect(html).toContain('first');
        expect(html).toContain('second');
    });

    it('shows nothing at all for an empty state instead of an error alert', () => {
        const html = render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': '' });
        expect(html).not.toContain('Error in JSON string');
        expect(html).not.toContain('v-alert ');
    });

    it('reports a broken JSON string as one alert', () => {
        expect(render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': '{{' })).toContain('Error in JSON string');
    });

    it('caps the list at showMaxAlerts', () => {
        const html = render({ oid: 'a.0.alerts', showMaxAlerts: 1 }, { 'a.0.alerts.val': two });
        expect(html).toContain('first');
        expect(html).not.toContain('second');
    });

    it('escapes markup coming out of the alert text', () => {
        const html = render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': JSON.stringify([{ text: '<img src=x onerror=alert(1)>' }]) });
        expect(html).not.toContain('onerror');
    });
});

describe('closing an alert', () => {
    // The close button writes the remaining alerts back to the same state, so an off-by-one here
    // deletes the wrong message and the user never sees it again.
    it('removes only the clicked entry and writes the rest back', () => {
        const setValue = vi.fn();
        const alerts = new MaterialDesignAlerts(fixture<ConstructorParameters<typeof MaterialDesignAlerts>[0]>({ id: 'w1', context: { setValue } }));
        alerts.state = fixture<typeof alerts.state>({ rxData: { oid: 'a.0.alerts' }, values: { 'a.0.alerts.val': two } });
        const tree = alerts.renderWidgetBody(fixture<Parameters<MaterialDesignAlerts['renderWidgetBody']>[0]>({}));

        const buttons: Array<{ onClick: () => void }> = [];
        const walk = (node: unknown): void => {
            const element = node as { type?: unknown; props?: { children?: unknown; onClick?: () => void } };
            if (!element || typeof element !== 'object') return;
            if (element.type === 'button' && element.props?.onClick) buttons.push({ onClick: element.props.onClick });
            const children = element.props?.children;
            if (Array.isArray(children)) children.forEach(walk);
            else if (children) walk(children);
        };
        walk(tree);

        expect(buttons).toHaveLength(2);
        buttons[1].onClick();
        expect(setValue).toHaveBeenCalledWith('a.0.alerts', JSON.stringify([{ text: 'first' }]));
    });

    it('does nothing when the state never parsed', () => {
        const setValue = vi.fn();
        const alerts = new MaterialDesignAlerts(fixture<ConstructorParameters<typeof MaterialDesignAlerts>[0]>({ id: 'w1', context: { setValue } }));
        alerts.state = fixture<typeof alerts.state>({ rxData: { oid: 'a.0.alerts' }, values: { 'a.0.alerts.val': '{{' } });
        const html = renderToStaticMarkup(alerts.renderWidgetBody(fixture<Parameters<MaterialDesignAlerts['renderWidgetBody']>[0]>({})));
        expect(html).toContain('Error in JSON string');
        expect(setValue).not.toHaveBeenCalled();
    });
});

describe('alert accessibility and scoping', () => {
    // A widget whose whole job is announcing things needs a live region, or a screen reader user
    // never learns an alert arrived.
    it('announces new alerts through a polite live region', () => {
        const html = render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': two });
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('role="status"');
    });

    it('labels the close button from the dictionary rather than in English', () => {
        // No dictionary is loaded outside the editor, so t() hands the key back — the point is that
        // it is a key at all. `widgetAttrs` proves the key has a value in every language.
        expect(render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': two })).toContain('aria-label="ariaCloseAlert"');
    });

    // The breakpoint rule used to target `.materialdesign-alerts`, which every Alerts widget on the
    // page carries: two of them with different breakpoints and the last one rendered hid both.
    it('scopes the breakpoint rule to this widget', () => {
        const html = render({ oid: 'a.0.alerts', minScreenResolution: 600 }, { 'a.0.alerts.val': two }, 'w42');
        expect(html).toContain('mdw-alerts-w42');
        expect(html).toContain('@media (max-width:599px){.mdw-alerts-w42{display:none!important}}');
        expect(html).not.toContain('{.materialdesign-alerts{display:none');
    });

    it('emits no style block at all without a breakpoint', () => {
        expect(render({ oid: 'a.0.alerts' }, { 'a.0.alerts.val': two })).not.toContain('<style>');
    });
});
