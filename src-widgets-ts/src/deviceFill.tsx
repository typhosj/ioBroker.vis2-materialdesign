// Editor-only helper: after the user picks a datapoint, a widget fills what the object's own
// metadata already says (label, unit, min/max/step, states) instead of asking for it field by
// field. See ../../../DEVICE_AUTOFILL_PLAN.md; issue #15.
//
// Ownership model: a field is written only while its value is not the user's. A value the user
// typed and an untouched default cannot be told apart by value alone, so two bookkeeping keys
// travel in the widget data: `autoFillTouched` (fields the user edited) and `autoFillOwned`
// (fields this module wrote). Both are plain data keys, not editor fields.

import React from 'react';

import type { RxWidgetInfo, RxWidgetInfoAttributesField, WidgetData } from '@iobroker/types-vis-2';

import { OWNED_KEY, TOUCHED_KEY, changedKeys, markTouchedIn, names, withNames } from './autoFillKeys';
import { VisWidget, visLocale } from './widgetUtils';

export { OWNED_KEY, TOUCHED_KEY, markTouchedIn };

export interface FillSource {
    /** the selected object */
    obj: ioBroker.StateObject;
    /** the channel/device above it */
    parent?: ioBroker.Object;
    /** the other states under the same parent */
    siblings: ioBroker.StateObject[];
    /** name of the `enum.rooms.*` the object or its parent belongs to */
    room?: string;
    /** name of the `enum.functions.*` the object or its parent belongs to */
    func?: string;
    /** the current value, read only for rules that ask for it (`needsValue`) */
    value?: ioBroker.StateValue;
}

/** The part of `LegacyConnection` this module uses (structural, so tests pass a plain object). */
export interface FillSocket {
    getObject(id: string): Promise<ioBroker.Object | null | undefined>;
    getObjectViewSystemCached?(
        type: 'state',
        start?: string,
        end?: string,
    ): Promise<Record<string, ioBroker.Object> | null | undefined>;
    getEnums?(name?: string, update?: boolean): Promise<Record<string, ioBroker.EnumObject> | null | undefined>;
    getState?(id: string): Promise<ioBroker.State | null | undefined>;
}

export type FillRule = {
    /** base name of the field to write (without the row index of a counted group) */
    target: string;
    from?: (src: FillSource) => unknown;
    /** further field names an `expand` writes, so they get the sentinel too */
    marks?: readonly string[];
    /** the rule reads the value, not only the metadata — costs one more socket call */
    needsValue?: boolean;
    /**
     * Writes several keys at once (menu entries, table columns). The returned keys are complete,
     * and each one passes the ownership rule on its own.
     */
    expand?: (src: FillSource) => Record<string, unknown>;
};

/** trigger field name -> what its selection fills */
export type FillMap = Record<string, readonly FillRule[]>;

type ChangeData = (newData: WidgetData) => void;

export type FieldChange = (
    field: RxWidgetInfoAttributesField,
    data: WidgetData,
    changeData: ChangeData,
    socket: FillSocket,
    index?: number,
) => Promise<void>;

/** The row suffix of a counted group: newer editors suffix `field.name`, older ones pass an index. */
export function rowSuffix(base: string, field: { name?: string; index?: number } | undefined, index?: number): string {
    const fieldName = field?.name ?? base;
    if (fieldName !== base && fieldName.startsWith(base)) {
        return fieldName.slice(base.length);
    }
    const row = field?.index ?? index;
    return row === undefined ? '' : String(row);
}

/** `common.name` can be a string or a language map. */
export function objectName(obj: ioBroker.Object | undefined, fallback = ''): string {
    const name = obj?.common?.name;
    if (typeof name === 'string') {
        return name;
    }
    if (name && typeof name === 'object') {
        const locale = (visLocale() || 'en').split('-')[0];
        const map = name as Record<string, string>;
        return map[locale] || map.en || Object.values(map)[0] || fallback;
    }
    return fallback;
}

/** `common.states` comes as a map, as an array or as the legacy `0:off;1:on` string. */
export function commonStates(obj: ioBroker.Object | undefined): Record<string, string> | undefined {
    const states = (obj?.common as { states?: unknown } | undefined)?.states;
    if (!states) {
        return undefined;
    }
    const out: Record<string, string> = {};
    if (typeof states === 'string') {
        for (const part of states.split(';')) {
            const at = part.indexOf(':');
            if (at > 0) {
                out[part.slice(0, at)] = part.slice(at + 1);
            }
        }
    } else if (Array.isArray(states)) {
        states.forEach((label, index) => (out[String(index)] = String(label)));
    } else if (typeof states === 'object') {
        for (const [key, label] of Object.entries(states as Record<string, unknown>)) {
            out[key] = String(label);
        }
    }
    return Object.keys(out).length ? out : undefined;
}

