import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import DatePicker from './MaterialDesignDatePicker';
import TimeDial from './MaterialDesignTimeDial';
import { type DateParts, type PickerSpec, weekStart } from './pickerFormat';
import { VisWidget, wrapTabFocus } from './widgetUtils';

export interface PickerColors {
    background: string;
    accent: string;
    text: string;
    onAccent: string;
}

export interface PickerDialogProps {
    spec: PickerSpec;
    initialValue: string;
    colors: PickerColors;
    dark: boolean;
    fontFamily?: string;
    today: DateParts;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

// Day buttons outside the roving focus carry tabindex -1 and must not count as Tab stops.
const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

const actionButton: React.CSSProperties = {
    background: 'transparent',
    border: 0,
    borderRadius: 20,
    color: 'var(--mdw-picker-accent)',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 14,
    fontWeight: 500,
    minHeight: 48,
    minWidth: 64,
    padding: '0 12px',
};

export default function PickerDialog(props: PickerDialogProps): React.ReactPortal {
    const { spec, initialValue, colors, dark, fontFamily, today, onConfirm, onCancel } = props;
    const [draft, setDraft] = useState(initialValue);
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const pressedOnScrim = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        (dialog?.querySelector<HTMLElement>('[data-autofocus="true"]') ?? dialog?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    }, []);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Escape') {
            // Stop here, or a surrounding vis dialog closes on the same key.
            event.preventDefault();
            event.stopPropagation();
            onCancel();
            return;
        }
        wrapTabFocus(event, Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)));
    };

    return createPortal(
        <div
            className={`materialdesign-widget mdw-style-material3${dark ? ' mdw-dark' : ''} mdw-picker-scrim`}
            // Cancel on the click, not on pointerdown: unmounting at pointerdown sends the touch's
            // compatibility click to whatever lies underneath (e.g. the vis dialog overlay). The press
            // must also start on the scrim, so a dial drag that ends over it does not cancel.
            onClick={event => {
                if (pressedOnScrim.current && event.target === event.currentTarget) {
                    onCancel();
                }
            }}
            onPointerDown={event => {
                pressedOnScrim.current = event.target === event.currentTarget;
            }}
            style={{
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.32)',
                display: 'flex',
                inset: 0,
                justifyContent: 'center',
                position: 'fixed',
                // Above the vis Dialog widgets (z-index 202 by default) and their overlay.
                zIndex: 10000,
            }}
        >
            <div
                aria-labelledby={titleId}
                aria-modal="true"
                onKeyDown={onKeyDown}
                ref={dialogRef}
                role="dialog"
                style={
                    {
                        '--mdw-picker-bg': colors.background,
                        '--mdw-picker-accent': colors.accent,
                        '--mdw-picker-text': colors.text,
                        '--mdw-picker-on-accent': colors.onAccent,
                        background: 'var(--mdw-picker-bg)',
                        borderRadius: 28,
                        boxShadow: '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3)',
                        boxSizing: 'border-box',
                        color: 'var(--mdw-picker-text)',
                        fontFamily: fontFamily || undefined,
                        maxHeight: 'calc(100vh - 32px)',
                        maxWidth: 'calc(100vw - 32px)',
                        outline: 'none',
                        overflow: 'auto',
                        padding: '16px 12px 8px',
                    } as React.CSSProperties
                }
                // A click on non-focusable content focuses the dialog itself instead of <body>, so
                // Escape and the Tab trap keep working.
                tabIndex={-1}
            >
                <div id={titleId} style={{ fontSize: 14, padding: '0 12px 12px' }}>
                    {VisWidget.t(spec.kind === 'date' ? 'pickerSelectDate' : 'pickerSelectTime')}
                </div>
                {spec.kind === 'date' ? (
                    <DatePicker locale={spec.locale} onChange={setDraft} today={today} value={draft} weekStartDay={weekStart(spec.locale)} />
                ) : (
                    <TimeDial hour12={spec.hour12} onChange={setDraft} value={draft} />
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button onClick={onCancel} style={actionButton} type="button">
                        {VisWidget.t('pickerCancel')}
                    </button>
                    <button onClick={() => onConfirm(draft)} style={actionButton} type="button">
                        {VisWidget.t('pickerOk')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
