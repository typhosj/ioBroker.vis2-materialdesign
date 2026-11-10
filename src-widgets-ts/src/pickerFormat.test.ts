import { describe, expect, it, vi } from 'vitest';

import {
    dateMask,
    datePattern,
    daysInMonth,
    formatDate,
    formatTime,
    parseDate,
    parseIsoDate,
    parseIsoTime,
    parseTime,
    pickerCommitValue,
    pickerDisplay,
    pickerInitialValue,
    pickerMask,
    resolveHour12,
    timeMask,
    toIsoDate,
    toIsoTime,
    todayParts,
    weekStart,
} from './pickerFormat';

const hasWeekInfo = (() => {
    const locale = new Intl.Locale('en-US') as Intl.Locale & { weekInfo?: unknown; getWeekInfo?: unknown };
    return typeof locale.getWeekInfo === 'function' || locale.weekInfo !== undefined;
})();

describe('date pattern from the locale', () => {
    it('reads order and separator', () => {
        expect(datePattern('de-DE')).toEqual({ order: ['day', 'month', 'year'], separator: '.' });
        expect(datePattern('en-US')).toEqual({ order: ['month', 'day', 'year'], separator: '/' });
        expect(datePattern('en-GB')).toEqual({ order: ['day', 'month', 'year'], separator: '/' });
    });

    it('builds the typing mask', () => {
        expect(dateMask(datePattern('de-DE'))).toBe('##.##.####');
        expect(dateMask(datePattern('en-US'))).toBe('##/##/####');
    });
});

describe('ISO dates', () => {
    it('accepts real dates only', () => {
        expect(parseIsoDate('2026-11-10')).toEqual({ year: 2026, month: 11, day: 10 });
        expect(parseIsoDate(' 2024-02-29 ')).toEqual({ year: 2024, month: 2, day: 29 });
        expect(parseIsoDate('2026-02-29')).toBeNull(); // common year
        expect(parseIsoDate('2026-04-31')).toBeNull();
        expect(parseIsoDate('2026-13-01')).toBeNull();
        expect(parseIsoDate('2026-00-10')).toBeNull();
        expect(parseIsoDate('2026-1-10')).toBeNull();
        expect(parseIsoDate('foo')).toBeNull();
        expect(parseIsoDate(20261110)).toBeNull();
        expect(parseIsoDate(undefined)).toBeNull();
    });

    it('knows the month lengths', () => {
        expect(daysInMonth(2024, 2)).toBe(29);
        expect(daysInMonth(2026, 2)).toBe(28);
        expect(daysInMonth(1900, 2)).toBe(28); // divisible by 100, not by 400
        expect(daysInMonth(2000, 2)).toBe(29); // divisible by 400
        expect(daysInMonth(2026, 4)).toBe(30);
        expect(daysInMonth(2026, 12)).toBe(31);
    });

    it('writes zero-padded ISO', () => {
        expect(toIsoDate({ year: 2026, month: 3, day: 7 })).toBe('2026-03-07');
    });
});

describe('formatDate / parseDate', () => {
    it('formats valid state values for the locale', () => {
        expect(formatDate('2026-11-10', 'de-DE')).toBe('10.11.2026');
        expect(formatDate('2026-11-10', 'en-US')).toBe('11/10/2026');
        expect(formatDate('2026-11-10', 'en-GB')).toBe('10/11/2026');
    });

    it('returns null for values it cannot format', () => {
        expect(formatDate('', 'de-DE')).toBeNull();
        expect(formatDate('foo', 'de-DE')).toBeNull();
        expect(formatDate('2026-02-30', 'de-DE')).toBeNull();
    });

    it('parses typed text in the locale order', () => {
        expect(parseDate('24.12.2026', 'de-DE')).toBe('2026-12-24');
        expect(parseDate('12/24/2026', 'en-US')).toBe('2026-12-24');
        expect(parseDate('29.02.2024', 'de-DE')).toBe('2024-02-29');
    });

    it('rejects impossible and incomplete dates', () => {
        expect(parseDate('29.02.2026', 'de-DE')).toBeNull();
        expect(parseDate('31.04.2026', 'de-DE')).toBeNull();
        expect(parseDate('24.12.20', 'de-DE')).toBeNull();
        expect(parseDate('24.12', 'de-DE')).toBeNull();
        expect(parseDate('', 'de-DE')).toBeNull();
        expect(parseDate('24/12/2026', 'en-US')).toBeNull(); // month 24
    });
});

describe('hour cycle', () => {
    it('follows an explicit format', () => {
        expect(resolveHour12('24h', 'en-US')).toBe(false);
        expect(resolveHour12('12h', 'de-DE')).toBe(true);
    });

    it('follows the locale on locale or unset', () => {
        expect(resolveHour12('locale', 'de-DE')).toBe(false);
        expect(resolveHour12('locale', 'en-US')).toBe(true);
        expect(resolveHour12(undefined, 'de-DE')).toBe(false);
    });

    it('builds the time mask', () => {
        expect(timeMask(false)).toBe('##:##');
        expect(timeMask(true)).toBe('##:## AA');
    });
});

