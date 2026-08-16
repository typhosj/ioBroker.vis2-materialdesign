import { describe, expect, it } from 'vitest';
import MaterialDesignCalendar, { calendarDayCount, calendarEventHasTime, calendarEventOccursOnDate, calendarEventSlot, calendarGridStart, eventMinutes, formatCalendarShortTime, formatCalendarTime, formatMoment, isoDate, weekNumber } from './MaterialDesignCalendar';

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

describe('isoDate (local date, not UTC)', () => {
    it('formats year-month-day with zero padding, using local getters', () => {
        expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(isoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
});

describe('eventMinutes', () => {
    it('parses HH:MM from a T-separated or space-separated timestamp', () => {
        expect(eventMinutes('2026-07-19T05:30:00')).toBe(330);
        expect(eventMinutes('2026-07-19 23:59:00')).toBe(1439);
    });
    it('falls back to the given fallback for an all-day (time-less) value', () => {
        expect(eventMinutes('2026-07-19', 120)).toBe(120);
    });
    it('clamps to 23:59 for an out-of-range time', () => {
        expect(eventMinutes('2026-07-19T25:30')).toBe(1439);
    });
});

describe('weekNumber (ISO 8601)', () => {
    it('returns week 1 for the first Monday-containing week of the year', () => {
        expect(weekNumber(new Date(2024, 0, 1))).toBe(1); // Mon 2024-01-01
    });
    it('rolls a late-December date into week 1 of the following year', () => {
        expect(weekNumber(new Date(2025, 11, 29))).toBe(1); // Mon 2025-12-29 -> ISO week 1 of 2026
    });
});

describe('calendarGridStart', () => {
    it('backs the month grid up to the configured first weekday on/before the 1st', () => {
        const start = calendarGridStart(new Date(2026, 6, 15), 'month', 1);
        expect(isoDate(start)).toBe('2026-06-29');
    });
    it('backs the week grid up to the configured first weekday on/before the reference day', () => {
        const start = calendarGridStart(new Date(2026, 6, 23), 'week', 1);
        expect(isoDate(start)).toBe('2026-07-20');
    });
    it('leaves the day grid on the reference date at midnight', () => {
        const start = calendarGridStart(new Date(2026, 6, 23, 14, 30), 'day', 1);
        expect(isoDate(start)).toBe('2026-07-23');
        expect(start.getHours()).toBe(0);
    });
});

describe('calendarDayCount', () => {
    it('always returns a multiple of 7 for month view (full leading+trailing weeks)', () => {
        expect(calendarDayCount(new Date(2026, 6, 15), 'month', 1)).toBe(35);
    });
    it('returns 7 for week view and 1 for day view regardless of the reference date', () => {
        expect(calendarDayCount(new Date(2026, 6, 15), 'week', 1)).toBe(7);
        expect(calendarDayCount(new Date(2026, 6, 15), 'day', 1)).toBe(1);
    });
});

describe('calendarEventSlot', () => {
    const window_ = { firstMinute: 8 * 60, endMinute: 18 * 60, intervalMinutes: 60 };

    it('returns null when the event ends before or starts after the visible window', () => {
        expect(calendarEventSlot({ start: '2026-07-23T05:00', end: '2026-07-23T06:00' }, window_.firstMinute, window_.endMinute, window_.intervalMinutes)).toBeNull();
        expect(calendarEventSlot({ start: '2026-07-23T19:00', end: '2026-07-23T20:00' }, window_.firstMinute, window_.endMinute, window_.intervalMinutes)).toBeNull();
    });

    it('computes row/span for an event fully inside the window', () => {
        const slot = calendarEventSlot({ start: '2026-07-23T09:00', end: '2026-07-23T11:00' }, window_.firstMinute, window_.endMinute, window_.intervalMinutes);
        expect(slot).toEqual({ row: 1, span: 2, startMinute: 9 * 60 });
    });

    it('clips row/span to the visible window for an event that starts before it', () => {
        const slot = calendarEventSlot({ start: '2026-07-23T06:00', end: '2026-07-23T09:00' }, window_.firstMinute, window_.endMinute, window_.intervalMinutes);
        expect(slot).toEqual({ row: 0, span: 1, startMinute: 6 * 60 });
    });

    it('gives a zero-length (all-day/missing-end) event at least a one-slot span', () => {
        const slot = calendarEventSlot({ start: '2026-07-23T09:00' }, window_.firstMinute, window_.endMinute, window_.intervalMinutes);
        expect(slot).toEqual({ row: 1, span: 1, startMinute: 9 * 60 });
    });
});
