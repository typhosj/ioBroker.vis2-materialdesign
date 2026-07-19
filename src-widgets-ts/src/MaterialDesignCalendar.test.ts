import { describe, expect, it } from 'vitest';
import MaterialDesignCalendar, { calendarEventHasTime, calendarEventOccursOnDate, formatCalendarTime, formatMoment } from './MaterialDesignCalendar';

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