describe('ISO times', () => {
    it('accepts 00:00 to 23:59 only', () => {
        expect(parseIsoTime('00:00')).toEqual({ hour: 0, minute: 0 });
        expect(parseIsoTime('23:59')).toEqual({ hour: 23, minute: 59 });
        expect(parseIsoTime('24:00')).toBeNull();
        expect(parseIsoTime('12:60')).toBeNull();
        expect(parseIsoTime('7:45')).toBeNull();
        expect(parseIsoTime('')).toBeNull();
        expect(parseIsoTime(745)).toBeNull();
    });

    it('writes zero-padded ISO', () => {
        expect(toIsoTime(7, 5)).toBe('07:05');
    });
});

describe('formatTime / parseTime', () => {
    it('formats 24 h and 12 h', () => {
        expect(formatTime('19:45', false)).toBe('19:45');
        expect(formatTime('19:45', true)).toBe('07:45 PM');
        expect(formatTime('00:05', true)).toBe('12:05 AM');
        expect(formatTime('12:00', true)).toBe('12:00 PM');
        expect(formatTime('24:00', false)).toBeNull();
        expect(formatTime('', true)).toBeNull();
    });

    it('parses 24 h text', () => {
        expect(parseTime('19:45', false)).toBe('19:45');
        expect(parseTime('00:00', false)).toBe('00:00');
        expect(parseTime('23:59', false)).toBe('23:59');
        expect(parseTime('7:05', false)).toBe('07:05');
    });

    it('rejects invalid 24 h text', () => {
        expect(parseTime('24:00', false)).toBeNull();
        expect(parseTime('12:60', false)).toBeNull();
        expect(parseTime('19:4', false)).toBeNull();
        expect(parseTime('07:45 PM', false)).toBeNull();
        expect(parseTime('', false)).toBeNull();
    });

    it('parses 12 h text including a single A/P', () => {
        expect(parseTime('07:45 PM', true)).toBe('19:45');
        expect(parseTime('07:45 p', true)).toBe('19:45');
        expect(parseTime('12:00 AM', true)).toBe('00:00');
        expect(parseTime('12:00 PM', true)).toBe('12:00');
        expect(parseTime('12:30 a', true)).toBe('00:30');
    });

    it('rejects invalid 12 h text', () => {
        expect(parseTime('13:00 PM', true)).toBeNull();
        expect(parseTime('00:30 AM', true)).toBeNull();
        expect(parseTime('07:45', true)).toBeNull(); // no period
    });
});

describe('week start', () => {
    it('starts on Monday in Germany and for unknown locales', () => {
        expect(weekStart('de-DE')).toBe(1);
        expect(weekStart('not a locale')).toBe(1);
    });

    it.runIf(hasWeekInfo)('starts on Sunday in the US where the runtime knows week data', () => {
        expect(weekStart('en-US')).toBe(0);
    });

    it('falls back to Monday for a valid locale when the runtime has no week data', () => {
        const spy = vi.spyOn(Intl, 'Locale').mockImplementation(function FakeLocale() {
            return {} as Intl.Locale;
        });
        try {
            expect(weekStart('en-US')).toBe(1);
        } finally {
            spy.mockRestore();
        }
    });

    it('ignores week data outside 1-7', () => {
        const spy = vi.spyOn(Intl, 'Locale').mockImplementation(function FakeLocale() {
            return { weekInfo: { firstDay: 0 } } as unknown as Intl.Locale;
        });
        try {
            expect(weekStart('en-US')).toBe(1);
        } finally {
            spy.mockRestore();
        }
    });
});

describe('picker field helpers', () => {
    const date = { kind: 'date', locale: 'de-DE', hour12: false } as const;
    const time12 = { kind: 'time', locale: 'en-US', hour12: true } as const;
    const time24 = { kind: 'time', locale: 'de-DE', hour12: false } as const;

    it('builds the mask for the picker kind', () => {
        expect(pickerMask(date)).toBe('##.##.####');
        expect(pickerMask(time12)).toBe('##:## AA');
        expect(pickerMask(time24)).toBe('##:##');
    });

    it('formats valid values and keeps raw ones', () => {
        expect(pickerDisplay(date, '2026-11-10')).toBe('10.11.2026');
        expect(pickerDisplay(date, 'foo')).toBe('foo');
        expect(pickerDisplay(date, '')).toBe('');
        expect(pickerDisplay(time12, '19:45')).toBe('07:45 PM');
        expect(pickerDisplay(time24, '24:00')).toBe('24:00');
    });

    it('turns typed text into the state value', () => {
        expect(pickerCommitValue(date, '24.12.2026')).toBe('2026-12-24');
        expect(pickerCommitValue(date, '31.02.2026')).toBeNull();
        expect(pickerCommitValue(date, '  ')).toBe('');
        expect(pickerCommitValue(time12, '07:45 p')).toBe('19:45');
        expect(pickerCommitValue(time24, '24:00')).toBeNull();
        expect(pickerCommitValue(time24, '23:59')).toBe('23:59');
    });
});

describe('initial picker value', () => {
    const now = new Date(2026, 10, 10, 19, 45, 30);

    it('takes a valid state value', () => {
        expect(pickerInitialValue('date', '2026-12-24', now)).toBe('2026-12-24');
        expect(pickerInitialValue('time', '07:05', now)).toBe('07:05');
    });

    it('falls back to today and the current minute', () => {
        expect(pickerInitialValue('date', 'foo', now)).toBe('2026-11-10');
        expect(pickerInitialValue('date', undefined, now)).toBe('2026-11-10');
        expect(pickerInitialValue('time', '25:00', now)).toBe('19:45');
        expect(todayParts(now)).toEqual({ year: 2026, month: 11, day: 10 });
    });
});
