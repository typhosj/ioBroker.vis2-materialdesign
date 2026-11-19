import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { renderIcon } from './MaterialDesignButtons';
import { keyLook } from './keyLook';
import type { Pin } from './widgetLock';
import { VisWidget } from './widgetUtils';

export interface PinPadProps { pin: Pin; m3: boolean; dark: boolean; onUnlock: (pin: string) => void; onCancel: () => void }

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'delete'];
const SHAKE = '@keyframes mdw-pin-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';

export default function PinPad({ pin, m3, dark, onUnlock, onCancel }: PinPadProps): React.ReactPortal {
    const [digits, setDigits] = useState('');
    const [wrong, setWrong] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const ready = pin.kind === 'pin';
    const length = ready ? pin.pin.length : 4;
    const look = keyLook({}, m3, dark);

    useEffect(() => { dialogRef.current?.focus(); }, []);

    const add = (digit: string): void => {
        if (!ready) return;
        const next = digits + digit;
        if (next.length < length) { setDigits(next); setWrong(false); return; }
        if (next === pin.pin) { onUnlock(pin.pin); return; }
        setDigits('');
        setWrong(true);
    };
    const remove = (): void => { if (ready) setDigits(digits.slice(0, -1)); };
    const press = (key: string): void => {
        if (key === 'cancel') onCancel();
        else if (key === 'delete') remove();
        else add(key);
    };

    return createPortal(
        <div
            className={`materialdesign-widget${m3 ? ' mdw-style-material3' : ''}${dark ? ' mdw-dark' : ''} mdw-pin-scrim`}
            style={{ alignItems: 'center', background: 'rgba(0, 0, 0, 0.32)', display: 'flex', inset: 0, justifyContent: 'center', position: 'fixed', zIndex: 10000 }}
        >
            <style>{SHAKE}</style>
            <div
                aria-label={VisWidget.t('pinPadTitle')}
                aria-modal="true"
                data-pin-wrong={wrong ? 'true' : undefined}
                onKeyDown={event => {
                    if (/^\d$/.test(event.key)) add(event.key);
                    else if (event.key === 'Backspace') remove();
                    else if (event.key === 'Escape') onCancel();
                    else return;
                    // Stop here, or a surrounding vis dialog reacts to the same key.
                    event.preventDefault();
                    event.stopPropagation();
                }}
                ref={dialogRef}
                role="dialog"
                style={{ animation: wrong ? 'mdw-pin-shake 0.3s' : undefined, background: look.background, borderRadius: m3 ? 28 : 8, boxShadow: '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3)', color: look.text, outline: 'none', padding: 16, width: 264 }}
                tabIndex={-1}
            >
                <div style={{ fontSize: 16, marginBottom: 12, textAlign: 'center' }}>{VisWidget.t(ready ? 'pinPadTitle' : 'pinPadNotSetUp')}</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, minHeight: 12 }}>
                    {ready ? Array.from({ length }, (_, i) => (
                        <span data-filled={i < digits.length ? 'true' : 'false'} data-pin-dot="" key={i} style={{ border: `2px solid ${look.text}`, borderRadius: '50%', boxSizing: 'border-box', height: 12, width: 12, background: i < digits.length ? look.text : 'transparent' }} />
                    )) : null}
                </div>
                <div style={{ display: 'grid', gap: look.gap, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {KEYS.map(key => (
                        <button
                            aria-label={key === 'delete' ? VisWidget.t('ariaPinDelete') : undefined}
                            data-pin-key={key}
                            disabled={!ready && key !== 'cancel'}
                            key={key}
                            onClick={() => press(key)}
                            style={{ background: /^\d$/.test(key) ? look.key : look.special, border: 0, borderRadius: look.radius, color: look.text, fontSize: key === 'cancel' ? 14 : look.fontSize, height: 52, opacity: !ready && key !== 'cancel' ? 0.38 : 1, touchAction: 'manipulation', userSelect: 'none' }}
                            tabIndex={-1}
                            type="button"
                        >
                            {key === 'delete' ? renderIcon('backspace-outline', look.text, look.fontSize * 1.2) : key === 'cancel' ? VisWidget.t('pinPadCancel') : key}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
}
