import { describe, expect, it } from 'vitest';
import MaterialDesignCalendar, { calendarEvent, calendarEventHasTime, calendarEventLanes, calendarEventOccursOnDate, calendarEventSlot, eventMinutes, formatCalendarShortTime, formatCalendarTime, formatMoment, localTimestamp } from './MaterialDesignCalendar';

describe('MaterialDesignCalendar overlapping events', () => {
    it('gives overlapping events their own lane and leaves separate events full width', () => {
        expect(calendarEventLanes([{ start: 0, finish: 120 }, { start: 60, finish: 180 }, { start: 360, finish: 420 }])).toEqual([{ index: 0, total: 2 }, { index: 1, total: 2 }, { index: 0, total: 1 }]);
    });

    it('reuses a lane that ended and counts the widest point of a cluster', () => {
        // The short event frees lane 0 after an hour, so the event starting two hours in takes it back.
        expect(calendarEventLanes([{ start: 0, finish: 240 }, { start: 0, finish: 60 }, { start: 120, finish: 240 }])).toEqual([{ index: 1, total: 2 }, { index: 0, total: 2 }, { index: 0, total: 2 }]);
    });
});

describe('MaterialDesignCalendar event placement', () => {
    // 08:00 to 24:00 in one-hour rows.
    const slot = (event: { start?: string; end?: string }, iso: string): unknown => calendarEventSlot(event, iso, 480, 1440, 60);

    it('places a timed event by its minutes', () => {
        expect(slot({ start: '2026-08-17T08:30', end: '2026-08-17T08:45' }, '2026-08-17')).toEqual({ start: 510, finish: 525, startMinute: 510 });
    });

    it('gives each day of an event over midnight its own part', () => {
        const night = { start: '2026-08-17T23:00', end: '2026-08-18T01:00' };
        const fullDay = (event: { start?: string; end?: string }, iso: string): unknown => calendarEventSlot(event, iso, 0, 1440, 60);
        // First day runs to midnight, the second one from midnight instead of at 23:00 again.
        expect(fullDay(night, '2026-08-17')).toEqual({ start: 1380, finish: 1440, startMinute: 1380 });
        expect(fullDay(night, '2026-08-18')).toEqual({ start: 0, finish: 60, startMinute: 1380 });
        // ... and the second day's part is gone when the axis starts after it.
        expect(slot(night, '2026-08-18')).toBeNull();
    });

    it('keeps the one-interval fallback for rows without a time', () => {
        expect(slot({ start: '2026-08-17', end: '2026-08-19' }, '2026-08-18')).toEqual({ start: 480, finish: 540, startMinute: 480 });
    });

    it('drops an event outside the visible time range', () => {
        expect(slot({ start: '2026-08-17T05:00', end: '2026-08-17T06:00' }, '2026-08-17')).toBeNull();
    });
});

describe('MaterialDesignCalendar time format', () => {
    it('formats explicit 24-hour and 12-hour times independently from locale', () => {
        expect(formatCalendarTime(65, '24h', 'en-US')).toBe('01:05');
        expect(formatCalendarTime(810, '24h', 'en-US')).toBe('13:30');
        expect(formatCalendarTime(65, '12h', 'de-DE')).toBe('1:05 AM');
        expect(formatCalendarTime(810, '12h', 'de-DE')).toBe('1:30 PM');
    });

    it('distinguishes timed events from all-day dates', () => {
        expect(calendarEventHasTime('2026-07-19')).toBe(false);
        expect(calendarEventHasTime('2026-07-19T05:00:00')).toBe(true);
        expect(calendarEventHasTime('2026-07-19 05:00')).toBe(true);
    });

    it('treats all-day end dates as exclusive', () => {
        const holiday = { start: '2026-07-25', end: '2026-08-09', name: 'Holiday' };
        expect(calendarEventOccursOnDate(holiday, '2026-07-25')).toBe(true);
        expect(calendarEventOccursOnDate(holiday, '2026-08-08')).toBe(true);
        expect(calendarEventOccursOnDate(holiday, '2026-08-09')).toBe(false);
        expect(calendarEventOccursOnDate({ start: '2026-07-25' }, '2026-07-25')).toBe(true);
    });

    it('treats a midnight end timestamp (ical adapter all-day) as exclusive too', () => {
        const holiday = { start: '2026-08-10T00:00:00', end: '2026-08-13T00:00:00', name: 'Holiday' };
        expect(calendarEventOccursOnDate(holiday, '2026-08-10')).toBe(true);
        expect(calendarEventOccursOnDate(holiday, '2026-08-12')).toBe(true);
        expect(calendarEventOccursOnDate(holiday, '2026-08-13')).toBe(false);
        const timed = { start: '2026-08-10T09:00:00', end: '2026-08-11T17:00:00', name: 'Trip' };
        expect(calendarEventOccursOnDate(timed, '2026-08-11')).toBe(true);
    });

    it('formats a month-view event start like the legacy summary (minutes only when set)', () => {
        expect(formatCalendarShortTime(12 * 60, '24h')).toBe('12');
        expect(formatCalendarShortTime(9 * 60 + 30, '24h')).toBe('09:30');
        expect(formatCalendarShortTime(12 * 60, '12h')).toBe('12 PM');
        expect(formatCalendarShortTime(9 * 60 + 30, '12h')).toBe('9:30 AM');
        expect(formatCalendarShortTime(12 * 60, 'locale', 'de-DE')).toBe('12 Uhr');
    });

    it('exposes the current-time indicator fields in the time-axis group', () => {
        const group = MaterialDesignCalendar.getWidgetInfo().visAttrs?.find(attr => attr.name === 'calendarTimeAxisLayout');
        const names = (group?.fields || []).map(field => field.name);
        expect(names).toEqual(expect.arrayContaining(['calendarNowIndicatorShow', 'calendarNowIndicatorColor']));
        expect(group?.fields?.find(field => field.name === 'calendarNowIndicatorShow')).toMatchObject({ type: 'checkbox', default: true });
    });

    it('exposes an explicit time-format selector in the time-axis group', () => {
        const group = MaterialDesignCalendar.getWidgetInfo().visAttrs?.find(attr => attr.name === 'calendarTimeAxisLayout');
        const field = group?.fields?.find(item => item.name === 'calendarTimeFormat');
        expect(field).toMatchObject({ type: 'select', options: ['locale', '24h', '12h'], default: 'locale' });
    });
});

