import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { MaterialDesignDialog } from './MaterialDesignDialog';

function fixture<T>(value: unknown): T { return value as T; }

// `buttonStyle` picked the icon shape and was otherwise ignored: text, raised, unelevated and
// outlined all rendered the same filled trigger, in both design styles.
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
