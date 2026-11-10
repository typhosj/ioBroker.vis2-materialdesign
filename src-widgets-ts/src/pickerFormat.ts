export type TimeFormat = 'locale' | '24h' | '12h';
export type PickerKind = 'date' | 'time';
type DatePart = 'day' | 'month' | 'year';

interface DatePattern {
    order: DatePart[];
    separator: string;
}

/** A calendar date; `month` is 1-12. */
export interface DateParts {
    year: number;
    month: number;
    day: number;
}

/** A time of day; `hour` is 0-23. */
interface TimeParts {
    hour: number;
    minute: number;
}

/** What the field of one picker formats with; `hour12` only matters for a time. */
export interface PickerSpec {
    kind: PickerKind;
    locale: string;
    hour12: boolean;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIME = /^(\d{2}):(\d{2})$/;
// Characters applyMask() treats as placeholders; a separator must not contain them.
const MASK_TOKEN = /[#SAaNX]/;
// Day (23) and month (11) differ and cannot be mistaken for the year, so the field order is unambiguous.
const PATTERN_SAMPLE = new Date(2026, 10, 23);

export function pad(value: number, width = 2): string {
    return String(value).padStart(width, '0');
}

export function deviceLocale(): string {
    return Intl.DateTimeFormat().resolvedOptions().locale;
}

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
    if (month === 2) {
        return isLeapYear(year) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function validDate(p: DateParts): boolean {
    return p.year >= 1 && p.year <= 9999 && p.month >= 1 && p.month <= 12 && p.day >= 1 && p.day <= daysInMonth(p.year, p.month);
}

export function parseIsoDate(value: unknown): DateParts | null {
    const match = typeof value === 'string' ? ISO_DATE.exec(value.trim()) : null;
    if (!match) {
        return null;
    }
    const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    return validDate(parts) ? parts : null;
}

export function toIsoDate(p: DateParts): string {
    return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

export function datePattern(locale: string): DatePattern {
    const parts = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(PATTERN_SAMPLE);
    const order = parts
        .filter(part => part.type === 'day' || part.type === 'month' || part.type === 'year')
        .map(part => part.type as DatePart);
    // The first literal between two fields; a trailing literal (Hungarian "2026. 11. 23.") is ignored.
    const separator = parts.find((part, index) => part.type === 'literal' && index > 0 && index < parts.length - 1)?.value || '.';
    return {
        order: order.length === 3 ? order : ['day', 'month', 'year'],
        separator: MASK_TOKEN.test(separator) ? '.' : separator,
    };
}

export function dateMask(pattern: DatePattern): string {
    return pattern.order.map(part => (part === 'year' ? '####' : '##')).join(pattern.separator);
}

export function formatDate(value: unknown, locale: string): string | null {
    const date = parseIsoDate(value);
    if (!date) {
        return null;
    }
    const pattern = datePattern(locale);
    return pattern.order.map(part => (part === 'year' ? pad(date.year, 4) : pad(part === 'day' ? date.day : date.month))).join(pattern.separator);
}

export function parseDate(text: string, locale: string): string | null {
    const digits = text.replace(/\D/g, '');
    if (digits.length !== 8) {
        return null;
    }
    const values: Record<DatePart, number> = { day: 0, month: 0, year: 0 };
    let at = 0;
    for (const part of datePattern(locale).order) {
        const width = part === 'year' ? 4 : 2;
        values[part] = Number(digits.slice(at, at + width));
        at += width;
    }
    return validDate(values) ? toIsoDate(values) : null;
}

export function parseIsoTime(value: unknown): TimeParts | null {
    const match = typeof value === 'string' ? ISO_TIME.exec(value.trim()) : null;
    if (!match) {
        return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

export function toIsoTime(hour: number, minute: number): string {
    return `${pad(hour)}:${pad(minute)}`;
}

export function resolveHour12(format: TimeFormat | undefined, locale: string): boolean {
    if (format === '24h') {
        return false;
    }
    if (format === '12h') {
        return true;
    }
    const options = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    return options.hourCycle ? options.hourCycle === 'h11' || options.hourCycle === 'h12' : !!options.hour12;
}

export function timeMask(hour12: boolean): string {
    return hour12 ? '##:## AA' : '##:##';
}

export function formatTime(value: unknown, hour12: boolean): string | null {
    const time = parseIsoTime(value);
    if (!time) {
        return null;
    }
    if (!hour12) {
        return toIsoTime(time.hour, time.minute);
    }
    return `${pad(time.hour % 12 || 12)}:${pad(time.minute)} ${time.hour < 12 ? 'AM' : 'PM'}`;
}

export function parseTime(text: string, hour12: boolean): string | null {
    const match = /^\s*(\d{1,2}):(\d{2})\s*(?:([AaPp])[Mm]?)?\s*$/.exec(text);
    if (!match) {
        return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3];
    if (minute > 59) {
        return null;
    }
    if (!hour12) {
        return period || hour > 23 ? null : toIsoTime(hour, minute);
    }
    if (!period || hour < 1 || hour > 12) {
        return null;
    }
    return toIsoTime((hour % 12) + (period.toUpperCase() === 'P' ? 12 : 0), minute);
}

export function pickerMask(spec: PickerSpec): string {
    return spec.kind === 'date' ? dateMask(datePattern(spec.locale)) : timeMask(spec.hour12);
}

/** The field text for a state value; a value that is no valid date/time is shown raw. */
export function pickerDisplay(spec: PickerSpec, raw: string): string {
    return (spec.kind === 'date' ? formatDate(raw, spec.locale) : formatTime(raw, spec.hour12)) ?? raw;
}

/** The state value for typed text: '' for an empty field, null when the text is no valid date/time. */
export function pickerCommitValue(spec: PickerSpec, text: string): string | null {
    if (text.trim() === '') {
        return '';
    }
    return spec.kind === 'date' ? parseDate(text, spec.locale) : parseTime(text, spec.hour12);
}

/** First day of the week for the locale, 0 = Sunday … 6 = Saturday; Monday when the runtime has no week data. */
export function weekStart(locale: string): number {
    try {
        const info = new Intl.Locale(locale) as Intl.Locale & {
            weekInfo?: { firstDay: number };
            getWeekInfo?: () => { firstDay: number };
        };
        const week = typeof info.getWeekInfo === 'function' ? info.getWeekInfo() : info.weekInfo;
        if (week && week.firstDay >= 1 && week.firstDay <= 7) {
            return week.firstDay % 7;
        }
    } catch {
        // Not a valid language tag: fall through to Monday.
    }
    return 1;
}

export function todayParts(now: Date): DateParts {
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function pickerInitialValue(kind: PickerKind, state: unknown, now: Date): string {
    if (kind === 'date') {
        const date = parseIsoDate(state);
        return toIsoDate(date ?? todayParts(now));
    }
    const time = parseIsoTime(state);
    return time ? toIsoTime(time.hour, time.minute) : toIsoTime(now.getHours(), now.getMinutes());
}
