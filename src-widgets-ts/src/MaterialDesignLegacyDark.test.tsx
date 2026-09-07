import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignCalendar from './MaterialDesignCalendar';
import MaterialDesignList from './MaterialDesignList';
import MaterialDesignProgress from './MaterialDesignProgress';
import MaterialDesignSelect from './MaterialDesignSelect';
import MaterialDesignTable from './MaterialDesignTable';
import MaterialDesignTopAppBar from './MaterialDesignTopAppBar';
import { legacyInk, legacyInkMuted } from './widgetUtils';

// The classic style was drawn for a light page. Measured on the live host with vis-2 in dark mode,
// 50 of its texts sat at or below 1.7:1 against the page — the input label at exactly 1:1. These
// tests pin the rule that fixed it: text on a surface the widget paints light keeps the dark ink,
// text on the page follows the theme, and a color the user configured wins over both.
function fixture<T>(value: unknown): T {
    return value as T;
}

function render(Widget: any, rxData: Record<string, unknown>, dark: boolean): string {
    const widget = new Widget(fixture({ context: { themeType: dark ? 'dark' : 'light' } }));
    widget.state = fixture({ rxData, values: {} });
    return renderToStaticMarkup(widget.renderWidgetBody(fixture({})));
}

const listRow = { countListItems: 1, label0: 'left', subLabel0: 'left second' };

describe('legacy ink defaults', () => {
    it('follows the page unless the widget paints a light surface', () => {
        expect(legacyInk(false)).toBe('#000');
        expect(legacyInk(true)).toBe('#fff');
        expect(legacyInkMuted(false)).toBe('rgba(0, 0, 0, 0.54)');
        expect(legacyInkMuted(true)).toBe('rgba(255, 255, 255, 0.7)');
    });
});

describe('classic widgets on a dark page', () => {
    it('lightens the list text and the card it sits on', () => {
        const page = render(MaterialDesignList, listRow, true);
        expect(page).toContain('color:#fff');
        expect(page).toContain('color:rgba(255, 255, 255, 0.7)');

        const card = render(MaterialDesignList, { ...listRow, listLayout: 'card' }, true);
        expect(card).toContain('--materialdesign-color-card-background:#1e1e1e');
        expect(card).toContain('color:#fff');
    });

    it('leaves the light page untouched', () => {
        const light = render(MaterialDesignList, { ...listRow, listLayout: 'card' }, false);
        expect(light).toContain('color:#000');
        expect(light).toContain('color:rgba(0, 0, 0, 0.54)');
        expect(light).toContain('--materialdesign-color-card-background:#fff');
    });

    it('keeps a configured color ahead of the theme', () => {
        const html = render(MaterialDesignList, { ...listRow, colorListItemText: '#ff00ff', colorListItemTextSecondary: '#00ff00', listBackground: '#123456' }, true);
        expect(html).toContain('color:#ff00ff');
        expect(html).toContain('color:#00ff00');
        expect(html).toContain('--materialdesign-color-card-background:#123456');
    });

    it('colors table cells and the table card against the theme', () => {
        expect(render(MaterialDesignTable, { dataJson: '[{"a":1}]' }, true)).toContain('color:#fff');
        expect(render(MaterialDesignTable, { dataJson: '[{"a":1}]', tableLayout: 'card' }, true)).toContain('background:#1e1e1e');
        expect(render(MaterialDesignTable, { dataJson: '[{"a":1}]', tableLayout: 'card' }, false)).toContain('background:#fff');
    });

    it('draws the outlined table edge against the page it sits on', () => {
        expect(render(MaterialDesignTable, { dataJson: '[{"a":1}]', tableLayout: 'cardOutlined' }, true)).toContain('1px solid rgba(255, 255, 255, 0.24)');
        expect(render(MaterialDesignTable, { dataJson: '[{"a":1}]', tableLayout: 'cardOutlined' }, false)).toContain('1px solid rgba(0, 0, 0, 0.12)');
    });

    it('darkens the select dropdown and lightens the field label', () => {
        // The menu is only rendered while the select is open.
        const widget: any = new (MaterialDesignSelect as any)(fixture({ context: { themeType: 'dark' } }));
        widget.state = fixture({ rxData: { inputLabelText: 'Raum', countSelectItems: 1, value0: '1', label0: 'Küche' }, values: {} });
        widget.open = true;
        const html = renderToStaticMarkup(widget.renderWidgetBody(fixture({})));
        expect(html).toContain('color:rgba(255, 255, 255, 0.7)');
        expect(html).toContain('#1e1e1e');
    });

    it('gives the outlined select a border the dark page shows', () => {
        expect(render(MaterialDesignSelect, { inputLabelText: 'Raum', inputLayout: 'outlined' }, true)).toContain('rgba(255, 255, 255, 0.5)');
        expect(render(MaterialDesignSelect, { inputLabelText: 'Raum', inputLayout: 'outlined' }, false)).toContain('rgba(0, 0, 0, 0.24)');
    });

    it('lightens the progress label, which used to keep the accent blue on a colored bar', () => {
        expect(render(MaterialDesignProgress, { oid: 'x', showValueLabel: true }, true)).toContain('color:#fff');
        expect(render(MaterialDesignProgress, { oid: 'x', showValueLabel: true }, false)).toContain('color:#000');
    });

    it('lightens the calendar control text', () => {
        expect(render(MaterialDesignCalendar, { showControls: true }, true)).toContain('#fff');
    });

    it('darkens the drawer surface so its entries stay readable', () => {
        const html = render(MaterialDesignTopAppBar, { navItemCount: 1, labels0: 'Wohnzimmer', drawerLayout: 'permanent' }, true);
        expect(html).toContain('background:#1e1e1e');
        expect(html).toContain('color:#fff');
    });

    // The entries used to inherit the page color, so a drawer painted against the page — which a theme
    // binding can do in either direction — put black text on a dark surface and white on a white one.
    it('takes the drawer ink from the surface, not from the page', () => {
        const onLight = render(MaterialDesignTopAppBar, { navItemCount: 1, labels0: 'Wohnzimmer', drawerLayout: 'permanent', colorDrawerBackground: '#ffffff' }, true);
        expect(onLight).toContain('color:#1d1b20');
        const onDark = render(MaterialDesignTopAppBar, { navItemCount: 1, labels0: 'Wohnzimmer', drawerLayout: 'permanent', colorDrawerBackground: '#202020' }, false);
        expect(onDark).toContain('color:#ffffff');
    });
});
