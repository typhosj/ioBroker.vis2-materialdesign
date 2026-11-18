import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MaterialDesignDialog, dialogInfo } from './MaterialDesignDialog';

function fixture<T>(value: unknown): T { return value as T; }

describe('dialog trigger button style', () => {
    const render = (rxData: Record<string, unknown>): string => {
        const dialog = new MaterialDesignDialog(fixture<ConstructorParameters<typeof MaterialDesignDialog>[0]>({ context: { setValue: vi.fn() } }), 'view');
        dialog.state = fixture<typeof dialog.state>({ rxData, values: {} });
        return renderToStaticMarkup(dialog.renderWidgetBody(fixture<Parameters<typeof dialog.renderWidgetBody>[0]>({})));
    };

    it('drops the container for the flat styles and keeps it for the raised ones', () => {
        expect(render({ buttonStyle: 'raised' })).toContain('background:#44739e');
        expect(render({ buttonStyle: 'unelevated' })).toContain('background:#44739e');
        expect(render({ buttonStyle: 'text' })).toContain('background:transparent');
        const outlined = render({ buttonStyle: 'outlined' });
        expect(outlined).toContain('background:transparent');
        expect(outlined).toContain('border:1px solid #44739e');
        expect(render({ buttonStyle: 'raised' })).toContain('box-shadow');
        expect(render({ buttonStyle: 'unelevated' })).not.toContain('box-shadow');
        expect(render({ buttonStyle: 'icon' })).toContain('border-radius:50%');
    });

    // A shadow drawn on the edge of the widget box is clipped away by VIS2 and stays invisible.
    it('gives the raised style room for its shadow', () => {
        expect(render({ buttonStyle: 'raised' })).toContain('margin:4px');
        expect(render({ buttonStyle: 'unelevated' })).not.toContain('margin:4px');
        expect(render({ designStyle: 'material3', buttonStyle: 'raised' })).not.toContain('margin:4px');
    });

    it('maps the style onto the shared M3 button variants', () => {
        expect(render({ designStyle: 'material3', buttonStyle: 'raised' })).toContain('mdw-md3-button--filled');
        expect(render({ designStyle: 'material3', buttonStyle: 'text' })).toContain('mdw-md3-button--text');
        expect(render({ designStyle: 'material3', buttonStyle: 'outlined' })).toContain('mdw-md3-button--outlined');
        expect(render({ designStyle: 'material3', buttonStyle: 'icon' })).toContain('mdw-md3-icon-button');
    });

    it('lets a saved color win over the token in M3', () => {
        expect(render({ designStyle: 'material3', buttonStyle: 'raised', mdwButtonPrimaryColor: '#00696d' })).toContain('background:#00696d');
    });
});

describe('open dialog', () => {
    const OID = '0_userdata.0.dialogOpen';
    const open = (rxData: Record<string, unknown>): HTMLElement => {
        const dialog = new MaterialDesignDialog(fixture<ConstructorParameters<typeof MaterialDesignDialog>[0]>({ context: { setValue: vi.fn() } }), 'view');
        dialog.state = fixture<typeof dialog.state>({ rxData: { showDialogMethod: 'datapoint', showDialogOid: OID, title: 'Neuer Eintrag', ...rxData }, values: { [`${OID}.val`]: true } });
        const host = document.createElement('div');
        host.innerHTML = renderToStaticMarkup(dialog.renderWidgetBody(fixture<Parameters<typeof dialog.renderWidgetBody>[0]>({})));
        return host;
    };

    // The overlay opacity dimmed the dialog itself: it sat on the container that also holds the card.
    it('applies the overlay opacity to the scrim only, never to the dialog card', () => {
        const host = open({ overlayColor: '#000000', overlayOpacity: 0.6 });
        const card = host.querySelector<HTMLElement>('.v-dialog');
        expect(card).not.toBeNull();
        for (let node = card!.parentElement; node && node !== host; node = node.parentElement) {
            expect(node.style.opacity, node.className).toBe('');
        }
        const scrim = host.querySelector<HTMLElement>('.v-overlay__scrim');
        expect(scrim?.style.opacity).toBe('0.6');
        expect(scrim?.style.background).toContain('rgb(0, 0, 0)');
        expect(card!.style.position).toBe('relative');
    });

    it('shows the footer by default and hides it with showFooter off', () => {
        expect(open({}).querySelector('footer')).not.toBeNull();
        expect(open({ showFooter: false }).querySelector('footer')).toBeNull();
    });

    it('has no header close icon by default', () => {
        expect(open({}).querySelector('header button')).toBeNull();
    });

    it('puts a close icon into the header, in the configured color, also without a title', () => {
        const withTitle = open({ showHeaderCloseIcon: true, headerCloseIconColor: '#ffffff' });
        const button = withTitle.querySelector('header button');
        expect(button).not.toBeNull();
        expect(button!.getAttribute('aria-label')).toBeTruthy();
        expect(button!.innerHTML).toContain('#ffffff');
        expect(withTitle.querySelector('header')!.textContent).toContain('Neuer Eintrag');
        const noTitle = open({ showTitle: false, showHeaderCloseIcon: true });
        expect(noTitle.querySelector('header button')).not.toBeNull();
        expect(noTitle.querySelector('header')!.textContent).not.toContain('Neuer Eintrag');
        expect(open({ showTitle: false }).querySelector('header')).toBeNull();
    });
});

