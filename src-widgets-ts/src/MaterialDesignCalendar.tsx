import React from 'react';
import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { squarePreview, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, m3OnColor, sizeCss, stateValue, formatMoment } from './widgetUtils';

export { formatMoment };

type Data = Record<string, unknown> & { oid?: string };
type Event = { start?: string; end?: string; name?: string; color?: string; colorText?: string };
const s = (v: unknown, d = ''): string => {
    const value = v === undefined || v === null || v === '' || v === 'null' ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
    return value.startsWith('var(') && value.endsWith(')') ? `${value.slice(0, -1)}, ${d})` : value;
};
const b = (v: unknown, d = false): boolean => v === undefined || v === null || v === '' ? d : v === true || v === 'true' || v === 1 || v === '1';
const n = (v: unknown, d = 0): number => Number.isFinite(Number(v)) ? Number(v) : d;
const px = (v: unknown, d: number): string => sizeCss(v, d);
// toISOString() shifts to UTC and misplaces events by a day in +offset zones.
export const isoDate = (day: Date): string => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
// Day and time of an event are read off its string, so a timestamp carrying a zone (the ical adapter
// writes UTC) has to become local wall-clock time first.
export const localTimestamp = (value: unknown): string => {
    const text = s(value);
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/.test(text)) return text;
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? text : `${isoDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
// Rows of the ical adapter carry their own field names; they are accepted next to start/end/name.
export function calendarEvent(row: Record<string, unknown>): Event {
    const allDay = row._allDay === true;
    const stamp = (value: unknown): string => allDay ? localTimestamp(value).slice(0, 10) : localTimestamp(value);
    return { start: stamp(row.start ?? row._date), end: stamp(row.end ?? row._end), name: s(row.name ?? row.event), color: s(row.color ?? row._calColor), colorText: s(row.colorText) };
}
const events = (v: unknown): Event[] => { try { const value: unknown = JSON.parse(s(v)); return Array.isArray(value) ? value.filter(row => row && typeof row === 'object').map(row => calendarEvent(row as Record<string, unknown>)) : []; } catch { return []; } };
export const eventMinutes = (value: unknown, fallback = 0): number => {
    const match = s(value).match(/(?:T|\s)(\d{1,2}):(\d{2})/);
    return match ? Math.min(1439, Number(match[1]) * 60 + Number(match[2])) : fallback;
};
export function calendarGridStart(reference: Date, view: string, firstWeekday: number): Date {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    if (view === 'month') {
        start.setDate(1);
        start.setDate(1 - ((start.getDay() - firstWeekday + 7) % 7));
    } else if (view === 'week') {
        start.setDate(start.getDate() - ((start.getDay() - firstWeekday + 7) % 7));
    }
    return start;
}
export function calendarDayCount(reference: Date, view: string, firstWeekday: number): number {
    if (view === 'month') {
        const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
        const leadingDays = (new Date(reference.getFullYear(), reference.getMonth(), 1).getDay() - firstWeekday + 7) % 7;
        return Math.ceil((lastDay.getDate() + leadingDays) / 7) * 7;
    }
    return view === 'week' ? 7 : 1;
}
export function calendarEventSlot(event: Event, firstMinute: number, endMinute: number, intervalMinutes: number): { row: number; span: number; startMinute: number } | null {
    const startMinute = eventMinutes(event.start, firstMinute);
    const finishMinute = Math.max(startMinute + intervalMinutes, eventMinutes(event.end, startMinute + intervalMinutes));
    if (finishMinute <= firstMinute || startMinute >= endMinute) return null;
    const visibleStart = Math.max(startMinute, firstMinute);
    const visibleFinish = Math.min(finishMinute, endMinute);
    const row = Math.max(0, Math.floor((visibleStart - firstMinute) / intervalMinutes));
    const span = Math.max(1, Math.ceil((visibleFinish - visibleStart) / intervalMinutes));
    return { row, span, startMinute };
}
export const calendarEventHasTime = (value: unknown): boolean => /(?:T|\s)\d{1,2}:\d{2}/.test(s(value));
export const calendarEventOccursOnDate = (event: Event, date: string): boolean => {
    const start = s(event.start).slice(0, 10);
    const rawEnd = s(event.end);
    const end = (rawEnd || start).slice(0, 10);
    if (!start || start > date) return false;
    // iCalendar uses an exclusive DTEND for all-day events; the ical adapter writes that end as
    // midnight of the following day, which is the same exclusive boundary.
    return rawEnd && end > start && eventMinutes(rawEnd) === 0 ? date < end : date <= end;
};
export function formatCalendarTime(minutes: number, mode = 'locale', locale?: string): string {
    const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    if (mode === '24h') return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    if (mode === '12h') return `${hours % 12 || 12}:${String(mins).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
    // German locale: the legacy Vuetify axis format is `HH Uhr`, not Intl's `HH:MM`.
    if (locale && locale.toLowerCase().startsWith('de')) return mins === 0 ? `${String(hours).padStart(2, '0')} Uhr` : `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, mins));
}
// Month-view events prefix their start time like the legacy Vuetify event summary: minutes only when
// they are not zero.
export function formatCalendarShortTime(minutes: number, mode = 'locale', locale?: string): string {
    const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    if (mode === '24h') return mins ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}` : String(hours).padStart(2, '0');
    if (mode === '12h') return `${hours % 12 || 12}${mins ? `:${String(mins).padStart(2, '0')}` : ''} ${hours < 12 ? 'AM' : 'PM'}`;
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: mins > 0 ? 'numeric' : undefined }).format(new Date(2000, 0, 1, hours, mins));
}

