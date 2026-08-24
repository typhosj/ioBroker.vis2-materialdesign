// The bookkeeping the auto-fill ownership model runs on, split out of `deviceFill` so that
// `widgetUtils` can mark a custom field as touched without importing the editor helper back into
// the runtime chunk (the two would otherwise import each other).

import type { WidgetData } from '@iobroker/types-vis-2';

/** Fields the user edited: the automation keeps its hands off them. */
export const TOUCHED_KEY = 'autoFillTouched';
/** Fields the automation wrote: it may write them again. */
export const OWNED_KEY = 'autoFillOwned';

export function names(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export function withNames(list: unknown, add: string[], remove: string[] = []): string[] {
    const set = new Set(names(list));
    for (const entry of remove) {
        set.delete(entry);
    }
    for (const entry of add) {
        set.add(entry);
    }
    return [...set];
}

/** Records that the user edited this field, so the automation keeps its hands off it. */
export function markTouchedIn(data: WidgetData, key: string): WidgetData {
    return {
        ...data,
        [TOUCHED_KEY]: withNames(data[TOUCHED_KEY], [key]),
        [OWNED_KEY]: withNames(data[OWNED_KEY], [], [key]),
    };
}

/**
 * The keys of `next` that differ from `data`. A `type:'custom'` field's `onDataChange` merges what
 * it gets into EVERY selected widget, so it must carry the changed keys only — handing it a whole
 * data object copies the first widget's every attribute onto all the others.
 */
export function changedKeys(next: WidgetData, data: WidgetData): WidgetData {
    const delta: Record<string, unknown> = {};
    const before = data as Record<string, unknown>;
    for (const [key, value] of Object.entries(next)) {
        if (value !== before[key]) {
            delta[key] = value;
        }
    }
    return delta;
}
