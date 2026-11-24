import React, { useRef } from 'react';

export interface ChipOption { id: string; label: string; badge?: string }

export function FilterChips({ label, options, value, onChange }: { label: string; options: ChipOption[]; value: string; onChange(id: string): void }): React.JSX.Element {
    const refs = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = Math.max(0, options.findIndex(o => o.id === value));
    const select = (index: number): void => {
        const next = (index + options.length) % options.length;
        onChange(options[next].id);
        refs.current[next]?.focus();
    };
    const onKeyDown = (event: React.KeyboardEvent, index: number): void => {
        const moves: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: options.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        select(moves[event.key]);
    };
    return (
        <div aria-label={label} className="g-chips" role="radiogroup">
            {options.map((o, i) => (
                <button aria-checked={i === selected && o.id === value} className="g-chip" data-id={o.id} key={o.id} onClick={() => select(i)} onKeyDown={e => onKeyDown(e, i)} ref={el => { refs.current[i] = el; }} role="radio" tabIndex={i === selected ? 0 : -1} type="button">
                    {i === selected && o.id === value ? <span aria-hidden="true" className="mdi mdi-check" /> : null}
                    {o.label}
                    {o.badge ? <span className="g-chip-badge">{o.badge}</span> : null}
                </button>
            ))}
        </div>
    );
}
