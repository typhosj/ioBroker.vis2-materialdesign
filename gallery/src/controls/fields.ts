import type { RxWidgetInfo, RxWidgetInfoAttributesField } from '@iobroker/types-vis-2';

import { type ExpandedField, expandFields, fieldName, groupIndices, isHidden } from '../runtime/widgetInfo';

export type ControlKind = 'checkbox' | 'number' | 'range' | 'select' | 'color' | 'text' | 'textarea' | 'id' | 'view' | 'fixed' | 'none';

const KINDS: Record<string, ControlKind> = {
    checkbox: 'checkbox', number: 'number', slider: 'range', select: 'select', color: 'color',
    html: 'textarea', id: 'id', views: 'view', history: 'fixed', help: 'none', delimiter: 'none',
};

export function controlKind(field: RxWidgetInfoAttributesField): ControlKind {
    if (fieldName(field)?.startsWith('__mdwTheme')) return 'none';
    return KINDS[(field as { type?: string }).type ?? ''] ?? 'text';
}

export function coerce(kind: ControlKind, raw: string | boolean): unknown {
    if (kind === 'checkbox') return !!raw;
    if (kind === 'number' || kind === 'range') {
        if (raw === '') return '';
        const value = Number(raw);
        return Number.isFinite(value) ? value : '';
    }
    return raw;
}

export function selectOptions(field: RxWidgetInfoAttributesField): Array<{ value: string; label: string }> {
    const options = (field as { options?: unknown }).options;
    if (!Array.isArray(options)) return [];
    return options.map(option => (typeof option === 'object' && option
        ? { value: String((option as { value: unknown }).value), label: String((option as { label?: unknown }).label ?? (option as { value: unknown }).value) }
        : { value: String(option), label: String(option) }));
}

export function visibleGroups(info: RxWidgetInfo, data: Record<string, unknown>): Array<{ name: string; label: string; index?: number; fields: ExpandedField[] }> {
    const all = expandFields(info, data);
    return info.visAttrs.flatMap(group => groupIndices(group, data).map(index => ({
        name: group.name,
        label: group.label ?? `group_${group.name}`,
        index,
        fields: all.filter(e => e.group === group && e.index === index && controlKind(e.field) !== 'none' && !isHidden(e, data)),
    }))).filter(group => group.fields.length);
}
