import type { RxWidgetInfo, RxWidgetInfoAttributesField, RxWidgetInfoGroup } from '@iobroker/types-vis-2';

export const MAX_GROUP_ENTRIES = 100;

export interface ExpandedField { key: string; field: RxWidgetInfoAttributesField; group: RxWidgetInfoGroup; index?: number }

type Predicate = (data: Record<string, unknown>, index?: number) => boolean;

export function fieldName(field: RxWidgetInfoAttributesField): string | undefined {
    const name = (field as { name?: unknown }).name;
    return typeof name === 'string' && name ? name : undefined;
}

export function groupIndices(group: RxWidgetInfoGroup, data: Record<string, unknown>): Array<number | undefined> {
    if (!group.indexTo) return [undefined];
    const from = group.indexFrom ?? 0;
    const raw = Number(data[group.indexTo]);
    const to = Number.isFinite(raw) ? Math.min(Math.floor(raw), from + MAX_GROUP_ENTRIES) : from;
    const out: number[] = [];
    for (let index = from; index <= to; index++) out.push(index);
    return out;
}

export function expandFields(info: RxWidgetInfo, data: Record<string, unknown>): ExpandedField[] {
    return info.visAttrs.flatMap(group => groupIndices(group, data).flatMap(index => group.fields.flatMap(field => {
        const name = fieldName(field);
        return name ? [{ key: index === undefined ? name : `${name}${index}`, field, group, index }] : [];
    })));
}

export function defaultData(info: RxWidgetInfo): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const group of info.visAttrs.filter(g => !g.indexTo)) {
        for (const field of group.fields) {
            const name = fieldName(field);
            const value = (field as { default?: unknown }).default;
            if (name && value !== undefined) data[name] = value;
        }
    }
    for (const { key, field, index } of expandFields(info, data)) {
        const value = (field as { default?: unknown }).default;
        if (index !== undefined && value !== undefined && !(key in data)) data[key] = value;
    }
    return data;
}

export function subscribedIds(info: RxWidgetInfo, data: Record<string, unknown>): string[] {
    const ids = expandFields(info, data)
        .filter(entry => (entry.field as { type?: string }).type === 'id')
        .map(entry => data[entry.key])
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '' && value !== 'nothing_selected');
    return [...new Set(ids)];
}

// Known limit: the string form of `hidden` is an editor-only expression; it counts as visible here.
export function isHidden(entry: ExpandedField, data: Record<string, unknown>): boolean {
    const check = (predicate: unknown): boolean => {
        if (typeof predicate !== 'function') return false;
        try {
            return !!(predicate as Predicate)(data, entry.index);
        } catch {
            return false;
        }
    };
    return check(entry.group.hidden) || check((entry.field as { hidden?: unknown }).hidden);
}