const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [{ name: 'oid', label: 'oid', type: 'id' }, { name: 'calendarView', label: 'calendarView', type: 'select', options: ['month', 'week', 'day'], default: 'month' }, { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 }, { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' }, { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 }, { name: 'debug', label: 'debug', type: 'checkbox' }] },
    { name: 'calendarLayout', label: 'group_calendarLayout', fields: [{ name: 'calendarWeekdays', label: 'calendarWeekdays', type: 'text', default: '1,2,3,4,5,6,0' }, { name: 'calendarShortWeekdays', label: 'calendarShortWeekdays', type: 'checkbox' }, { name: 'calendarBorderColor', label: 'calendarBorderColor', type: 'color' }, { name: 'calendarDayBackgroundColor', label: 'calendarDayBackgroundColor', type: 'color' }, { name: 'calendarDayBackgroundOutsideColor', label: 'calendarDayBackgroundOutsideColor', type: 'color' }] },
    { name: 'calendarHeaderLayout', label: 'group_calendarHeaderLayout', fields: [{ name: 'calendarHeaderBackground', label: 'calendarHeaderBackground', type: 'color' }, { name: 'calendarDayLabelFontSize', label: 'calendarDayLabelFontSize', type: 'number' }, { name: 'calendarDayLabelFontFamily', label: 'calendarDayLabelFontFamily', type: 'fontname' }, { name: 'calendarDayLabelFontColor', label: 'calendarDayLabelFontColor', type: 'color' }, { name: 'calendarDayLabelPreviousFontColor', label: 'calendarDayLabelPreviousFontColor', type: 'color' }, { name: 'calendarDayLabelTodayFontSize', label: 'calendarDayLabelTodayFontSize', type: 'number' }, { name: 'calendarDayLabelTodayFontFamily', label: 'calendarDayLabelTodayFontFamily', type: 'fontname' }, { name: 'calendarDayLabelTodayFontColor', label: 'calendarDayLabelTodayFontColor', type: 'color' }] },
    { name: 'calendarWeekNumbersLayout', label: 'group_calendarWeekNumbersLayout', fields: [{ name: 'calendarWeeksNumbersShow', label: 'calendarWeeksNumbersShow', type: 'checkbox', default: true }, { name: 'calendarWeeksNumbersBackground', label: 'calendarWeeksNumbersBackground', type: 'color' }, { name: 'calendarWeeksNumbersFontSize', label: 'calendarWeeksNumbersFontSize', type: 'number' }, { name: 'calendarWeeksNumbersFont', label: 'calendarWeeksNumbersFont', type: 'fontname' }, { name: 'calendarWeeksNumbersFontColor', label: 'calendarWeeksNumbersFontColor', type: 'color' }] },
    { name: 'calendarButtonsLayout', label: 'group_calendarButtonsLayout', fields: [{ name: 'calendarDayButtonMonthViewGoTo', label: 'calendarDayButtonMonthViewGoTo', type: 'select', options: ['week', 'day'], default: 'week' }, { name: 'calendarDayButtonWeekViewGoTo', label: 'calendarDayButtonWeekViewGoTo', type: 'select', options: ['month', 'day'], default: 'day' }, { name: 'calendarDayButtonDayViewGoTo', label: 'calendarDayButtonDayViewGoTo', type: 'select', options: ['month', 'week'], default: 'week' }, { name: 'calendarDayButtonRippleEffectColor', label: 'calendarDayButtonRippleEffectColor', type: 'color' }, { name: 'calendarDayButtonColor', label: 'calendarDayButtonColor', type: 'color' }, { name: 'calendarDayButtonFontSize', label: 'calendarDayButtonFontSize', type: 'number' }, { name: 'calendarDayButtonFontFamily', label: 'calendarDayButtonFontFamily', type: 'fontname' }, { name: 'calendarDayButtonFontColor', label: 'calendarDayButtonFontColor', type: 'color' }, { name: 'calendarDayButtonTodayColor', label: 'calendarDayButtonTodayColor', type: 'color' }, { name: 'calendarDayButtonTodayFontSize', label: 'calendarDayButtonTodayFontSize', type: 'number' }, { name: 'calendarDayButtonTodayFontFamily', label: 'calendarDayButtonTodayFontFamily', type: 'fontname' }, { name: 'calendarDayButtonTodayFontColor', label: 'calendarDayButtonTodayFontColor', type: 'color' }] },
    { name: 'controlLayout', label: 'group_controlLayout', fields: [{ name: 'controlShow', label: 'controlShow', type: 'checkbox', default: true }, { name: 'controlButtonLayout', label: 'controlButtonLayout', type: 'select', options: ['text', 'raised', 'unelevated', 'outlined'], default: 'text' }, { name: 'controlPosition', label: 'controlPosition', type: 'select', options: ['stretch', 'left', 'right', 'center'], default: 'stretch' }, { name: 'controlMinWidth', label: 'controlMinWidth', type: 'number' }, { name: 'controlShowLabel', label: 'controlShowLabel', type: 'checkbox', default: true }, { name: 'controlButtonColor', label: 'controlButtonColor', type: 'color' }, { name: 'controlButtonRippelEffectColor', label: 'controlButtonRippelEffectColor', type: 'color' }, { name: 'controlIconSize', label: 'controlIconSize', type: 'number' }, { name: 'controlIconColor', label: 'controlIconColor', type: 'color' }, { name: 'controlTextSize', label: 'controlTextSize', type: 'number' }, { name: 'controlTextFont', label: 'controlTextFont', type: 'fontname' }, { name: 'controlTextColor', label: 'controlTextColor', type: 'color' }] },
    { name: 'calendarTimeAxisLayout', label: 'group_calendarTimeAxisLayout', fields: [{ name: 'calendarTimeAxisStartTime', label: 'calendarTimeAxisStartTime', type: 'number', min: 0, max: 24, step: 1 }, { name: 'calendarTimeAxisEndTime', label: 'calendarTimeAxisEndTime', type: 'number', min: 1, max: 24, step: 1 }, { name: 'calendarTimeAxisIntervalMinutes', label: 'calendarTimeAxisIntervalMinutes', type: 'number' }, { name: 'calendarTimeFormat', label: 'calendarTimeFormat', type: 'select', options: ['locale', '24h', '12h'], default: 'locale' }, { name: 'calendarTimeAxisBackgroundColor', label: 'calendarTimeAxisBackgroundColor', type: 'color' }, { name: 'calendarTimeAxisWidth', label: 'calendarTimeAxisWidth', type: 'number' }, { name: 'calendarTimeAxisHeight', label: 'calendarTimeAxisHeight', type: 'number' }, { name: 'calendarTimeAxisShortIntervals', label: 'calendarTimeAxisShortIntervals', type: 'checkbox', default: true }, { name: 'calendarTimeAxisHeaderBackgroundColor', label: 'calendarTimeAxisHeaderBackgroundColor', type: 'color' }, { name: 'calendarTimeAxisFontSize', label: 'calendarTimeAxisFontSize', type: 'number' }, { name: 'calendarTimeAxisFont', label: 'calendarTimeAxisFont', type: 'fontname' }, { name: 'calendarTimeAxisFontColor', label: 'calendarTimeAxisFontColor', type: 'color' }, { name: 'calendarNowIndicatorShow', label: 'calendarNowIndicatorShow', type: 'checkbox', default: true }, { name: 'calendarNowIndicatorColor', label: 'calendarNowIndicatorColor', type: 'color' }] },
    { name: 'calendarEventLayout', label: 'group_calendarEventLayout', fields: [{ name: 'calendarEventOverlapMode', label: 'calendarEventOverlapMode', type: 'select', options: ['column', 'stack'], default: 'column' }, { name: 'calendarEventHeight', label: 'calendarEventHeight', type: 'number' }, { name: 'calendarEventFontSize', label: 'calendarEventFontSize', type: 'number' }, { name: 'calendarEventFont', label: 'calendarEventFont', type: 'fontname' }] },
    { name: 'calendarCustomFormats', label: 'group_calendarCustomFormats', fields: [{ name: 'calendarMonthViewHeaderFormat', label: 'calendarMonthViewHeaderFormat', type: 'text' }, { name: 'calendarMonthViewDayFormat', label: 'calendarMonthViewDayFormat', type: 'text' }, { name: 'calendarWeekViewHeaderFormat', label: 'calendarWeekViewHeaderFormat', type: 'text' }, { name: 'calendarWeekViewDayFormat', label: 'calendarWeekViewDayFormat', type: 'text' }, { name: 'calendarDayViewHeaderFormat', label: 'calendarDayViewHeaderFormat', type: 'text' }, { name: 'calendarDayViewDayFormat', label: 'calendarDayViewDayFormat', type: 'text' }] },
];

export function weekNumber(day: Date): number { const date = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())); date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7)); const year = new Date(Date.UTC(date.getUTCFullYear(), 0, 1)); return Math.ceil((((date.getTime() - year.getTime()) / 86400000) + 1) / 7); }