/** Decimals implied by `common.step` (0.1 -> 1, 0.01 -> 2). */
export function stepDecimals(step: unknown): number | undefined {
    if (typeof step !== 'number' || !Number.isFinite(step) || step <= 0) {
        return undefined;
    }
    const [mantissa, exponent] = String(step).toLowerCase().split('e');
    const dot = mantissa.indexOf('.');
    const digits = dot < 0 ? 0 : mantissa.length - dot - 1;
    return Math.max(0, digits - Number(exponent || 0));
}

// One enum read per minute of editing, not one per selection. A flat "once per session" would
// never show a room the user creates while the editor is open.
const ENUM_CACHE_MS = 60_000;
let enumCache: Promise<{ rooms: Record<string, ioBroker.EnumObject>; functions: Record<string, ioBroker.EnumObject> }> | null =
    null;
let enumCacheAt = 0;

export function resetEnumCache(): void {
    enumCache = null;
    enumCacheAt = 0;
}

async function readEnums(
    socket: FillSocket,
): Promise<{ rooms: Record<string, ioBroker.EnumObject>; functions: Record<string, ioBroker.EnumObject> }> {
    const getEnums = socket.getEnums?.bind(socket);
    if (!getEnums) {
        return { rooms: {}, functions: {} };
    }
    if (enumCache && Date.now() - enumCacheAt > ENUM_CACHE_MS) {
        enumCache = null;
    }
    enumCacheAt = enumCache ? enumCacheAt : Date.now();
    enumCache ??= (async () => {
        const [rooms, functions] = await Promise.all([
            getEnums('rooms').catch(() => null),
            getEnums('functions').catch(() => null),
        ]);
        // Caching a failed read would answer every later selection of the session with nothing.
        if (!rooms && !functions) {
            enumCache = null;
        }
        return { rooms: rooms || {}, functions: functions || {} };
    })();
    return enumCache;
}

function enumFor(enums: Record<string, ioBroker.EnumObject>, ids: string[]): string | undefined {
    for (const entry of Object.values(enums || {})) {
        const members = (entry?.common as { members?: string[] } | undefined)?.members || [];
        if (ids.some(id => members.includes(id))) {
            return objectName(entry) || undefined;
        }
    }
    return undefined;
}

/** Reads everything a fill rule may look at: one `getObject`, one cached state view, cached enums. */
export async function readSource(oid: string, socket: FillSocket, withValue = false): Promise<FillSource | null> {
    if (!oid || oid === 'nothing_selected') {
        return null;
    }
    const obj = await socket.getObject(oid).catch(() => null);
    if (!obj || obj.type !== 'state') {
        return null;
    }

    const parentId = oid.split('.').slice(0, -1).join('.');
    const parent = parentId ? ((await socket.getObject(parentId).catch(() => null)) ?? undefined) : undefined;

    let siblings: ioBroker.StateObject[] = [];
    const view = parentId
        ? await socket
              .getObjectViewSystemCached?.('state', `${parentId}.`, `${parentId}.香`)
              .catch(() => null)
        : null;
    if (view) {
        siblings = Object.entries(view)
            .filter(([id, entry]) => id !== oid && entry?.type === 'state')
            .map(([, entry]) => entry as ioBroker.StateObject);
    }

    const enums = await readEnums(socket);
    const ids = parentId ? [oid, parentId] : [oid];
    const state = withValue ? await socket.getState?.(oid).catch(() => null) : null;
    return {
        obj: obj,
        parent,
        siblings,
        room: enumFor(enums.rooms, ids),
        func: enumFor(enums.functions, ids),
        value: state?.val,
    };
}

/**
 * A vis binding ("{hm.0.living.ACTUAL}"). The editor's binding dialog writes it into the project
 * itself and never calls the field's `onChange` (WidgetBindingField.onChange), so no sentinel can
 * have been recorded for it - the value has to speak for itself.
 */
function looksLikeBinding(value: string): boolean {
    const open = value.indexOf('{');
    return open >= 0 && value.indexOf('}', open + 1) > open;
}

