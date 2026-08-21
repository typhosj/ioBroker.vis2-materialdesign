import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignCalendar from './MaterialDesignCalendar';

function fixture<T>(value: unknown): T { return value as T; }

function render(rxData: Record<string, unknown>, values: Record<string, unknown> = {}, themeType?: string): string {
    const setValue = vi.fn();
    const calendar = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>({ id: 'w00001', context: { setValue, themeType } }));
    calendar.state = fixture<typeof calendar.state>({ rxData, values });
    return renderToStaticMarkup(calendar.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>({})));
}

const stamp = (hour: number): string => { const date = new Date(); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
// One row exactly as the ical adapter writes it into `<instance>.data.table`.
const icalTable = JSON.stringify([{ date: 'heute 10:00', event: 'Zahnarzt', _class: 'ical_privat', _date: stamp(10), _end: stamp(11), _section: '', _IDID: 'uid-1', _allDay: false, _private: false, location: '', _calName: 'privat', _calColor: '#ff0000' }]);

describe('calendar month grid', () => {
    it('shows an ical row of the current day', () => {
        expect(render({ oid: 'ical.0.data.table' }, { 'ical.0.data.table.val': icalTable })).toContain('Zahnarzt');
    });

    // A transparent day cell lets the view background through while the day numbers stay on the
    // widget's own theme colour, which is what made the grid unreadable on a dark view.
    it('paints its own surface behind the days instead of leaving them transparent', () => {
        const cell = (background: string): string => `background:${background};border:1px solid #e0e0e0;min-width:0`;
        expect(render({}, {})).not.toContain(cell('transparent'));
        expect(render({}, {})).toContain(cell('#fff'));
        expect(render({}, {}, 'dark')).toContain(cell('#303030'));
    });

    it('still honours an explicit day background', () => {
        expect(render({ calendarDayBackgroundColor: '#123456' }, {})).toContain('#123456');
    });
});
