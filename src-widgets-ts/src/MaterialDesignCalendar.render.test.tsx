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
        // The grid hairline follows the theme too, so each theme names its own.
        const cell = (background: string, border = '#e0e0e0'): string => `background:${background};border:1px solid ${border};min-width:0`;
        expect(render({}, {})).not.toContain(cell('transparent'));
        expect(render({}, {})).toContain(cell('#fff'));
        expect(render({}, {}, 'dark')).toContain(cell('#303030', 'rgba(255, 255, 255, 0.24)'));
    });

    it('still honours an explicit day background', () => {
        expect(render({ calendarDayBackgroundColor: '#123456' }, {})).toContain('#123456');
    });
});

// A 15-minute event is as tall as its duration — about 14px — while the stacked time and name
// lines needed 44px, so the name was cut off entirely. Time and name now share one line, and the
// pieces the `:hover` rule has to override live in the stylesheet, not in the inline style.
describe('calendar events in the week time grid', () => {
    const week = { calendarView: 'week', oid: 'ical.0.data.table' };

    it('puts time and name on one line through classes the stylesheet can reach', () => {
        const html = render(week, { 'ical.0.data.table.val': icalTable });
        expect(html).toContain('class="mdw-event-time"');
        expect(html).toContain('class="mdw-event-name"');
    });

    it('keeps overflow, padding and the minimum height out of the inline style', () => {
        const html = render(week, { 'ical.0.data.table.val': icalTable });
        const event = html.slice(html.indexOf('class="v-event"'), html.indexOf('class="mdw-event-time"'));
        expect(event).not.toContain('overflow:hidden');
        expect(event).not.toContain('min-height:14px');
        expect(event).not.toContain('white-space:nowrap');
    });

    // Hovering widens the box to the whole day column, which a `:hover` rule can only do while
    // left and width are not inline styles.
    it('hands the lane geometry to the stylesheet so hovering can widen the box', () => {
        const html = render(week, { 'ical.0.data.table.val': icalTable });
        expect(html).toContain('--mdw-event-left:');
        expect(html).toContain('--mdw-event-width:');
        const event = html.slice(html.indexOf('class="v-event"'), html.indexOf('class="mdw-event-time"'));
        expect(event).not.toMatch(/[;"]left:/);
        expect(event).not.toMatch(/[;"]width:/);
    });

    it('carries the full text as a title for the tooltip and for screen readers', () => {
        expect(render({ ...week, calendarTimeFormat: '24h' }, { 'ical.0.data.table.val': icalTable })).toContain('title="10:00 Zahnarzt"');
    });

    it('hands the lane order to the stylesheet instead of an inline z-index', () => {
        const html = render(week, { 'ical.0.data.table.val': icalTable });
        expect(html).toContain('--mdw-event-lane:1');
        expect(html.slice(html.indexOf('class="v-event-column"'), html.indexOf('class="v-event"'))).not.toContain('z-index');
    });

    // calendarEventHeight is an editor option that only the month view ever applied.
    it('applies calendarEventHeight as the minimum box height', () => {
        expect(render({ ...week, calendarEventHeight: 30 }, { 'ical.0.data.table.val': icalTable })).toContain('--mdw-event-min-height:30px');
        expect(render(week, { 'ical.0.data.table.val': icalTable })).not.toContain('--mdw-event-min-height');
    });
});

describe('calendar events in the month grid', () => {
    it('carries the full text as a title as well', () => {
        expect(render({ calendarTimeFormat: '24h', oid: 'ical.0.data.table' }, { 'ical.0.data.table.val': icalTable })).toContain('title="10:00 Zahnarzt"');
    });

    it('leaves clipping to the stylesheet so hovering can lift it', () => {
        const html = render({ oid: 'ical.0.data.table' }, { 'ical.0.data.table.val': icalTable });
        expect(html).toContain('class="materialdesign-calendar-day"');
        expect(html.slice(html.indexOf('class="v-event"'))).not.toContain('text-overflow:ellipsis');
    });
});
