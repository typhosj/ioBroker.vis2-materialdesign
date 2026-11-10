import React, { useRef, useState } from 'react';

import { formatTime, pad, parseIsoTime, toIsoTime } from './pickerFormat';
import { DIAL_CENTER, DIAL_SIZE, INNER_RADIUS, OUTER_RADIUS, dialPoint, hourFromPoint, hourPlace, minuteFromPoint } from './timeDialGeometry';
import { VisWidget } from './widgetUtils';

export interface TimeDialProps {
    /** Time as `HH:MM`, 24 h. */
    value: string;
    hour12: boolean;
    onChange: (value: string) => void;
}

const srOnly: React.CSSProperties = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
};

function partStyle(active: boolean): React.CSSProperties {
    return {
        background: active ? 'var(--mdw-picker-accent)' : 'transparent',
        border: active ? 0 : '1px solid currentColor',
        borderRadius: 8,
        color: active ? 'var(--mdw-picker-on-accent)' : 'inherit',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 44,
        height: 72,
        padding: 0,
        width: 88,
    };
}

function periodStyle(active: boolean): React.CSSProperties {
    return {
        background: active ? 'var(--mdw-picker-accent)' : 'transparent',
        border: '1px solid currentColor',
        color: active ? 'var(--mdw-picker-on-accent)' : 'inherit',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 14,
        height: 48,
        padding: 0,
        width: 52,
    };
}

interface Label {
    text: string;
    x: number;
    y: number;
    selected: boolean;
    small: boolean;
}

export default function TimeDial({ value, hour12, onChange }: TimeDialProps): React.JSX.Element {
    const time = parseIsoTime(value) ?? { hour: 0, minute: 0 };
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');
    const dragging = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const pm = time.hour >= 12;
    const hourText = hour12 ? pad(time.hour % 12 || 12) : pad(time.hour);

    const setHour = (hour: number): void => onChange(toIsoTime(hour, time.minute));
    const setMinute = (minute: number): void => onChange(toIsoTime(time.hour, minute));

    const pick = (event: React.PointerEvent<SVGSVGElement>): void => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || !rect.width) {
            return;
        }
        const scale = DIAL_SIZE / rect.width;
        const dx = (event.clientX - rect.left) * scale - DIAL_CENTER;
        const dy = (event.clientY - rect.top) * scale - DIAL_CENTER;
        if (mode === 'minute') {
            setMinute(minuteFromPoint(dx, dy));
            return;
        }
        const hour = hourFromPoint(dx, dy, hour12);
        setHour(hour12 ? (hour % 12) + (pm ? 12 : 0) : hour);
    };

    const onKey = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        const delta = event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? -1 : 0;
        if (delta) {
            event.preventDefault();
            if (mode === 'hour') {
                setHour((time.hour + delta + 24) % 24);
            } else {
                setMinute((time.minute + delta + 60) % 60);
            }
        }
    };

    const place = mode === 'minute' ? { index: time.minute, steps: 60, radius: OUTER_RADIUS } : { ...hourPlace(time.hour, hour12), steps: 12 };
    const hand = dialPoint(place.index, place.steps, place.radius);
    const labels: Label[] = [];
    for (let i = 0; i < 12; i++) {
        const outer = dialPoint(i, 12, OUTER_RADIUS);
        if (mode === 'minute') {
            labels.push({ text: pad(i * 5), ...outer, selected: i * 5 === time.minute, small: false });
            continue;
        }
        const outerHour = i === 0 ? 12 : i;
        labels.push({ text: String(outerHour), ...outer, selected: (hour12 ? time.hour % 12 || 12 : time.hour) === outerHour, small: false });
        if (!hour12) {
            const innerHour = i === 0 ? 0 : i + 12;
            labels.push({ text: pad(innerHour), ...dialPoint(i, 12, INNER_RADIUS), selected: time.hour === innerHour, small: true });
        }
    }
    const spoken = formatTime(toIsoTime(time.hour, time.minute), hour12) ?? '';

    return (
        <div className="mdw-time-dial">
            <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'center', padding: '0 12px 16px' }}>
                <button aria-label={VisWidget.t('pickerHour')} aria-pressed={mode === 'hour'} onClick={() => setMode('hour')} style={partStyle(mode === 'hour')} type="button">
                    {hourText}
                </button>
                <span aria-hidden="true" style={{ fontSize: 44 }}>
                    :
                </span>
                <button aria-label={VisWidget.t('pickerMinute')} aria-pressed={mode === 'minute'} onClick={() => setMode('minute')} style={partStyle(mode === 'minute')} type="button">
                    {pad(time.minute)}
                </button>
                {hour12 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
                        <button aria-pressed={!pm} onClick={() => pm && setHour(time.hour - 12)} style={{ ...periodStyle(!pm), borderRadius: '8px 8px 0 0' }} type="button">
                            AM
                        </button>
                        <button aria-pressed={pm} onClick={() => !pm && setHour(time.hour + 12)} style={{ ...periodStyle(pm), borderRadius: '0 0 8px 8px', borderTop: 0 }} type="button">
                            PM
                        </button>
                    </div>
                ) : null}
            </div>
            <div
                aria-label={VisWidget.t(mode === 'hour' ? 'pickerHour' : 'pickerMinute')}
                aria-valuemax={mode === 'hour' ? 23 : 59}
                aria-valuemin={0}
                aria-valuenow={mode === 'hour' ? time.hour : time.minute}
                aria-valuetext={spoken}
                data-autofocus="true"
                onKeyDown={onKey}
                role="slider"
                style={{ borderRadius: '50%', margin: '0 auto', maxWidth: '100%', width: DIAL_SIZE }}
                tabIndex={0}
            >
                <svg
                    aria-hidden="true"
                    height={DIAL_SIZE}
                    onPointerDown={event => {
                        dragging.current = true;
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        pick(event);
                    }}
                    onPointerMove={event => {
                        if (dragging.current) {
                            pick(event);
                        }
                    }}
                    onPointerCancel={() => {
                        dragging.current = false;
                    }}
                    onPointerUp={event => {
                        if (!dragging.current) {
                            return;
                        }
                        dragging.current = false;
                        pick(event);
                        if (mode === 'hour') {
                            setMode('minute');
                        }
                    }}
                    ref={svgRef}
                    style={{ cursor: 'pointer', display: 'block', maxWidth: '100%', touchAction: 'none' }}
                    viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
                    width={DIAL_SIZE}
                >
                    <circle cx={DIAL_CENTER} cy={DIAL_CENTER} fill="var(--mdw-picker-accent)" fillOpacity={0.12} r={DIAL_CENTER} />
                    <line stroke="var(--mdw-picker-accent)" strokeWidth={2} x1={DIAL_CENTER} x2={hand.x} y1={DIAL_CENTER} y2={hand.y} />
                    <circle cx={DIAL_CENTER} cy={DIAL_CENTER} fill="var(--mdw-picker-accent)" r={4} />
                    <circle cx={hand.x} cy={hand.y} fill="var(--mdw-picker-accent)" r={20} />
                    {labels.map(label => (
                        <text
                            dominantBaseline="central"
                            fill={label.selected ? 'var(--mdw-picker-on-accent)' : 'currentColor'}
                            fontSize={label.small ? 12 : 16}
                            key={`${label.text}-${label.small ? 'in' : 'out'}`}
                            textAnchor="middle"
                            x={label.x}
                            y={label.y}
                        >
                            {label.text}
                        </text>
                    ))}
                </svg>
            </div>
            <span aria-live="polite" style={srOnly}>
                {spoken}
            </span>
        </div>
    );
}
