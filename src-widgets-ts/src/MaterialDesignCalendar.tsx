import React from 'react';
import type { RxWidgetInfo, VisRxWidgetState } from '@iobroker/types-vis-2';
import { RenderProps, VisWidget, createInfo, sizeCss, stateValue } from './widgetUtils';
import { renderIcon } from './MaterialDesignButtons';

type Data = Record<string, unknown> & { oid?: string };
type Event = { start?: string; end?: string; name?: string; color?: string; colorText?: string };
const s = (v: unknown, d = ''): string => {
    const value = v === undefined || v === null || v === '' || v === 'null' ? d : String(v);
    return value.startsWith('var(') && value.endsWith(')') ? `${value.slice(0, -1)}, ${d})` : value;
};
const b = (v: unknown, d = false): boolean => v === undefined || v === null || v === '' ? d : v === true || v === 'true' || v === 1 || v === '1';
const n = (v: unknown, d = 0): number => Number.isFinite(Number(v)) ? Number(v) : d;
const px = (v: unknown, d: number): string => sizeCss(v, d);
const events = (v: unknown): Event[] => { try { const value = JSON.parse(s(v)); return Array.isArray(value) ? value : []; } catch { return []; } };
// Local YYYY-MM-DD (toISOString() shifts to UTC and misplaces events by a day in +offset zones)
const isoDate = (day: Date): string => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
const eventMinutes = (value: unknown, fallback = 0): number => {
    const match = s(value).match(/(?:T|\s)(\d{1,2}):(\d{2})/);
    return match ? Math.min(1439, Number(match[1]) * 60 + Number(match[2])) : fallback;
};
export function formatCalendarTime(minutes: number, mode = 'locale', locale?: string): string {
    const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    if (mode === '24h') return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    if (mode === '12h') return `${hours % 12 || 12}:${String(mins).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, mins));
}

// Minimal moment-style date formatter for the widget's custom-format fields (VIS1 used moment tokens).
// Longer tokens must precede shorter ones in the alternation so YYYY beats YY, MMMM beats MM, etc.
export function formatMoment(date: Date, token: string, locale?: string): string {
    if (!token) return '';
    const pad = (value: number): string => String(value).padStart(2, '0');
    const map: Record<string, () => string> = {
        YYYY: () => String(date.getFullYear()),
        YY: () => String(date.getFullYear()).slice(-2),
        MMMM: () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(date),
        MMM: () => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', ''),
        MM: () => pad(date.getMonth() + 1),
        M: () => String(date.getMonth() + 1),
        DD: () => pad(date.getDate()),
        D: () => String(date.getDate()),
        dddd: () => new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
        ddd: () => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', ''),
        dd: () => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date),
        HH: () => pad(date.getHours()),
        H: () => String(date.getHours()),
        mm: () => pad(date.getMinutes()),
        m: () => String(date.getMinutes()),
    };
    return token.replace(/YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|dd|DD|D|HH|H|mm|m/g, match => (map[match] ? map[match]() : match));
}

const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [{ name: 'oid', label: 'oid', type: 'id' }, { name: 'calendarView', label: 'calendarView', type: 'select', options: ['month', 'week', 'day'], default: 'month' }, { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 }, { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' }, { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 }, { name: 'debug', label: 'debug', type: 'checkbox' }] },
    { name: 'calendarLayout', label: 'group_calendarLayout', fields: [{ name: 'calendarWeekdays', label: 'calendarWeekdays', type: 'text', default: '1,2,3,4,5,6,0' }, { name: 'calendarShortWeekdays', label: 'calendarShortWeekdays', type: 'checkbox' }, { name: 'calendarBorderColor', label: 'calendarBorderColor', type: 'color' }, { name: 'calendarDayBackgroundColor', label: 'calendarDayBackgroundColor', type: 'color' }, { name: 'calendarDayBackgroundOutsideColor', label: 'calendarDayBackgroundOutsideColor', type: 'color' }] },
    { name: 'calendarHeaderLayout', label: 'group_calendarHeaderLayout', fields: [{ name: 'calendarHeaderBackground', label: 'calendarHeaderBackground', type: 'color' }, { name: 'calendarDayLabelFontSize', label: 'calendarDayLabelFontSize', type: 'number' }, { name: 'calendarDayLabelFontFamily', label: 'calendarDayLabelFontFamily', type: 'fontname' }, { name: 'calendarDayLabelFontColor', label: 'calendarDayLabelFontColor', type: 'color' }, { name: 'calendarDayLabelPreviousFontColor', label: 'calendarDayLabelPreviousFontColor', type: 'color' }, { name: 'calendarDayLabelTodayFontSize', label: 'calendarDayLabelTodayFontSize', type: 'number' }, { name: 'calendarDayLabelTodayFontFamily', label: 'calendarDayLabelTodayFontFamily', type: 'fontname' }, { name: 'calendarDayLabelTodayFontColor', label: 'calendarDayLabelTodayFontColor', type: 'color' }] },
    { name: 'calendarWeekNumbersLayout', label: 'group_calendarWeekNumbersLayout', fields: [{ name: 'calendarWeeksNumbersShow', label: 'calendarWeeksNumbersShow', type: 'checkbox', default: true }, { name: 'calendarWeeksNumbersBackground', label: 'calendarWeeksNumbersBackground', type: 'color' }, { name: 'calendarWeeksNumbersFontSize', label: 'calendarWeeksNumbersFontSize', type: 'number' }, { name: 'calendarWeeksNumbersFont', label: 'calendarWeeksNumbersFont', type: 'fontname' }, { name: 'calendarWeeksNumbersFontColor', label: 'calendarWeeksNumbersFontColor', type: 'color' }] },
    { name: 'calendarButtonsLayout', label: 'group_calendarButtonsLayout', fields: [{ name: 'calendarDayButtonMonthViewGoTo', label: 'calendarDayButtonMonthViewGoTo', type: 'select', options: ['week', 'day'], default: 'week' }, { name: 'calendarDayButtonWeekViewGoTo', label: 'calendarDayButtonWeekViewGoTo', type: 'select', options: ['month', 'day'], default: 'day' }, { name: 'calendarDayButtonDayViewGoTo', label: 'calendarDayButtonDayViewGoTo', type: 'select', options: ['month', 'week'], default: 'week' }, { name: 'calendarDayButtonRippleEffectColor', label: 'calendarDayButtonRippleEffectColor', type: 'color' }, { name: 'calendarDayButtonColor', label: 'calendarDayButtonColor', type: 'color' }, { name: 'calendarDayButtonFontSize', label: 'calendarDayButtonFontSize', type: 'number' }, { name: 'calendarDayButtonFontFamily', label: 'calendarDayButtonFontFamily', type: 'fontname' }, { name: 'calendarDayButtonFontColor', label: 'calendarDayButtonFontColor', type: 'color' }, { name: 'calendarDayButtonTodayColor', label: 'calendarDayButtonTodayColor', type: 'color' }, { name: 'calendarDayButtonTodayFontSize', label: 'calendarDayButtonTodayFontSize', type: 'number' }, { name: 'calendarDayButtonTodayFontFamily', label: 'calendarDayButtonTodayFontFamily', type: 'fontname' }, { name: 'calendarDayButtonTodayFontColor', label: 'calendarDayButtonTodayFontColor', type: 'color' }] },
    { name: 'controlLayout', label: 'group_controlLayout', fields: [{ name: 'controlShow', label: 'controlShow', type: 'checkbox', default: true }, { name: 'controlButtonLayout', label: 'controlButtonLayout', type: 'select', options: ['text', 'raised', 'unelevated', 'outlined'], default: 'text' }, { name: 'controlPosition', label: 'controlPosition', type: 'select', options: ['stretch', 'left', 'right', 'center'], default: 'stretch' }, { name: 'controlMinWidth', label: 'controlMinWidth', type: 'number' }, { name: 'controlShowLabel', label: 'controlShowLabel', type: 'checkbox', default: true }, { name: 'controlButtonColor', label: 'controlButtonColor', type: 'color' }, { name: 'controlButtonRippelEffectColor', label: 'controlButtonRippelEffectColor', type: 'color' }, { name: 'controlIconSize', label: 'controlIconSize', type: 'number' }, { name: 'controlIconColor', label: 'controlIconColor', type: 'color' }, { name: 'controlTextSize', label: 'controlTextSize', type: 'number' }, { name: 'controlTextFont', label: 'controlTextFont', type: 'fontname' }, { name: 'controlTextColor', label: 'controlTextColor', type: 'color' }] },
    { name: 'calendarTimeAxisLayout', label: 'group_calendarTimeAxisLayout', fields: [{ name: 'calendarTimeAxisStartTime', label: 'calendarTimeAxisStartTime', type: 'number', min: 0, max: 24, step: 1 }, { name: 'calendarTimeAxisEndTime', label: 'calendarTimeAxisEndTime', type: 'number', min: 1, max: 24, step: 1 }, { name: 'calendarTimeAxisIntervalMinutes', label: 'calendarTimeAxisIntervalMinutes', type: 'number' }, { name: 'calendarTimeFormat', label: 'calendarTimeFormat', type: 'select', options: ['locale', '24h', '12h'], default: 'locale' }, { name: 'calendarTimeAxisBackgroundColor', label: 'calendarTimeAxisBackgroundColor', type: 'color' }, { name: 'calendarTimeAxisWidth', label: 'calendarTimeAxisWidth', type: 'number' }, { name: 'calendarTimeAxisHeight', label: 'calendarTimeAxisHeight', type: 'number' }, { name: 'calendarTimeAxisShortIntervals', label: 'calendarTimeAxisShortIntervals', type: 'checkbox', default: true }, { name: 'calendarTimeAxisHeaderBackgroundColor', label: 'calendarTimeAxisHeaderBackgroundColor', type: 'color' }, { name: 'calendarTimeAxisFontSize', label: 'calendarTimeAxisFontSize', type: 'number' }, { name: 'calendarTimeAxisFont', label: 'calendarTimeAxisFont', type: 'fontname' }, { name: 'calendarTimeAxisFontColor', label: 'calendarTimeAxisFontColor', type: 'color' }] },
    { name: 'calendarEventLayout', label: 'group_calendarEventLayout', fields: [{ name: 'calendarEventOverlapMode', label: 'calendarEventOverlapMode', type: 'select', options: ['column', 'stack'], default: 'column' }, { name: 'calendarEventHeight', label: 'calendarEventHeight', type: 'number' }, { name: 'calendarEventFontSize', label: 'calendarEventFontSize', type: 'number' }, { name: 'calendarEventFont', label: 'calendarEventFont', type: 'fontname' }] },
    { name: 'calendarCustomFormats', label: 'group_calendarCustomFormats', fields: [{ name: 'calendarMonthViewHeaderFormat', label: 'calendarMonthViewHeaderFormat', type: 'text' }, { name: 'calendarMonthViewDayFormat', label: 'calendarMonthViewDayFormat', type: 'text' }, { name: 'calendarWeekViewHeaderFormat', label: 'calendarWeekViewHeaderFormat', type: 'text' }, { name: 'calendarWeekViewDayFormat', label: 'calendarWeekViewDayFormat', type: 'text' }, { name: 'calendarDayViewHeaderFormat', label: 'calendarDayViewHeaderFormat', type: 'text' }, { name: 'calendarDayViewDayFormat', label: 'calendarDayViewDayFormat', type: 'text' }] },
];

function weekNumber(day: Date): number { const date = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())); date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7)); const year = new Date(Date.UTC(date.getUTCFullYear(), 0, 1)); return Math.ceil((((date.getTime() - year.getTime()) / 86400000) + 1) / 7); }

export default class MaterialDesignCalendar extends VisWidget {
    private date = new Date();
    private view = '';
    private touchX = 0;
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-Calendar', 'Calendar', attrs), visPrev: '<img src="widgets/vis2-materialdesign/img/calendar.png"></img>', visDefaultStyle: { width: 500, height: 300 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignCalendar.getWidgetInfo(); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const d = this.state.rxData as unknown as Data;
        const isDark = this.state.values?.[`${s(d.__mdwThemeDark)}.val`] === true || this.state.values?.[`${s(d.__mdwThemeDark)}.val`] === 'true';
        const view = this.view || s(d.calendarView, 'month');
        const source = events(stateValue(this.state as VisRxWidgetState, s(d.oid)));
        const weekdays = s(d.calendarWeekdays, '1,2,3,4,5,6,0').split(',').map(Number).filter(day => day >= 0 && day < 7);
        const order = weekdays.length === 7 ? weekdays : [1, 2, 3, 4, 5, 6, 0];
        const start = new Date(this.date); start.setHours(0, 0, 0, 0);
        if (view === 'month') { start.setDate(1); start.setDate(1 - ((start.getDay() - order[0] + 7) % 7)); } else if (view === 'week') start.setDate(start.getDate() - ((start.getDay() - order[0] + 7) % 7));
        const lastDay = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);
        const dayCount = view === 'month' ? Math.ceil((lastDay.getDate() + ((new Date(this.date.getFullYear(), this.date.getMonth(), 1).getDay() - order[0] + 7) % 7)) / 7) * 7 : view === 'week' ? 7 : 1;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const locale = typeof window !== 'undefined' ? window.navigator.language : undefined;
        const move = (amount: number): void => { this.date = new Date(this.date); view === 'month' ? this.date.setMonth(this.date.getMonth() + amount) : this.date.setDate(this.date.getDate() + amount * (view === 'week' ? 7 : 1)); this.forceUpdate(); };
        const setView = (next: string): void => { this.view = next; this.forceUpdate(); };
        const icon = (value: string): React.JSX.Element => renderIcon(value, s(d.controlIconColor, '#44739e'), n(d.controlIconSize, 24))!;
        const controlStyle: React.CSSProperties = { alignItems: 'center', background: s(d.controlButtonColor, 'transparent'), border: s(d.controlButtonLayout) === 'outlined' ? `1px solid ${s(d.controlIconColor, '#44739e')}` : 0, borderRadius: 4, color: s(d.controlIconColor, '#44739e'), cursor: 'pointer', display: 'inline-flex', fontFamily: s(d.controlTextFont, 'inherit'), fontSize: px(d.controlTextSize, 12), gap: 4, justifyContent: 'center', minWidth: n(d.controlMinWidth) || undefined, padding: 4 };
        const control = (name: string, symbol: string, action: () => void): React.JSX.Element => <button key={name} type="button" aria-label={VisWidget.t(`calendarControl${name}`)} onClick={action} style={controlStyle}>{icon(symbol)}{b(d.controlShowLabel, true) ? <span style={{ color: s(d.controlTextColor, '#000') }}>{VisWidget.t(`calendarControl${name}`)}</span> : null}</button>;
        const cells = Array.from({ length: dayCount }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); const iso = isoDate(day); const outside = day.getMonth() !== this.date.getMonth(); const isToday = day.getTime() === today.getTime(); const list = source.filter(event => s(event.start).slice(0, 10) <= iso && s(event.end || event.start).slice(0, 10) >= iso); const next = view === 'month' ? s(d.calendarDayButtonMonthViewGoTo, 'week') : view === 'week' ? s(d.calendarDayButtonWeekViewGoTo, 'day') : s(d.calendarDayButtonDayViewGoTo, 'week'); const label = s(d.calendarMonthViewDayFormat) ? formatMoment(day, s(d.calendarMonthViewDayFormat), locale) : day.getDate() === 1 ? `${day.getDate()} ${new Intl.DateTimeFormat(undefined, { month: 'short' }).format(day).replace('.', '')}` : day.getDate(); return <React.Fragment key={iso}>{b(d.calendarWeeksNumbersShow, true) && view === 'month' && index % 7 === 0 ? <div style={{ alignItems: 'center', background: s(d.calendarWeeksNumbersBackground, isDark ? '#202020' : '#f7f7f7'), border: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, color: s(d.calendarWeeksNumbersFontColor, isDark ? '#FFFFFF' : '#000'), display: 'flex', fontFamily: s(d.calendarWeeksNumbersFont, 'inherit'), fontSize: px(d.calendarWeeksNumbersFontSize, 12), justifyContent: 'center' }}>{weekNumber(day)}</div> : null}<div style={{ background: outside ? s(d.calendarDayBackgroundOutsideColor, isDark ? '#202020' : '#f7f7f7') : s(d.calendarDayBackgroundColor, 'transparent'), border: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, minWidth: 0, overflow: 'hidden', padding: 4 }}><button type="button" onClick={() => setView(next)} style={{ background: isToday ? s(d.calendarDayButtonTodayColor, '#44739e') : s(d.calendarDayButtonColor, 'transparent'), border: 0, borderRadius: isToday ? '50%' : 0, color: isToday ? s(d.calendarDayButtonTodayFontColor, '#fff') : s(d.calendarDayButtonFontColor, isDark ? '#fff' : '#000'), cursor: 'pointer', fontFamily: isToday ? s(d.calendarDayButtonTodayFontFamily, 'inherit') : s(d.calendarDayButtonFontFamily, 'inherit'), fontSize: px(isToday ? d.calendarDayButtonTodayFontSize : d.calendarDayButtonFontSize, 14), minWidth: isToday ? 28 : undefined }}>{label}</button>{list.map((event, eventIndex) => <div key={eventIndex} style={{ background: s(event.color, '#44739e'), color: s(event.colorText, '#fff'), fontFamily: s(d.calendarEventFont, 'inherit'), fontSize: px(d.calendarEventFontSize, 12), height: n(d.calendarEventHeight) || undefined, marginTop: 2, overflow: 'hidden', padding: '0 2px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s(event.name)}</div>)}</div></React.Fragment>; });
        const calendarColumns = view === 'month' && b(d.calendarWeeksNumbersShow, true) ? 8 : view === 'day' ? 1 : 7;
        const timeFormat = s(d.calendarTimeFormat, 'locale');
        const firstMinute = Math.max(0, Math.min(23, Math.floor(n(d.calendarTimeAxisStartTime)))) * 60;
        const endMinute = Math.max(firstMinute + 60, Math.min(1440, Math.floor(n(d.calendarTimeAxisEndTime, 24)) * 60));
        const intervalMinutes = Math.max(1, Math.floor(n(d.calendarTimeAxisIntervalMinutes, 60)));
        const slotCount = Math.min(288, Math.ceil((endMinute - firstMinute) / intervalMinutes));
        const slotHeight = Math.max(12, n(d.calendarTimeAxisHeight, 48));
        const gridDays = Array.from({ length: dayCount }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return { day, iso: isoDate(day) }; });
        const timeGrid = <div style={{ display: 'grid', flex: 1, gridTemplateColumns: `${Math.max(32, n(d.calendarTimeAxisWidth, 60))}px repeat(${dayCount}, minmax(0, 1fr))`, gridTemplateRows: `32px repeat(${slotCount}, ${slotHeight}px)`, minHeight: 0, overflow: 'auto' }}>
            <div style={{ background: s(d.calendarTimeAxisHeaderBackgroundColor, isDark ? '#202020' : '#f7f7f7'), gridColumn: 1, gridRow: 1 }} />
            {gridDays.map(({ day, iso }, dayIndex) => <div key={`header-${iso}`} style={{ background: s(d.calendarHeaderBackground, 'transparent'), border: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, gridColumn: dayIndex + 2, gridRow: 1, overflow: 'hidden', padding: 4, textAlign: 'center' }}>{(() => { const hf = view === 'week' ? s(d.calendarWeekViewHeaderFormat) : s(d.calendarDayViewHeaderFormat); const df = view === 'week' ? s(d.calendarWeekViewDayFormat) : s(d.calendarDayViewDayFormat); return hf || df ? `${hf ? formatMoment(day, hf, locale) : ''}${hf && df ? ' ' : ''}${df ? formatMoment(day, df, locale) : ''}` : new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(day); })()}</div>)}
            {Array.from({ length: slotCount }, (_, slot) => {
                const minute = firstMinute + slot * intervalMinutes;
                const showLabel = b(d.calendarTimeAxisShortIntervals, true) || minute % 60 === 0;
                return <React.Fragment key={`slot-${minute}`}><div style={{ alignItems: 'flex-start', background: s(d.calendarTimeAxisBackgroundColor, isDark ? '#202020' : '#f7f7f7'), borderTop: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, color: s(d.calendarTimeAxisFontColor, isDark ? '#fff' : '#000'), display: 'flex', fontFamily: s(d.calendarTimeAxisFont, 'inherit'), fontSize: px(d.calendarTimeAxisFontSize, 12), gridColumn: 1, gridRow: slot + 2, justifyContent: 'flex-end', padding: '1px 4px' }}>{showLabel ? formatCalendarTime(minute, timeFormat, locale) : ''}</div>{gridDays.map(({ iso }, dayIndex) => <div key={`${iso}-${minute}`} style={{ background: s(d.calendarDayBackgroundColor, 'transparent'), borderLeft: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, borderTop: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, gridColumn: dayIndex + 2, gridRow: slot + 2 }} />)}</React.Fragment>;
            })}
            {gridDays.flatMap(({ iso }, dayIndex) => source.filter(event => s(event.start).slice(0, 10) <= iso && s(event.end || event.start).slice(0, 10) >= iso).map((event, eventIndex) => {
                const startMinute = eventMinutes(event.start, firstMinute);
                const finishMinute = Math.max(startMinute + intervalMinutes, eventMinutes(event.end, startMinute + intervalMinutes));
                if (finishMinute <= firstMinute || startMinute >= endMinute) return null;
                const visibleStart = Math.max(startMinute, firstMinute);
                const visibleFinish = Math.min(finishMinute, endMinute);
                const row = Math.max(0, Math.floor((visibleStart - firstMinute) / intervalMinutes));
                const span = Math.max(1, Math.ceil((visibleFinish - visibleStart) / intervalMinutes));
                return <div key={`event-${iso}-${eventIndex}`} style={{ alignSelf: 'stretch', background: s(event.color, '#44739e'), color: s(event.colorText, '#fff'), fontFamily: s(d.calendarEventFont, 'inherit'), fontSize: px(d.calendarEventFontSize, 12), gridColumn: dayIndex + 2, gridRow: `${row + 2} / span ${Math.min(span, slotCount - row)}`, margin: 1, minHeight: 0, overflow: 'hidden', padding: '1px 3px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', zIndex: 1 }}>{`${formatCalendarTime(startMinute, timeFormat, locale)} ${s(event.name)}`}</div>;
            }))}
        </div>;
        return <div className="materialdesign-widget materialdesign-calendar" style={{ background: isDark ? '#303030' : 'transparent', color: isDark ? '#fff' : '#000', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {b(d.controlShow, true) ? <div className="materialdesign-vuetify-calendar-control-container" style={{ display: 'flex', flex: '0 0 auto', gap: 2, justifyContent: s(d.controlPosition, 'stretch') === 'stretch' ? 'stretch' : s(d.controlPosition) === 'left' ? 'flex-start' : s(d.controlPosition) === 'right' ? 'flex-end' : 'center' }}>{control('Prev', 'calendar-arrow-left', () => move(-1))}{control('Today', 'calendar-today', () => { this.date = new Date(); this.forceUpdate(); })}{control('Month', 'calendar-month', () => setView('month'))}{control('Week', 'calendar-week', () => setView('week'))}{control('Day', 'calendar', () => setView('day'))}{control('Next', 'calendar-arrow-right', () => move(1))}</div> : null}
            {view === 'month' ? <div onTouchStart={event => { this.touchX = event.touches[0]?.clientX || 0; }} onTouchEnd={event => { const distance = (event.changedTouches[0]?.clientX || 0) - this.touchX; if (Math.abs(distance) > 30) move(distance < 0 ? 1 : -1); }} style={{ display: 'grid', flex: 1, gridAutoRows: 'minmax(0, 1fr)', gridTemplateColumns: calendarColumns === 8 ? '24px repeat(7, minmax(0, 1fr))' : `repeat(${calendarColumns}, minmax(0, 1fr))`, gridTemplateRows: view === 'month' ? 'auto' : undefined, minHeight: 0 }}>
                {view !== 'day' ? <>{b(d.calendarWeeksNumbersShow, true) && view === 'month' ? <div style={{ background: s(d.calendarHeaderBackground, 'transparent'), border: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}` }} /> : null}{order.map(day => <div key={day} style={{ background: s(d.calendarHeaderBackground, 'transparent'), border: `1px solid ${s(d.calendarBorderColor, '#e0e0e0')}`, color: s(d.calendarDayLabelFontColor, 'rgba(0,0,0,.38)'), fontFamily: s(d.calendarDayLabelFontFamily, 'inherit'), fontSize: px(d.calendarDayLabelFontSize, 12), overflow: 'hidden', padding: 4, textAlign: 'center', textTransform: 'uppercase' }}>{(() => { const hf = s(d.calendarMonthViewHeaderFormat); const dt = new Date(2024, 0, day || 7); return hf ? formatMoment(dt, hf, locale) : new Intl.DateTimeFormat(undefined, { weekday: b(d.calendarShortWeekdays) ? 'short' : 'long' }).format(dt); })()}</div>)}</> : null}
                {cells}
            </div> : timeGrid}
        </div>;
    }
}