describe('formatMoment (calendar custom date-format tokens)', () => {
    const date = new Date(2024, 0, 5); // Fri 2024-01-05, local

    it('resolves numeric tokens, longest-first (no partial YYYY/DD clobber)', () => {
        expect(formatMoment(date, 'YYYY-MM-DD')).toBe('2024-01-05');
        expect(formatMoment(date, 'DD.MM.YY')).toBe('05.01.24');
        expect(formatMoment(date, 'D/M/YYYY')).toBe('5/1/2024');
    });

    it('keeps literal characters and returns empty for an empty token', () => {
        expect(formatMoment(date, 'YYYY')).toBe('2024');
        expect(formatMoment(date, '')).toBe('');
        expect(formatMoment(date, '[wk] YYYY').includes('2024')).toBe(true);
    });

    it('formats month and weekday names via the given locale', () => {
        expect(formatMoment(date, 'MMMM YYYY', 'en-US')).toBe('January 2024');
        expect(formatMoment(date, 'dddd', 'en-US')).toBe('Friday');
        expect(formatMoment(date, 'ddd', 'en-US')).toBe('Fri');
    });

    it('exposes the six custom-format fields in the widget info', () => {
        const group = MaterialDesignCalendar.getWidgetInfo().visAttrs?.find(attr => attr.name === 'calendarCustomFormats');
        const names = (group?.fields || []).map(f => f.name);
        expect(names).toEqual(expect.arrayContaining([
            'calendarMonthViewHeaderFormat', 'calendarMonthViewDayFormat',
            'calendarWeekViewHeaderFormat', 'calendarWeekViewDayFormat',
            'calendarDayViewHeaderFormat', 'calendarDayViewDayFormat',
        ]));
    });
});

describe('ical adapter rows', () => {
    it('keeps a documented start/end/name row untouched', () => {
        expect(calendarEvent({ start: '2026-08-16T09:00', end: '2026-08-16T10:00', name: 'Meeting', color: '#123456' }))
            .toMatchObject({ start: '2026-08-16T09:00', end: '2026-08-16T10:00', name: 'Meeting', color: '#123456' });
    });

    it('reads the ical field names and converts its UTC stamps to local wall-clock time', () => {
        const row = { event: 'Zahnarzt', _date: '2026-08-16T06:30:00.000Z', _end: '2026-08-16T07:15:00.000Z', _allDay: false, _calColor: '#ff0000' };
        const local = new Date('2026-08-16T06:30:00.000Z');
        const event = calendarEvent(row);
        expect(event.name).toBe('Zahnarzt');
        expect(event.color).toBe('#ff0000');
        expect(eventMinutes(event.start)).toBe(local.getHours() * 60 + local.getMinutes());
        expect(calendarEventHasTime(event.start)).toBe(true);
    });

    it('strips the time of an all-day ical row, so its exclusive end still drops the last day', () => {
        const row = { event: 'Urlaub', _date: '2026-08-14T22:00:00.000Z', _end: '2026-08-19T22:00:00.000Z', _allDay: true };
        const event = calendarEvent(row);
        const first = `${new Date('2026-08-14T22:00:00.000Z').getFullYear()}`;
        expect(calendarEventHasTime(event.start)).toBe(false);
        expect(event.start).toHaveLength(10);
        expect(event.start?.startsWith(first)).toBe(true);
        expect(calendarEventOccursOnDate(event, event.start as string)).toBe(true);
        expect(calendarEventOccursOnDate(event, event.end as string)).toBe(false);
    });

    it('leaves a zone-less timestamp alone', () => {
        expect(localTimestamp('2026-08-16T09:00:00')).toBe('2026-08-16T09:00:00');
        expect(localTimestamp('2026-08-16')).toBe('2026-08-16');
    });
});