/** The row index behind a counted key ("label12" -> 12), or undefined when it is not one. */
function rowIndex(key: string, base: string): number | undefined {
    if (!key.startsWith(base) || key.length === base.length) {
        return undefined;
    }
    const tail = key.slice(base.length);
    for (const character of tail) {
        if (character < '0' || character > '9') {
            return undefined;
        }
    }
    return Number(tail);
}

/**
 * The rows an expand rule leaves behind when it lowers the count. The widget stops reading them,
 * but they would come back the moment the user raises the count again - and the menu it built from
 * `common.states` would carry entries of the object before it.
 */
function staleRows(rule: FillRule, written: Record<string, unknown>, data: WidgetData): string[] {
    const count = written[rule.target];
    if (typeof count !== 'number') {
        return [];
    }
    const bases = [...(rule.marks || [])];
    return Object.keys(data).filter(key => {
        const base = bases.find(entry => key.startsWith(entry));
        const index = base === undefined ? undefined : rowIndex(key, base);
        return index !== undefined && index >= count;
    });
}

/** A field may be written while its value is not the user's. The single place this is decided. */
export function overwritable(key: string, data: WidgetData, defaults: Record<string, unknown>, base = key): boolean {
    if (names(data[TOUCHED_KEY]).includes(key)) {
        return false;
    }
    const value = (data as Record<string, unknown>)[key];
    if (value === undefined || value === null || value === '') {
        return true;
    }
    if (names(data[OWNED_KEY]).includes(key)) {
        return true;
    }
    if (typeof value === 'string' && looksLikeBinding(value)) {
        return false;
    }
    return value === defaults[base];
}

/** Sentinel `onChange` for a field the automation may write. */
export function markTouched(base: string): FieldChange {
    return (field, data, changeData, _socket, index) => {
        changeData(markTouchedIn(data, `${base}${rowSuffix(base, field, index)}`));
        return Promise.resolve();
    };
}

function ruleValue(rule: FillRule, src: FillSource): unknown {
    try {
        return rule.from?.(src);
    } catch {
        return undefined;
    }
}

function expanded(rule: FillRule, src: FillSource): Record<string, unknown> {
    try {
        return rule.expand?.(src) || {};
    } catch {
        return {};
    }
}

/** The base name behind a written key (`label3` -> `label`), so the declared default still matches. */
function baseName(key: string): string {
    return key.replace(/\d+$/, '');
}

/** Applies the rules to `data` and returns the new data, or null when nothing was written. */
export function applyRules(
    rules: readonly FillRule[],
    src: FillSource,
    data: WidgetData,
    defaults: Record<string, unknown>,
    suffix = '',
    force = false,
): WidgetData | null {
    const written: string[] = [];
    const next: Record<string, unknown> = { ...data };
    const write = (key: string, value: unknown, base: string): void => {
        if (!force && !overwritable(key, data, defaults, base)) {
            return;
        }
        if (value === undefined || value === null || value === '' || next[key] === value) {
            return;
        }
        next[key] = value;
        written.push(key);
    };
    // A cleared key travels as null: the editor deletes it from the widget data, and a whole-data
    // write leaves an empty value behind - both read as "no entry".
    const clear = (key: string, base: string): void => {
        const current = (data as Record<string, unknown>)[key];
        if (current === undefined || current === null || current === '') {
            return;
        }
        if (!force && !overwritable(key, data, defaults, base)) {
            return;
        }
        next[key] = null;
        written.push(key);
    };
    for (const rule of rules) {
        if (rule.expand) {
            const out = expanded(rule, src);
            for (const [key, value] of Object.entries(out)) {
                write(key, value, baseName(key));
            }
            for (const key of staleRows(rule, out, data)) {
                clear(key, baseName(key));
            }
            continue;
        }
        write(`${rule.target}${suffix}`, ruleValue(rule, src), rule.target);
    }
    if (!written.length) {
        return null;
    }
    next[OWNED_KEY] = withNames(data[OWNED_KEY], written);
    if (force) {
        next[TOUCHED_KEY] = withNames(data[TOUCHED_KEY], [], written);
    }
    return next;
}