// upstream-#156: opened by its button, the dialog never told the object ID, so no script could react.
describe('dialog opened by its button reports to the object ID', () => {
    const OID = '0_userdata.0.dialogOpen';
    type Node = { type?: unknown; props?: Record<string, unknown> };
    // Walks the element tree for the first element of the given tag with a click handler.
    const findClickable = (node: unknown, tag: string, from = 0): (() => void) | undefined => {
        const found: Array<() => void> = [];
        const walk = (current: unknown): void => {
            if (Array.isArray(current)) { current.forEach(walk); return; }
            const element = current as Node | null;
            if (!element || typeof element !== 'object' || !element.props) return;
            if (element.type === tag && typeof element.props.onClick === 'function') found.push(element.props.onClick as () => void);
            walk(element.props.children);
        };
        walk(node);
        return found[from];
    };
    const make = (rxData: Record<string, unknown>) => {
        const setValue = vi.fn();
        const socket = { subscribeState: vi.fn(() => Promise.resolve()), unsubscribeState: vi.fn() };
        const dialog = new MaterialDesignDialog(fixture<ConstructorParameters<typeof MaterialDesignDialog>[0]>({ context: { setValue, socket } }), 'view');
        dialog.state = fixture<typeof dialog.state>({ rxData: { showDialogMethod: 'button', ...rxData }, values: {} });
        dialog.forceUpdate = vi.fn();
        const tree = () => dialog.renderWidgetBody(fixture<Parameters<typeof dialog.renderWidgetBody>[0]>({}));
        return { dialog, setValue, tree };
    };

    it('writes true on open and false on close when switched on', () => {
        const { setValue, tree } = make({ showDialogOid: OID, showDialogOidReport: true });
        findClickable(tree(), 'button')!();
        expect(setValue).toHaveBeenLastCalledWith(OID, true);
        // Open now: the first button with a handler is the trigger, the footer close button follows.
        const open = tree();
        const closeButton = findClickable(open, 'button', 1);
        expect(closeButton).toBeDefined();
        closeButton!();
        expect(setValue).toHaveBeenLastCalledWith(OID, false);
    });

    // vis 1 never wrote the object ID in the button mode; a converted dialog can still carry one.
    it('writes nothing while the option is off', () => {
        for (const report of [undefined, false, '']) {
            const { setValue, tree } = make({ showDialogOid: OID, showDialogOidReport: report });
            findClickable(tree(), 'button')!();
            findClickable(tree(), 'button', 1)?.();
            expect(setValue, String(report)).not.toHaveBeenCalled();
        }
    });

    it('writes nothing without an object ID', () => {
        const { setValue, tree } = make({ showDialogOid: '', showDialogOidReport: true });
        findClickable(tree(), 'button')!();
        findClickable(tree(), 'button', 1)?.();
        expect(setValue).not.toHaveBeenCalled();
    });

    it('writes false when the view changes while the dialog is open', () => {
        const { dialog, setValue, tree } = make({ showDialogOid: OID, showDialogOidReport: true });
        findClickable(tree(), 'button')!();
        dialog.componentWillUnmount();
        expect(setValue.mock.calls).toEqual([[OID, true], [OID, false]]);
    });

    it('writes nothing on unmount when the dialog is closed', () => {
        const { dialog, setValue, tree } = make({ showDialogOid: OID, showDialogOidReport: true });
        dialog.componentWillUnmount();
        expect(setValue).not.toHaveBeenCalled();
        findClickable(tree(), 'button')!();
        findClickable(tree(), 'button', 1)!();
        setValue.mockClear();
        dialog.componentWillUnmount();
        expect(setValue).not.toHaveBeenCalled();
    });

    it('offers the option only for the button mode', () => {
        const field = dialogInfo('view').visAttrs.flatMap(group => group.fields as Array<{ name: string; hidden?: (data: Record<string, unknown>) => boolean }>).find(entry => entry.name === 'showDialogOidReport');
        expect(field?.hidden?.({ showDialogMethod: 'button' })).toBe(false);
        expect(field?.hidden?.({})).toBe(false);
        expect(field?.hidden?.({ showDialogMethod: 'datapoint' })).toBe(true);
    });
});
