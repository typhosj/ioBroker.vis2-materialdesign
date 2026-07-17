import { describe, expect, it } from 'vitest';
import MaterialDesignCalendar, { formatCalendarTime } from './MaterialDesignCalendar';

describe('MaterialDesignCalendar time format', () => {
    it('formats explicit 24-hour and 12-hour times independently from locale', () => {
        expect(formatCalendarTime(65, '24h', 'en-US')).toBe('01:05');
        expect(formatCalendarTime(810, '24h', 'en-US')).toBe('13:30');
        expect(formatCalendarTime(65, '12h', 'de-DE')).toBe('1:05 AM');
        expect(formatCalendarTime(810, '12h', 'de-DE')).toBe('1:30 PM');
    });

    it('exposes an explicit time-format selector in the time-axis group', () => {
        const group = MaterialDesignCalendar.getWidgetInfo().visAttrs?.find(attr => attr.name === 'calendarTimeAxisLayout');
        const field = group?.fields?.find(item => item.name === 'calendarTimeFormat');
        expect(field).toMatchObject({ type: 'select', options: ['locale', '24h', '12h'], default: 'locale' });
    });
});
