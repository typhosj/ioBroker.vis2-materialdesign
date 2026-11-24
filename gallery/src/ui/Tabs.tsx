import React, { useRef, useState } from 'react';

export interface TabDef { id: string; label: string; panel: React.ReactNode }

export function Tabs({ label, tabs, idPrefix }: { label: string; tabs: TabDef[]; idPrefix: string }): React.JSX.Element {
    const [active, setActive] = useState(0);
    const refs = useRef<Array<HTMLButtonElement | null>>([]);
    const go = (index: number): void => { const next = (index + tabs.length) % tabs.length; setActive(next); refs.current[next]?.focus(); };
    return (
        <div className="g-tabs">
            <div aria-label={label} className="g-tablist" role="tablist">
                {tabs.map((t, i) => (
                    <button aria-controls={`${idPrefix}-panel-${t.id}`} aria-selected={i === active} id={`${idPrefix}-tab-${t.id}`} key={t.id} onClick={() => setActive(i)}
                        onKeyDown={e => { const m: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }; if (e.key in m) { e.preventDefault(); go(m[e.key]); } }}
                        ref={el => { refs.current[i] = el; }} role="tab" tabIndex={i === active ? 0 : -1} type="button">{t.label}</button>
                ))}
            </div>
            {tabs.map((t, i) => <div aria-labelledby={`${idPrefix}-tab-${t.id}`} hidden={i !== active} id={`${idPrefix}-panel-${t.id}`} key={t.id} role="tabpanel" tabIndex={0}>{t.panel}</div>)}
        </div>
    );
}
