import React from 'react';

export interface SegmentOption<T extends string> { value: T; label: string; icon?: string }

export function SegmentedButton<T extends string>({ label, options, value, onChange }: { label: string; options: SegmentOption<T>[]; value: T; onChange(value: T): void }): React.JSX.Element {
    return (
        <div aria-label={label} className="g-segmented" role="group">
            {options.map(o => (
                <button aria-pressed={o.value === value} key={o.value} onClick={() => onChange(o.value)} type="button">
                    {o.value === value ? <span aria-hidden="true" className="mdi mdi-check" /> : o.icon ? <span aria-hidden="true" className={`mdi mdi-${o.icon}`} /> : null}
                    {o.label}
                </button>
            ))}
        </div>
    );
}
