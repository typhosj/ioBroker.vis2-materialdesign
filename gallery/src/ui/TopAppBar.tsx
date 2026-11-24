import React from 'react';

export function TopAppBar({ title, onMenu, menuLabel, actions }: { title: React.ReactNode; onMenu?(): void; menuLabel: string; actions: React.ReactNode }): React.JSX.Element {
    return (
        <header className="g-topbar">
            {onMenu ? <button aria-label={menuLabel} className="g-icon-button mdi mdi-menu" onClick={onMenu} type="button" /> : null}
            <div className="g-topbar-title">{title}</div>
            <div className="g-topbar-actions">{actions}</div>
        </header>
    );
}
