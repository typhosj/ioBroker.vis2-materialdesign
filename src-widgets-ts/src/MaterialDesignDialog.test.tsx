import React from 'react';
import { describe, expect, it } from 'vitest';

import { MaterialDesignDialog } from './MaterialDesignDialog';

function fixture<T>(value: unknown): T { return value as T; }

function trigger(rxData: Record<string, unknown>): React.CSSProperties {
    const widget = new MaterialDesignDialog(fixture<ConstructorParameters<typeof MaterialDesignDialog>[0]>({ context: {} }), 'view');
    widget.state = fixture<typeof widget.state>({ rxData, values: {} });
    const tree = widget.renderWidgetBody(fixture<Parameters<MaterialDesignDialog['renderWidgetBody']>[0]>({})) as React.ReactElement<{ children: React.ReactNode }>;
    const button = (React.Children.toArray(tree.props.children) as Array<React.ReactElement<Record<string, unknown>>>)
        .find(child => React.isValidElement(child) && child.type === 'button');
    if (!button) throw new Error('the dialog rendered no opening button');
    return button.props.style as React.CSSProperties;
}

describe('dialog opening button', () => {
    it('fills for raised and unelevated, and only raised carries a shadow', () => {
        const raised = trigger({ buttonStyle: 'raised', mdwButtonPrimaryColor: '#123456' });
        expect(raised.background).toBe('#123456');
        expect(raised.color).toBe('#fff');
        expect(raised.boxShadow).toBeTruthy();

        const unelevated = trigger({ buttonStyle: 'unelevated', mdwButtonPrimaryColor: '#123456' });
        expect(unelevated.background).toBe('#123456');
        expect(unelevated.boxShadow).toBeUndefined();
    });

    // A shadow drawn on the edge of the widget box is clipped away by VIS2 and stays invisible.
    it('gives the raised style room for its shadow', () => {
        expect(trigger({ buttonStyle: 'raised' }).margin).toBe(4);
        expect(trigger({ buttonStyle: 'raised' }).height).toBe('calc(100% - 8px)');
        expect(trigger({ buttonStyle: 'unelevated' }).margin).toBeUndefined();
        expect(trigger({ buttonStyle: 'unelevated' }).height).toBe('100%');
    });

    it('drops the fill for text, outlined and icon and moves the primary color into the label', () => {
        for (const buttonStyle of ['text', 'outlined', 'icon']) {
            const style = trigger({ buttonStyle, mdwButtonPrimaryColor: '#123456' });
            expect(style.background, buttonStyle).toBe('transparent');
            expect(style.color, buttonStyle).toBe('#123456');
        }
        expect(trigger({ buttonStyle: 'outlined', mdwButtonPrimaryColor: '#123456' }).border).toBe('1px solid #123456');
        expect(trigger({ buttonStyle: 'text' }).border).toBe(0);
        expect(trigger({ buttonStyle: 'icon' }).borderRadius).toBe('50%');
    });
});