export default class MaterialDesignCalendar extends VisWidget {
    private date = new Date();
    private view = '';
    private touchX = 0;
    private clock = 0;
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-Calendar', 'Calendar', attrs, ['calendarHeaderLayout', 'calendarWeekNumbersLayout', 'calendarButtonsLayout', 'controlLayout', 'calendarTimeAxisLayout', 'calendarCustomFormats']), visPrev: squarePreview('F00ED'), visDefaultStyle: { width: 500, height: 300 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignCalendar.getWidgetInfo(); }
    componentDidMount(): void { super.componentDidMount(); this.clock = window.setInterval(() => this.forceUpdate(), 60000); }
    componentWillUnmount(): void { if (this.clock) window.clearInterval(this.clock); super.componentWillUnmount(); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const d = this.state.rxData as unknown as Data;
        const isDark = this.isDarkTheme();
        const view: string = this.view || s(d.calendarView, 'month');
        const source = events(stateValue(this.state, s(d.oid)));
        const weekdays = s(d.calendarWeekdays, '1,2,3,4,5,6,0').split(',').map(Number).filter(day => day >= 0 && day < 7);
        const order = weekdays.length === 7 ? weekdays : [1, 2, 3, 4, 5, 6, 0];
        const start = calendarGridStart(this.date, view, order[0]);
        const dayCount = calendarDayCount(this.date, view, order[0]);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const navLocale = typeof window !== 'undefined' ? window.navigator.language : undefined;
        // Weekday/month text follows the ioBroker system language, not the browser locale.
        const locale = typeof window !== 'undefined' ? ((window as unknown as { vis?: { language?: string }; systemLang?: string }).vis?.language || (window as unknown as { systemLang?: string }).systemLang || navLocale) : navLocale;
        const timeLocale = locale;
        const isM3 = designStyle(d) === 'material3';
        const m3 = (v: unknown, token: string, fb: string): string => s(v) || (isM3 ? token : fb);
        const borderColor = m3(d.calendarBorderColor, 'var(--md-sys-color-outline-variant)', '#e0e0e0');
        const headerBackground = m3(d.calendarHeaderBackground, 'var(--md-sys-color-surface-container-low)', 'transparent');
        const outsideBackground = m3(d.calendarDayBackgroundOutsideColor, 'var(--md-sys-color-surface-container-low)', isDark ? '#202020' : '#f7f7f7');
        const weekNumbersBackground = m3(d.calendarWeeksNumbersBackground, 'var(--md-sys-color-surface-container)', isDark ? '#202020' : '#f7f7f7');
        const weekNumbersColor = m3(d.calendarWeeksNumbersFontColor, 'var(--md-sys-color-on-surface-variant)', isDark ? '#FFFFFF' : '#000');
        const dayLabelColor = m3(d.calendarDayLabelFontColor, 'var(--md-sys-color-on-surface-variant)', isDark ? '#fff' : 'rgba(0,0,0,.38)');
        const dayLabelTodayColor = m3(d.calendarDayLabelTodayFontColor, 'var(--md-sys-color-primary)', '#44739e');
        const dayButtonTodayColor = m3(d.calendarDayButtonTodayColor, 'var(--md-sys-color-primary)', '#44739e');
        const dayButtonTodayFontColor = m3(d.calendarDayButtonTodayFontColor, 'var(--md-sys-color-on-primary)', '#fff');
        const dayButtonFontColor = m3(d.calendarDayButtonFontColor, 'var(--md-sys-color-on-surface)', isDark ? '#fff' : '#000');
        const eventBackground = isM3 ? 'var(--md-sys-color-primary-container)' : '#44739e';
        const eventColor = isM3 ? 'var(--md-sys-color-on-primary-container)' : '#fff';
        // An event's background comes from the calendar source, so an unset text color is derived from it;
        // non-parseable colors keep the token pair.
        const eventText = (event: { color?: unknown; colorText?: unknown }): string =>
            s(event.colorText) || (isM3 && s(event.color) ? m3OnColor(s(event.color)) || eventColor : eventColor);
        const eventRadius = isM3 ? 'var(--md-sys-shape-corner-extra-small)' : undefined;
        const controlIconColor = m3(d.controlIconColor, 'var(--md-sys-color-primary)', '#44739e');
        const controlTextColor = m3(d.controlTextColor, 'var(--md-sys-color-on-surface)', '#000');
        const timeAxisFontColor = m3(d.calendarTimeAxisFontColor, 'var(--md-sys-color-on-surface-variant)', isDark ? '#fff' : '#000');
        const move = (amount: number): void => { this.date = new Date(this.date); view === 'month' ? this.date.setMonth(this.date.getMonth() + amount) : this.date.setDate(this.date.getDate() + amount * (view === 'week' ? 7 : 1)); this.forceUpdate(); };
        const setView = (next: string): void => { this.view = next; this.forceUpdate(); };
        const controlStyle: React.CSSProperties = { background: s(d.controlButtonColor, 'transparent'), border: s(d.controlButtonLayout) === 'outlined' ? `1px solid ${s(d.controlIconColor) || (isM3 ? 'var(--md-sys-color-outline)' : '#44739e')}` : 0, borderRadius: isM3 ? 'var(--md-sys-shape-corner-full)' : 4, cursor: 'pointer', display: 'block', flexGrow: s(d.controlPosition, 'stretch') === 'stretch' ? 1 : undefined, height: 36, minWidth: n(d.controlMinWidth) || undefined, overflow: 'hidden', padding: '0 8px', position: 'relative' };
        const control = (name: string, symbol: string, action: () => void): React.JSX.Element => <div aria-label={VisWidget.t(`calendarControl${name}`)} className={`materialdesign-button materialdesign-vuetify-calendar-control-button${isM3 ? ' mdw-state-layer' : ''}`} key={name} onClick={action} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); } }} role="button" style={controlStyle} tabIndex={0}><div className="materialdesign-button-body" style={{ alignItems: 'center', color: controlIconColor, display: 'flex', height: '100%', justifyContent: 'center' }}><span className={`materialdesign-vuetify-calendar-control-button-icon mdi mdi-${symbol}`} style={{ color: controlIconColor, fontSize: px(d.controlIconSize, 24), height: px(d.controlIconSize, 24), lineHeight: 1, width: px(d.controlIconSize, 24) }} />{b(d.controlShowLabel, true) ? <span className="materialdesign-vuetify-calendar-control-button-text" style={{ color: controlTextColor, fontFamily: s(d.controlTextFont, 'inherit'), fontSize: px(d.controlTextSize, 12), marginLeft: 4 }}>{VisWidget.t(`calendarControl${name}`)}</span> : null}</div></div>;
        const timeFormat = s(d.calendarTimeFormat, 'locale');
        // Days before today keep their own label color (legacy `--vue-calendar-day-label-previous-font-color`).
        const dayNumberColor = (isToday: boolean, past: boolean): string => isToday ? dayButtonTodayFontColor : s(past ? d.calendarDayLabelPreviousFontColor : '', dayButtonFontColor);
        const cells = Array.from({ length: dayCount }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); const iso = isoDate(day); const outside = day.getMonth() !== this.date.getMonth(); const isToday = day.getTime() === today.getTime(); const past = day.getTime() < today.getTime(); const list = source.filter(event => calendarEventOccursOnDate(event, iso)); const next = view === 'month' ? s(d.calendarDayButtonMonthViewGoTo, 'week') : view === 'week' ? s(d.calendarDayButtonWeekViewGoTo, 'day') : s(d.calendarDayButtonDayViewGoTo, 'week'); const label = s(d.calendarMonthViewDayFormat) ? formatMoment(day, s(d.calendarMonthViewDayFormat), locale) : day.getDate() === 1 ? `${day.getDate()} ${new Intl.DateTimeFormat(locale, { month: 'short' }).format(day).replace('.', '')}` : day.getDate(); return <React.Fragment key={iso}>{b(d.calendarWeeksNumbersShow, true) && view === 'month' && index % 7 === 0 ? <div style={{ alignItems: 'center', background: weekNumbersBackground, border: `1px solid ${borderColor}`, color: weekNumbersColor, display: 'flex', fontFamily: s(d.calendarWeeksNumbersFont, 'inherit'), fontSize: px(d.calendarWeeksNumbersFontSize, 12), justifyContent: 'center' }}>{weekNumber(day)}</div> : null}<div style={{ background: outside ? outsideBackground : s(d.calendarDayBackgroundColor, 'transparent'), border: `1px solid ${borderColor}`, minWidth: 0, overflow: 'hidden', padding: 4 }}><button aria-current={isToday ? 'date' : undefined} type="button" onClick={() => setView(next)} style={{ background: isToday ? dayButtonTodayColor : s(d.calendarDayButtonColor, 'transparent'), border: 0, borderRadius: isToday ? '50%' : 0, color: dayNumberColor(isToday, past), cursor: 'pointer', fontFamily: isToday ? s(d.calendarDayButtonTodayFontFamily, 'inherit') : s(d.calendarDayButtonFontFamily, 'inherit'), fontSize: px(isToday ? d.calendarDayButtonTodayFontSize : d.calendarDayButtonFontSize, 14), minHeight: isM3 ? 24 : undefined, minWidth: isToday ? 28 : isM3 ? 24 : undefined }}>{label}</button>{list.map((event, eventIndex) => <div className="v-event" key={eventIndex} style={{ backgroundColor: s(event.color, eventBackground), borderRadius: eventRadius, color: eventText(event), fontFamily: s(d.calendarEventFont, 'inherit'), fontSize: px(d.calendarEventFontSize, 12), height: n(d.calendarEventHeight) || undefined, marginTop: 2, overflow: 'hidden', padding: '0 2px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span className="v-event-summary">{calendarEventHasTime(event.start) && s(event.start).slice(0, 10) === iso ? <><strong>{formatCalendarShortTime(eventMinutes(event.start), timeFormat, timeLocale)}</strong>{' '}</> : null}{s(event.name)}</span></div>)}</div></React.Fragment>; });
        const calendarColumns = view === 'month' && b(d.calendarWeeksNumbersShow, true) ? 8 : view === 'day' ? 1 : 7;
        const firstMinute = Math.max(0, Math.min(23, Math.floor(n(d.calendarTimeAxisStartTime)))) * 60;
        const endMinute = Math.max(firstMinute + 60, Math.min(1440, Math.floor(n(d.calendarTimeAxisEndTime, 24)) * 60));
        const intervalMinutes = Math.max(1, Math.floor(n(d.calendarTimeAxisIntervalMinutes, 60)));
        const slotCount = Math.min(288, Math.ceil((endMinute - firstMinute) / intervalMinutes));
        const slotHeight = Math.max(12, n(d.calendarTimeAxisHeight, 48));
        const gridDays = Array.from({ length: dayCount }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return { day, iso: isoDate(day) }; });
        const now = new Date();
        const nowMinute = now.getHours() * 60 + now.getMinutes();
        const nowColumn = gridDays.findIndex(({ day }) => day.getTime() === today.getTime());
        // The line sits inside the slot it falls into, at its share of that slot's height.
        const nowSlot = nowColumn >= 0 && nowMinute >= firstMinute && nowMinute < endMinute && b(d.calendarNowIndicatorShow, true) ? { row: Math.floor((nowMinute - firstMinute) / intervalMinutes), share: ((nowMinute - firstMinute) % intervalMinutes) / intervalMinutes } : null;
        const timeAxisWidth = Math.max(32, n(d.calendarTimeAxisWidth, 60));
        const timeGridColumns = `${timeAxisWidth + 1}px repeat(${dayCount}, minmax(0, 1fr))`;
        // Header and body are two grids with the same column template but only the body scrolls, so a
        // space-taking scrollbar narrows its columns and the two drift. `scrollbar-gutter: stable` reserves
        // the gutter in both; the header needs `overflow: hidden` to be a scroll container at all.
        const timeGrid = <div className="v-calendar v-calendar-daily theme--light v-calendar-events" style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}><div className="v-calendar-daily__head" style={{ display: 'grid', flex: '0 0 auto', gridTemplateColumns: timeGridColumns, overflow: 'hidden', scrollbarGutter: 'stable' }}>
            <div className="materialdesign-calendar-intervals-head" style={{ alignItems: 'center', background: s(d.calendarTimeAxisHeaderBackgroundColor, 'transparent'), border: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>{b(d.calendarWeeksNumbersShow, true) && view === 'week' ? <span style={{ color: weekNumbersColor, fontFamily: s(d.calendarWeeksNumbersFont, 'inherit'), fontSize: px(d.calendarWeeksNumbersFontSize, 12) }}>{`${VisWidget.t('calendarWeekShort')} ${weekNumber(start)}`}</span> : null}</div>
            {gridDays.map(({ day, iso }) => { const isToday = day.getTime() === today.getTime(); const past = day.getTime() < today.getTime(); const next = view === 'week' ? s(d.calendarDayButtonWeekViewGoTo, 'day') : s(d.calendarDayButtonDayViewGoTo, 'week'); const hf = view === 'week' ? s(d.calendarWeekViewHeaderFormat) : s(d.calendarDayViewHeaderFormat); const df = view === 'week' ? s(d.calendarWeekViewDayFormat) : s(d.calendarDayViewDayFormat); const header = hf ? formatMoment(day, hf, locale) : new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(day); const label = df ? formatMoment(day, df, locale) : day.getDate(); return <div className={`v-calendar-daily_head-day ${isToday ? 'v-present' : 'v-past'}`} key={`header-${iso}`} style={{ background: headerBackground, borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, borderTop: `1px solid ${borderColor}`, minWidth: 0, paddingBottom: 1, width: 'auto' }}><div className="v-calendar-daily_head-weekday" style={{ color: isToday ? dayLabelTodayColor : s(past ? d.calendarDayLabelPreviousFontColor : '', dayLabelColor), fontFamily: isToday ? s(d.calendarDayLabelTodayFontFamily, 'inherit') : s(d.calendarDayLabelFontFamily, 'inherit'), fontSize: px(isToday ? d.calendarDayLabelTodayFontSize : d.calendarDayLabelFontSize, 13), overflow: 'hidden', padding: 4, textAlign: 'center', textTransform: 'uppercase' }}>{header}</div><div className="v-calendar-daily_head-day-label" style={{ overflow: 'hidden', paddingBottom: 3, textAlign: 'center' }}><button aria-current={isToday ? 'date' : undefined} className="v-btn--round" type="button" onClick={() => setView(next)} style={{ alignItems: 'center', background: isToday ? dayButtonTodayColor : s(d.calendarDayButtonColor, 'transparent'), border: 0, borderRadius: '50%', color: dayNumberColor(isToday, past), cursor: 'pointer', display: 'inline-flex', fontFamily: isToday ? s(d.calendarDayButtonTodayFontFamily, 'inherit') : s(d.calendarDayButtonFontFamily, 'inherit'), fontSize: px(isToday ? d.calendarDayButtonTodayFontSize : d.calendarDayButtonFontSize, 14), aspectRatio: '1 / 1', justifyContent: 'center', maxWidth: '100%', minWidth: 0, padding: 0, width: isM3 ? 'min(40px, 100%)' : 'min(56px, 100%)' }}><span>{label}</span></button></div></div>; })}
        </div><div className="v-calendar-daily__scroll-area" style={{ display: 'grid', flex: 1, gridTemplateColumns: timeGridColumns, gridTemplateRows: `repeat(${slotCount}, minmax(${slotHeight}px, 1fr))`, minHeight: 0, overflow: 'auto', scrollbarGutter: 'stable' }}>
            {Array.from({ length: slotCount }, (_, slot) => {
                const minute = firstMinute + slot * intervalMinutes;
                // The label sits on the slot's LOWER border, i.e. the next boundary, so it must show that
                // boundary's time; minute + interval/2 put a :30 offset on every hour line.
                const labelMinute = minute + intervalMinutes;
                const showLabel = slot < slotCount - 1 && (b(d.calendarTimeAxisShortIntervals, true) || labelMinute % 60 === 0);
                return <React.Fragment key={`slot-${minute}`}><div style={{ alignItems: 'flex-end', background: s(d.calendarTimeAxisBackgroundColor, 'transparent'), boxSizing: 'border-box', display: 'flex', gridColumn: 1, gridRow: slot + 1, justifyContent: 'flex-end' }}>{showLabel ? <div className="v-calendar-daily__interval-text" style={{ boxSizing: 'border-box', color: timeAxisFontColor, fontFamily: s(d.calendarTimeAxisFont, 'inherit'), fontSize: px(d.calendarTimeAxisFontSize, 12), paddingRight: 4, textAlign: 'right', transform: 'translateY(50%)', width: timeAxisWidth - 8 }}>{formatCalendarTime(labelMinute, timeFormat, timeLocale)}</div> : null}</div>{gridDays.map(({ iso }, dayIndex) => <div className="v-calendar-daily__day-interval" key={`${iso}-${minute}`} style={{ background: s(d.calendarDayBackgroundColor, 'transparent'), borderLeft: dayIndex === 0 ? 0 : undefined, borderRight: `1px solid ${borderColor}`, borderTop: `1px solid ${borderColor}`, gridColumn: dayIndex + 2, gridRow: slot + 1 }} />)}</React.Fragment>;
            })}
            {gridDays.flatMap(({ iso }, dayIndex) => source.filter(event => calendarEventOccursOnDate(event, iso)).map((event, eventIndex) => {
                const slot = calendarEventSlot(event, firstMinute, endMinute, intervalMinutes);
                if (!slot) return null;
                const { row, span, startMinute } = slot;
                return <div className="v-event" key={`event-${iso}-${eventIndex}`} style={{ alignSelf: 'stretch', backgroundColor: s(event.color, eventBackground), borderRadius: eventRadius, color: eventText(event), fontFamily: s(d.calendarEventFont, 'inherit'), fontSize: px(d.calendarEventFontSize, 12), gridColumn: dayIndex + 2, gridRow: `${row + 1} / span ${Math.min(span, slotCount - row)}`, lineHeight: 1.3, margin: 1, minHeight: 0, overflow: 'hidden', padding: '4px 8px', zIndex: 1 }}>{calendarEventHasTime(event.start) ? <div style={{ fontWeight: 700, marginBottom: 2 }}>{formatCalendarTime(startMinute, timeFormat, timeLocale)}</div> : null}<div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s(event.name)}</div></div>;
            }))}
            {nowSlot ? <div className="v-current-time" style={{ gridColumn: nowColumn + 2, gridRow: nowSlot.row + 1, pointerEvents: 'none', position: 'relative', zIndex: 2 }}><div style={{ background: s(d.calendarNowIndicatorColor, '#ea4335'), height: 2, left: 0, position: 'absolute', right: 0, top: `${nowSlot.share * 100}%` }} /></div> : null}
        </div></div>;
        return <div className={`materialdesign-widget materialdesign-calendar materialdesign-vuetify-calendar${isM3 ? ` ${designStyleClasses(d, isDark)}` : ''}`} style={{ background: isM3 ? 'var(--md-sys-color-surface)' : isDark ? '#303030' : 'transparent', color: isM3 ? 'var(--md-sys-color-on-surface)' : isDark ? '#fff' : '#000', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {b(d.controlShow, true) ? <div className="materialdesign-vuetify-calendar-control-container" style={{ display: 'flex', flex: '0 0 auto', gap: 0, justifyContent: s(d.controlPosition, 'stretch') === 'stretch' ? 'stretch' : s(d.controlPosition) === 'left' ? 'flex-start' : s(d.controlPosition) === 'right' ? 'flex-end' : 'center' }}>{control('Prev', 'calendar-arrow-left', () => move(-1))}{control('Today', 'calendar-today', () => { this.date = new Date(); this.forceUpdate(); })}{control('Month', 'calendar-month', () => setView('month'))}{control('Week', 'calendar-week', () => setView('week'))}{control('Day', 'calendar', () => setView('day'))}{control('Next', 'calendar-arrow-right', () => move(1))}</div> : null}
            {view === 'month' ? <div onTouchStart={event => { this.touchX = event.touches[0]?.clientX || 0; }} onTouchEnd={event => { const distance = (event.changedTouches[0]?.clientX || 0) - this.touchX; if (Math.abs(distance) > 30) move(distance < 0 ? 1 : -1); }} style={{ display: 'grid', flex: 1, gridAutoRows: 'minmax(0, 1fr)', gridTemplateColumns: calendarColumns === 8 ? '24px repeat(7, minmax(0, 1fr))' : `repeat(${calendarColumns}, minmax(0, 1fr))`, gridTemplateRows: view === 'month' ? 'auto' : undefined, minHeight: 0 }}>
                {(view as string) !== 'day' ? <>{b(d.calendarWeeksNumbersShow, true) && view === 'month' ? <div style={{ background: headerBackground, border: `1px solid ${borderColor}` }} /> : null}{order.map(day => <div key={day} style={{ background: headerBackground, border: `1px solid ${borderColor}`, color: m3(d.calendarDayLabelFontColor, 'var(--md-sys-color-on-surface-variant)', 'rgba(0,0,0,.38)'), fontFamily: s(d.calendarDayLabelFontFamily, 'inherit'), fontSize: px(d.calendarDayLabelFontSize, 12), overflow: 'hidden', padding: 4, textAlign: 'center', textTransform: 'uppercase' }}>{(() => { const hf = s(d.calendarMonthViewHeaderFormat); const dt = new Date(2024, 0, day || 7); return hf ? formatMoment(dt, hf, locale) : new Intl.DateTimeFormat(locale, { weekday: b(d.calendarShortWeekdays) ? 'short' : 'long' }).format(dt); })()}</div>)}</> : null}
                {cells}
            </div> : timeGrid}
        </div>;
    }
}
