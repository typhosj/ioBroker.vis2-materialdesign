import React, { useEffect, useRef, useState } from 'react';

import { type DateParts, daysInMonth, parseIsoDate, toIsoDate } from './pickerFormat';
import { VisWidget } from './widgetUtils';

export interface DatePickerProps {
    /** Selected date as `YYYY-MM-DD`. */
    value: string;
    locale: string;
    /** First day of the week, 0 = Sunday … 6 = Saturday. */
    weekStartDay: number;
    today: DateParts;
    onChange: (value: string) => void;
}

const CELL = 48;
// Known limit: the year list offers 1900-2100; typing still accepts any year 1-9999.
const FIRST_YEAR = 1900;
const LAST_YEAR = 2100;

// UTC with setUTCFullYear, so years below 100 are not mapped to 19xx and no time zone shifts a day.
function utcDate(p: DateParts): Date {
    const date = new Date(Date.UTC(2000, 0, 1));
    date.setUTCFullYear(p.year, p.month - 1, p.day);
    return date;
}

function fromUtc(date: Date): DateParts {
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addDays(p: DateParts, days: number): DateParts {
    const date = utcDate(p);
    date.setUTCDate(date.getUTCDate() + days);
    return fromUtc(date);
}

function addMonths(p: DateParts, months: number): DateParts {
    const index = p.year * 12 + (p.month - 1) + months;
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    return { year, month, day: Math.min(p.day, daysInMonth(year, month)) };
}

function columnOf(p: DateParts, weekStartDay: number): number {
    return (utcDate(p).getUTCDay() - weekStartDay + 7) % 7;
}

export function monthGrid(year: number, month: number, weekStartDay: number): Array<Array<number | null>> {
    const cells: Array<number | null> = Array.from({ length: columnOf({ year, month, day: 1 }, weekStartDay) }, () => null);
    for (let day = 1; day <= daysInMonth(year, month); day++) {
        cells.push(day);
    }
    while (cells.length % 7) {
        cells.push(null);
    }
    const rows: Array<Array<number | null>> = [];
    for (let i = 0; i < cells.length; i += 7) {
        rows.push(cells.slice(i, i + 7));
    }
    return rows;
}

const plainButton: React.CSSProperties = {
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    justifyContent: 'center',
    minHeight: CELL,
    minWidth: CELL,
    padding: 0,
};

const cell: React.CSSProperties = { alignItems: 'center', display: 'flex', height: CELL, justifyContent: 'center', width: CELL };

export default function DatePicker({ value, locale, weekStartDay, today, onChange }: DatePickerProps): React.JSX.Element {
    const selected = parseIsoDate(value) ?? today;
    const [view, setView] = useState({ year: selected.year, month: selected.month });
    const [yearMode, setYearMode] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);
    const yearRef = useRef<HTMLDivElement>(null);
    const focusSelected = useRef(false);

    useEffect(() => {
        if (focusSelected.current) {
            focusSelected.current = false;
            gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${value}"]`)?.focus();
        }
    }, [value]);

    useEffect(() => {
        if (yearMode) {
            yearRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.scrollIntoView?.({ block: 'center' });
        }
    }, [yearMode]);

    const select = (p: DateParts, focus: boolean): void => {
        focusSelected.current = focus;
        setView({ year: p.year, month: p.month });
        onChange(toIsoDate(p));
    };

    const onGridKey = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        // After paging, the focused day (day 1 of the new month) is not the selected one; move from focus.
        const base = parseIsoDate((event.target as HTMLElement).getAttribute?.('data-iso')) ?? selected;
        const column = columnOf(base, weekStartDay);
        const moves: Record<string, () => DateParts> = {
            ArrowLeft: () => addDays(base, -1),
            ArrowRight: () => addDays(base, 1),
            ArrowUp: () => addDays(base, -7),
            ArrowDown: () => addDays(base, 7),
            PageUp: () => addMonths(base, -1),
            PageDown: () => addMonths(base, 1),
            Home: () => addDays(base, -column),
            End: () => addDays(base, 6 - column),
        };
        const move = moves[event.key];
        if (move) {
            event.preventDefault();
            select(move(), true);
        }
    };

    const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(utcDate({ ...view, day: 1 }));
    const heading = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(utcDate(selected));
    const narrowDay = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
    const longDay = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
    const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' });
    // 22 November 2026 is a Sunday; adding the week start gives the first column.
    const weekdays = Array.from({ length: 7 }, (_, i) => utcDate({ year: 2026, month: 11, day: 22 + ((weekStartDay + i) % 7) }));
    const inView = selected.year === view.year && selected.month === view.month;
    const page = (delta: number): void => {
        const next = addMonths({ ...view, day: 1 }, delta);
        setView({ year: next.year, month: next.month });
    };

    return (
        <div className="mdw-date-picker" style={{ width: CELL * 7 }}>
            <div style={{ fontSize: 32, lineHeight: '40px', padding: '0 12px 12px' }}>{heading}</div>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <button
                    aria-expanded={yearMode}
                    aria-label={`${monthLabel}, ${VisWidget.t('ariaChooseYear')}`}
                    onClick={() => setYearMode(!yearMode)}
                    style={{ ...plainButton, fontSize: 14, fontWeight: 500, padding: '0 12px' }}
                    type="button"
                >
                    {monthLabel} {yearMode ? '▴' : '▾'}
                </button>
                {yearMode ? null : (
                    <div style={{ display: 'flex' }}>
                        <button aria-label={VisWidget.t('ariaPreviousMonth')} onClick={() => page(-1)} style={{ ...plainButton, fontSize: 24 }} type="button">
                            ‹
                        </button>
                        <button aria-label={VisWidget.t('ariaNextMonth')} onClick={() => page(1)} style={{ ...plainButton, fontSize: 24 }} type="button">
                            ›
                        </button>
                    </div>
                )}
            </div>
            {yearMode ? (
                <div ref={yearRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxHeight: CELL * 6, overflowY: 'auto' }}>
                    {Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i).map(year => (
                        <button
                            aria-pressed={year === view.year}
                            key={year}
                            onClick={() => {
                                setView({ year, month: view.month });
                                setYearMode(false);
                            }}
                            style={{
                                ...plainButton,
                                background: year === view.year ? 'var(--mdw-picker-accent)' : 'transparent',
                                borderRadius: 24,
                                color: year === view.year ? 'var(--mdw-picker-on-accent)' : 'inherit',
                            }}
                            type="button"
                        >
                            {year}
                        </button>
                    ))}
                </div>
            ) : (
                <div aria-label={monthLabel} onKeyDown={onGridKey} ref={gridRef} role="grid">
                    <div role="row" style={{ display: 'flex' }}>
                        {weekdays.map(day => (
                            <div aria-label={longDay.format(day)} key={day.toISOString()} role="columnheader" style={{ ...cell, fontSize: 12, opacity: 0.8 }}>
                                {narrowDay.format(day)}
                            </div>
                        ))}
                    </div>
                    {monthGrid(view.year, view.month, weekStartDay).map((row, r) => (
                        <div key={r} role="row" style={{ display: 'flex' }}>
                            {row.map((day, c) => {
                                if (day === null) {
                                    return <div key={c} role="gridcell" style={cell} />;
                                }
                                const p = { year: view.year, month: view.month, day };
                                const iso = toIsoDate(p);
                                const isSelected = iso === value;
                                const isToday = p.year === today.year && p.month === today.month && p.day === today.day;
                                const focusable = inView ? isSelected : day === 1;
                                return (
                                    <div aria-selected={isSelected} key={c} role="gridcell" style={cell}>
                                        <button
                                            aria-current={isToday ? 'date' : undefined}
                                            aria-label={fullDate.format(utcDate(p))}
                                            data-autofocus={focusable ? 'true' : undefined}
                                            data-iso={iso}
                                            onClick={() => select(p, false)}
                                            style={plainButton}
                                            tabIndex={focusable ? 0 : -1}
                                            type="button"
                                        >
                                            <span
                                                style={{
                                                    alignItems: 'center',
                                                    background: isSelected ? 'var(--mdw-picker-accent)' : 'transparent',
                                                    border: `1px solid ${isToday && !isSelected ? 'var(--mdw-picker-accent)' : 'transparent'}`,
                                                    borderRadius: '50%',
                                                    boxSizing: 'border-box',
                                                    color: isSelected ? 'var(--mdw-picker-on-accent)' : isToday ? 'var(--mdw-picker-accent)' : 'inherit',
                                                    display: 'flex',
                                                    fontSize: 14,
                                                    height: 40,
                                                    justifyContent: 'center',
                                                    width: 40,
                                                }}
                                            >
                                                {day}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