/** The fields a forced refill would overwrite — named in the confirmation before it runs. */
export function overwrittenBy(rules: readonly FillRule[], src: FillSource, data: WidgetData, suffix = ''): string[] {
    const hit: string[] = [];
    const check = (key: string, fresh: unknown): void => {
        const value = (data as Record<string, unknown>)[key];
        if (value === undefined || value === null || value === '') {
            return;
        }
        // null means "this one gets emptied"; anything else only counts when it differs.
        if (fresh === null || (fresh !== undefined && fresh !== '' && fresh !== value)) {
            hit.push(key);
        }
    };
    for (const rule of rules) {
        if (rule.expand) {
            const out = expanded(rule, src);
            for (const [key, fresh] of Object.entries(out)) {
                check(key, fresh);
            }
            // The rows the new count drops are emptied, which the user should be asked about too.
            for (const key of staleRows(rule, out, data)) {
                check(key, null);
            }
            continue;
        }
        check(`${rule.target}${suffix}`, ruleValue(rule, src));
    }
    return hit;
}

/** `onChange` for the trigger field: reads the object once and writes every free target field. */
export function autoFill(rules: readonly FillRule[], defaults: Record<string, unknown>): FieldChange {
    return async (field, data, changeData, socket, index) => {
        const base = (field?.name ?? '').replace(/\d+$/, '');
        if (!base) {
            return;
        }
        const suffix = rowSuffix(base, field, index);
        const oid = (data as Record<string, unknown>)[`${base}${suffix}`];
        if (typeof oid !== 'string' || !oid) {
            return;
        }
        const src = await readSource(oid, socket, rules.some(rule => rule.needsValue));
        if (!src) {
            return;
        }
        // Exactly one changeData() per trigger, bookkeeping keys included: the editor debounces it
        // by 100 ms and replaces the whole data object, so only the last call would survive.
        const next = applyRules(rules, src, data, defaults, suffix);
        if (next) {
            changeData(next);
        }
    };
}

function common(src: FillSource): Record<string, unknown> {
    return (src.obj.common || {}) as unknown as Record<string, unknown>;
}

// Last step of the icon cascade: what the role says, as a plain MDI name — the same shape the
// icon fields already store (see `iconField`). Kept short on purpose; an unknown role gets nothing,
// which is the normal case for the many adapters that only ever set `state`.
const ROLE_ICONS: Record<string, string> = {
    'value.temperature': 'thermometer',
    'level.temperature': 'thermostat',
    'value.humidity': 'water-percent',
    'value.brightness': 'brightness-5',
    'value.battery': 'battery',
    'value.power': 'flash',
    'value.power.consumption': 'flash',
    'level.dimmer': 'lightbulb-on',
    'level.blind': 'blinds',
    'level.volume': 'volume-high',
    'switch.light': 'lightbulb',
    'sensor.door': 'door',
    'sensor.window': 'window-closed',
    'sensor.motion': 'motion-sensor',
    'sensor.alarm': 'alert',
    'sensor.alarm.flood': 'water-alert',
    'sensor.alarm.fire': 'fire',
    'indicator.lowbat': 'battery-alert',
    'indicator.unreach': 'lan-disconnect',
    switch: 'toggle-switch',
    button: 'gesture-tap-button',
    date: 'calendar',
    media: 'play-circle',
};

/**
 * An object's `common.icon` that vis can actually load: a data URI, an absolute URL or a path from
 * the web root. Many adapters store a bare file name that only resolves inside their own admin
 * folder ("hm-rpc.png"); taken as it is, the widget renders a broken image, so it is dropped and
 * the role decides instead.
 */
function resolvableIcon(icon: unknown): string | undefined {
    if (typeof icon !== 'string' || !icon) {
        return undefined;
    }
    const lower = icon.toLowerCase();
    return lower.startsWith('data:') || lower.startsWith('http://') || lower.startsWith('https://') || icon[0] === '/'
        ? icon
        : undefined;
}

/** Role to MDI name: the exact role first, then its leading segments. */
export function roleIcon(role: unknown): string | undefined {
    if (typeof role !== 'string' || !role) {
        return undefined;
    }
    const parts = role.split('.');
    for (let length = parts.length; length > 0; length--) {
        const hit = ROLE_ICONS[parts.slice(0, length).join('.')];
        if (hit) {
            return hit;
        }
    }
    return undefined;
}

