import React, { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, onClose: () => void): React.RefObject<HTMLDivElement | null> {
    const ref = useRef<HTMLDivElement>(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        if (!active) return;
        const opener = document.activeElement as HTMLElement | null;
        const node = ref.current;
        (node?.querySelector<HTMLElement>(FOCUSABLE) ?? node)?.focus();
        const onKey = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') { event.preventDefault(); close.current(); return; }
            if (event.key !== 'Tab' || !node) return;
            const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
            if (!items.length) return;
            const first = items[0]; const last = items[items.length - 1];
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        };
        node?.addEventListener('keydown', onKey);
        return () => { node?.removeEventListener('keydown', onKey); opener?.focus?.(); };
    }, [active]);
    return ref;
}

export function Sheet({ label, open, modal, side, onClose, closeLabel, children }: { label: string; closeLabel?: string; open: boolean; modal: boolean; side: 'end' | 'bottom'; onClose(): void; children: React.ReactNode }): React.JSX.Element | null {
    const ref = useFocusTrap(open && modal, onClose);
    if (!open) return null;
    if (!modal) return <aside aria-label={label} className={`g-sheet g-sheet-${side} g-sheet-fixed`}>{children}</aside>;
    return (
        <>
            <div className="g-scrim" onClick={onClose} />
            <div aria-label={label} aria-modal="true" className={`g-sheet g-sheet-${side}`} ref={ref} role="dialog" tabIndex={-1}>
                <button aria-label={closeLabel ?? label} className="g-sheet-close mdi mdi-close" onClick={onClose} type="button" />
                {children}
            </div>
        </>
    );
}
