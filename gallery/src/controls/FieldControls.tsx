import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import React from 'react';

import { translate } from '../runtime/i18n';
import { type ControlKind, coerce, controlKind, selectOptions, visibleGroups } from './fields';

interface Props { info: RxWidgetInfo; data: Record<string, unknown>; ids: string[]; views: string[]; onChange(key: string, value: unknown): void }

export function FieldControls({ info, data, ids, views, onChange }: Props): React.JSX.Element {
    const input = (key: string, kind: ControlKind, field: Parameters<typeof selectOptions>[0]): React.ReactNode => {
        const value = data[key];
        const text = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
        const set = (raw: string | boolean): void => onChange(key, coerce(kind, raw));
        const f = field as { min?: number; max?: number; step?: number };
        switch (kind) {
            case 'checkbox': return <input checked={!!value && value !== 'false'} onChange={e => set(e.target.checked)} type="checkbox" />;
            case 'number': return <input max={f.max} min={f.min} onChange={e => set(e.target.value)} step={f.step ?? 'any'} type="number" value={text} />;
            case 'range': return <span className="g-range"><input max={f.max ?? 100} min={f.min ?? 0} onChange={e => set(e.target.value)} step={f.step ?? 1} type="range" value={text || 0} /><output>{text}</output></span>;
            case 'select': return <select onChange={e => set(e.target.value)} value={text}>{selectOptions(field).map(o => <option key={o.value} value={o.value}>{translate(o.label)}</option>)}</select>;
            case 'color': return <span className="g-color"><input onChange={e => set(e.target.value)} type="color" value={/^#[0-9a-f]{6}$/i.test(text) ? text : '#000000'} /><input aria-label={translate((field as { label?: string }).label ?? key)} onChange={e => set(e.target.value)} type="text" value={text} /></span>;
            case 'textarea': return <textarea onChange={e => set(e.target.value)} rows={3} value={text} />;
            case 'id': return <><input list="g-ids" onChange={e => set(e.target.value)} type="text" value={text} /></>;
            case 'view': return <select onChange={e => set(e.target.value)} value={text}><option value="" />{views.map(v => <option key={v} value={v}>{v}</option>)}</select>;
            case 'fixed': return <input disabled type="text" value={text} />;
            default: return <input onChange={e => set(e.target.value)} type="text" value={text} />;
        }
    };
    return (
        <form className="g-controls" onSubmit={e => e.preventDefault()}>
            <datalist id="g-ids">{ids.map(id => <option key={id} value={id} />)}</datalist>
            {visibleGroups(info, data).map(group => (
                <details key={`${group.name}-${group.index ?? ''}`} open={group.name === 'common'}>
                    <summary>{translate(group.label)}{group.index !== undefined ? ` ${group.index}` : ''}</summary>
                    {group.fields.map(({ key, field }) => (
                        <label key={key}>
                            <span>{translate((field as { label?: string }).label ?? key)}</span>
                            {input(key, controlKind(field), field)}
                        </label>
                    ))}
                </details>
            ))}
        </form>
    );
}