/** The cascades of the plan, as rule builders — a widget wires one line per field. */
export const fill = {
    /** `common.name`, else the parent channel's name, else the last ID segment. */
    name: (target: string): FillRule => ({
        target,
        from: src => objectName(src.obj) || objectName(src.parent) || src.obj._id?.split('.').pop(),
    }),
    unit: (target: string): FillRule => ({ target, from: src => common(src).unit }),
    min: (target: string): FillRule => ({ target, from: src => common(src).min }),
    max: (target: string): FillRule => ({ target, from: src => common(src).max }),
    step: (target: string): FillRule => ({ target, from: src => common(src).step }),
    /** Decimals the object's own `common.step` implies. */
    decimals: (target: string): FillRule => ({ target, from: src => stepDecimals(common(src).step) }),
    /** Only ever sets the flag: a writable object must not clear a box the user ticked. */
    readOnly: (target: string): FillRule => ({
        target,
        from: src => (common(src).write === false ? true : undefined),
    }),
    /** Text of the true/false state of a boolean object. */
    boolText: (target: string, on: boolean): FillRule => ({
        target,
        from: src => {
            if (common(src).type !== 'boolean') {
                return undefined;
            }
            const states = commonStates(src.obj);
            return states?.[on ? 'true' : 'false'] ?? states?.[on ? '1' : '0'];
        },
    }),
    /** `common.states` as the entries of a counted group, plus the count itself. */
    stateList: (countTarget: string, valueTarget: string, labelTarget: string): FillRule => ({
        target: countTarget,
        marks: [valueTarget, labelTarget],
        expand: src => {
            const entries = Object.entries(commonStates(src.obj) || {});
            if (!entries.length) {
                return {};
            }
            const out: Record<string, unknown> = { [countTarget]: entries.length };
            entries.forEach(([value, label], index) => {
                out[`${valueTarget}${index}`] = value;
                out[`${labelTarget}${index}`] = label;
            });
            return out;
        },
    }),
    /** The first state of `common.states` — what a state button sends. */
    firstState: (target: string): FillRule => ({
        target,
        from: src => Object.keys(commonStates(src.obj) || {})[0],
    }),
    /** 'boolean' for a boolean object, 'value' where two states carry the two values. */
    toggleType: (target: string): FillRule => ({
        target,
        from: src => {
            if (common(src).type === 'boolean') {
                return 'boolean';
            }
            return Object.keys(commonStates(src.obj) || {}).length === 2 ? 'value' : undefined;
        },
    }),
    /** The two switching values of a non-boolean object with exactly two states. */
    toggleValue: (target: string, on: boolean): FillRule => ({
        target,
        from: src => {
            if (common(src).type === 'boolean') {
                return undefined;
            }
            const keys = Object.keys(commonStates(src.obj) || {});
            return keys.length === 2 ? keys[on ? 1 : 0] : undefined;
        },
    }),
    /** Editor input type from `common.type`; a string object keeps the declared default. */
    inputType: (target: string): FillRule => ({
        target,
        from: src => (common(src).type === 'number' ? 'number' : undefined),
    }),
    /** The object's own icon, else the channel's, else what the role implies. */
    icon: (target: string): FillRule => ({
        target,
        from: src =>
            resolvableIcon(common(src).icon) ||
            resolvableIcon((src.parent?.common as { icon?: string } | undefined)?.icon) ||
            roleIcon(common(src).role),
    }),
    /** Room and function of the object, as one line ("Living room · Heating"). */
    place: (target: string): FillRule => ({
        target,
        from: src => [src.room, src.func].filter(Boolean).join(' · ') || undefined,
    }),
    /**
     * A state next to the selected one, matched on its role or on its last ID segment — the way
     * the upstream material widgets find the parts of a device that belong together.
     */
    sibling: (target: string, matches: readonly string[]): FillRule => ({
        target,
        from: src => {
            const wanted = matches.map(entry => entry.toLowerCase());
            const hit = src.siblings.find(entry => {
                const role = String((entry.common as { role?: string } | undefined)?.role || '').toLowerCase();
                const segment = (entry._id.split('.').pop() || '').toLowerCase();
                return wanted.includes(role) || wanted.includes(segment);
            });
            return hit?._id;
        },
    }),
    /**
     * The value as a BINDING plus the unit — the answer the forum thread gave by hand for the
     * right-hand column of a list row, and the only one that keeps following the state.
     */
    valueBinding: (target: string): FillRule => ({
        target,
        from: src => {
            const unit = common(src).unit;
            return `{${src.obj._id}}${typeof unit === 'string' && unit ? ` ${unit}` : ''}`;
        },
    }),
    /**
     * Columns of a JSON table: the keys of the first row, in the order the table reads them
     * (`Object.keys(row)[index]`), plus the column count.
     */
    jsonColumns: (countTarget: string, labelTarget: string): FillRule => ({
        target: countTarget,
        marks: [labelTarget],
        needsValue: true,
        expand: src => {
            let rows: unknown = src.value;
            if (typeof rows === 'string') {
                try {
                    rows = JSON.parse(rows);
                } catch {
                    return {};
                }
            }
            const first = Array.isArray(rows) ? rows[0] : rows;
            if (!first || typeof first !== 'object') {
                return {};
            }
            const keys = Object.keys(first as Record<string, unknown>);
            if (!keys.length) {
                return {};
            }
            const out: Record<string, unknown> = { [countTarget]: keys.length };
            keys.forEach((key, index) => (out[`${labelTarget}${index}`] = key));
            return out;
        },
    }),
};

