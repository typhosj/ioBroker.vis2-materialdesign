import React from 'react';

import { useFocusTrap } from './Sheet';

export interface NavItem { href: string; label: string; icon: string; current: boolean }
export interface NavSection { label?: string; items: NavItem[] }

export function NavDrawer({ label, sections, modal, open, onClose, footer, header }: { label: string; sections: NavSection[]; modal: boolean; open: boolean; onClose(): void; footer?: React.ReactNode; header?: React.ReactNode }): React.JSX.Element | null {
    const ref = useFocusTrap(modal && open, onClose);
    if (modal && !open) return null;
    const nav = (
        <nav aria-label={label} className="g-drawer">
            {header}
            {sections.map((s, i) => (
                <div className="g-drawer-section" key={s.label ?? i}>
                    {s.label ? <div className="g-drawer-headline">{s.label}</div> : null}
                    {s.items.map(item => (
                        <a aria-current={item.current ? 'page' : undefined} className="g-drawer-item" href={item.href} key={item.href} onClick={modal ? onClose : undefined}>
                            <span aria-hidden="true" className={`mdi mdi-${item.icon}`} />{item.label}
                        </a>
                    ))}
                </div>
            ))}
            {footer ? <div className="g-drawer-footer">{footer}</div> : null}
        </nav>
    );
    if (!modal) return nav;
    return <><div className="g-scrim" onClick={onClose} /><div aria-label={label} aria-modal="true" className="g-drawer-modal" ref={ref} role="dialog" tabIndex={-1}>{nav}</div></>;
}