/** Collects every declared default — the one source the ownership rule compares against. */
export function fieldDefaults(attrs: RxWidgetInfo['visAttrs']): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    for (const group of attrs || []) {
        for (const field of group.fields || []) {
            const declared = (field as { name?: string; default?: unknown }).default;
            if (field.name !== undefined && declared !== undefined) {
                defaults[field.name] = declared;
            }
        }
    }
    return defaults;
}

/**
 * The one new control of the whole feature: it ignores both bookkeeping lists, so it is also the
 * answer to a changed datapoint — the automation itself never writes over a user value.
 */
function refillField(
    base: string,
    rules: readonly FillRule[],
    defaults: Record<string, unknown>,
    hidden: RxWidgetInfoAttributesField['hidden'],
): RxWidgetInfoAttributesField {
    return {
        type: 'custom',
        name: `${base}AutoFillAgain`,
        label: 'autoFillAgain',
        // In a counted group the trigger only exists for the rows that count; the button follows it,
        // so the add bar does not offer to refill a row that is not there.
        hidden,
        component: (field, data, onDataChange, props) => {
            const socket = (props as { context?: { socket?: FillSocket } })?.context?.socket;
            const suffix = rowSuffix(`${base}AutoFillAgain`, field);
            const widgetData = data;
            const refill = async (): Promise<void> => {
                const oid = (widgetData as Record<string, unknown>)[`${base}${suffix}`];
                const src =
                    typeof oid === 'string' && oid && socket
                        ? await readSource(oid, socket, rules.some(rule => rule.needsValue))
                        : null;
                if (!src) {
                    window.alert(VisWidget.t('autoFillNothingFound'));
                    return;
                }
                const hit = overwrittenBy(rules, src, widgetData, suffix);
                if (hit.length && !window.confirm(`${VisWidget.t('autoFillAgainConfirm')}\n\n${hit.join(', ')}`)) {
                    return;
                }
                const next = applyRules(rules, src, widgetData, defaults, suffix, true);
                if (next) {
                    // A custom field's onDataChange merges into every selected widget, so it gets
                    // the changed keys only - a whole data object would clone this widget onto them.
                    onDataChange(changedKeys(next, widgetData));
                } else {
                    window.alert(VisWidget.t('autoFillNothingChanged'));
                }
            };
            return (
                <button
                    onClick={() => void refill()}
                    style={{
                        width: '100%',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        color: 'inherit',
                        background: 'transparent',
                        border: '1px solid currentColor',
                        borderRadius: 4,
                        font: 'inherit',
                    }}
                    type="button"
                >
                    {VisWidget.t('autoFillAgain')}
                </button>
            );
        },
    };
}

/**
 * Wires the automation into a widget's `visAttrs`: trigger fields get the fill, every field a rule
 * may write gets the sentinel, and the group of a trigger gets the refill button. Fields nothing
 * writes stay untouched, so their names never reach the bookkeeping keys.
 */
export function withAutoFill(attrs: RxWidgetInfo['visAttrs'], map: FillMap): RxWidgetInfo['visAttrs'] {
    const defaults = fieldDefaults(attrs);
    const targets = new Set(
        Object.values(map).flatMap(rules => rules.flatMap(rule => [rule.target, ...(rule.marks || [])])),
    );
    return attrs.map(group => {
        const fields = (group.fields || []).map(field => {
            const name = field.name;
            if (name && map[name]) {
                return { ...field, onChange: autoFill(map[name], defaults) };
            }
            if (name && targets.has(name) && !(field as { onChange?: unknown }).onChange) {
                return { ...field, onChange: markTouched(name) };
            }
            return field;
        });
        const trigger = (group.fields || []).find(field => field.name && map[field.name]);
        const name = trigger?.name;
        return {
            ...group,
            fields: name ? [...fields, refillField(name, map[name], defaults, trigger?.hidden)] : fields,
        };
    });
}
