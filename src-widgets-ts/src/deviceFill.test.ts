import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WidgetData } from '@iobroker/types-vis-2';

import {
    OWNED_KEY,
    TOUCHED_KEY,
    applyRules,
    autoFill,
    commonStates,
    fieldDefaults,
    fill,
    roleIcon,
    markTouched,
    objectName,
    overwritable,
    overwrittenBy,
    readSource,
    resetEnumCache,
    rowSuffix,
    stepDecimals,
    withAutoFill,
    type FillSocket,
    type FillSource,
} from './deviceFill';
import { changedKeys, markTouchedIn } from './autoFillKeys';

function stateObj(common: Record<string, unknown>): ioBroker.Object {
    return { _id: 'x', type: 'state', common, native: {} } as unknown as ioBroker.Object;
}

function fakeSocket(objects: Record<string, ioBroker.Object>, enums: Record<string, unknown> = {}): FillSocket {
    return {
        getObject: (id: string) => Promise.resolve(objects[id] ?? null),
        getObjectViewSystemCached: (_type: 'state', start?: string) =>
            Promise.resolve(
                Object.fromEntries(
                    Object.entries(objects).filter(([id, obj]) => obj.type === 'state' && id.startsWith(start || '')),
                ),
            ),
        getEnums: (name?: string) =>
            Promise.resolve((enums[name || ''] as Record<string, ioBroker.EnumObject>) || {}),
    };
}

const source = (obj: ioBroker.Object, extra: Partial<FillSource> = {}): FillSource =>
    ({ obj, siblings: [], ...extra }) as FillSource;

beforeEach(() => resetEnumCache());

describe('metadata readers', () => {
    it('resolves a name from a string and from a language map', () => {
        expect(objectName(stateObj({ name: 'Temperature' }))).toBe('Temperature');
        expect(objectName(stateObj({ name: { de: 'Temperatur', en: 'Temperature' } }))).toBe('Temperature');
        expect(objectName(undefined, 'fallback')).toBe('fallback');
    });

    it('normalizes common.states from map, array and legacy string', () => {
        expect(commonStates(stateObj({ states: { 0: 'off', 1: 'on' } }))).toEqual({ 0: 'off', 1: 'on' });
        expect(commonStates(stateObj({ states: ['off', 'on'] }))).toEqual({ 0: 'off', 1: 'on' });
        expect(commonStates(stateObj({ states: '0:off;1:on' }))).toEqual({ 0: 'off', 1: 'on' });
        expect(commonStates(stateObj({}))).toBeUndefined();
    });

    it('derives decimals from common.step', () => {
        expect(stepDecimals(1)).toBe(0);
        expect(stepDecimals(0.5)).toBe(1);
        expect(stepDecimals(0.01)).toBe(2);
        // JS prints small numbers in exponential form; the decimals sit in the exponent then.
        expect(stepDecimals(1e-7)).toBe(7);
        expect(stepDecimals(2.5e-3)).toBe(4);
        expect(stepDecimals('x')).toBeUndefined();
        expect(stepDecimals(0)).toBeUndefined();
    });

    it('takes the row suffix from the field name or from the index argument', () => {
        expect(rowSuffix('oid', { name: 'oid' })).toBe('');
        expect(rowSuffix('oid', { name: 'oid3' })).toBe('3');
        expect(rowSuffix('oid', { name: 'oid', index: 2 })).toBe('2');
        expect(rowSuffix('oid', undefined, 4)).toBe('4');
    });
});

describe('readSource', () => {
    const objects: Record<string, ioBroker.Object> = {
        'hm.0.living.ACTUAL': stateObj({ name: 'Actual', unit: '°C', role: 'value.temperature' }),
        'hm.0.living.SET': stateObj({ name: 'Set', unit: '°C', role: 'level.temperature' }),
        'hm.0.living': { _id: 'hm.0.living', type: 'channel', common: { name: 'Thermostat' }, native: {} } as never,
    };

    it('reads object, parent, siblings and enums', async () => {
        const socket = fakeSocket(objects, {
            rooms: { 'enum.rooms.living': { common: { name: 'Living room', members: ['hm.0.living'] } } },
            functions: { 'enum.functions.heat': { common: { name: 'Heating', members: ['hm.0.living.ACTUAL'] } } },
        });
        const src = await readSource('hm.0.living.ACTUAL', socket);
        expect(src?.obj.common.unit).toBe('°C');
        expect(objectName(src?.parent)).toBe('Thermostat');
        expect(src?.siblings.map(s => s.common.name)).toEqual(['Set']);
        expect(src?.room).toBe('Living room');
        expect(src?.func).toBe('Heating');
    });

    it('reads the enums once per session', async () => {
        const socket = fakeSocket(objects);
        const spy = vi.spyOn(socket, 'getEnums');
        await readSource('hm.0.living.ACTUAL', socket);
        await readSource('hm.0.living.SET', socket);
        expect(spy).toHaveBeenCalledTimes(2); // rooms + functions, not four calls
    });

    it('does not cache a failed enum read', async () => {
        const rooms = { rooms: { 'enum.rooms.living': { common: { name: 'Living room', members: ['hm.0.living'] } } } };
        const socket = fakeSocket(objects, rooms);
        const working = socket.getEnums!;
        socket.getEnums = () => Promise.reject(new Error('offline'));
        expect((await readSource('hm.0.living.ACTUAL', socket))?.room).toBeUndefined();
        socket.getEnums = working;
        expect((await readSource('hm.0.living.ACTUAL', socket))?.room).toBe('Living room');
    });

    it('reads the enums again after a minute of editing', async () => {
        const rooms = { rooms: { 'enum.rooms.living': { common: { name: 'Living room', members: ['hm.0.living'] } } } };
        const socket = fakeSocket(objects, rooms);
        const spy = vi.spyOn(socket, 'getEnums');
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date('2026-08-24T10:00:00Z'));
            await readSource('hm.0.living.ACTUAL', socket);
            vi.setSystemTime(new Date('2026-08-24T10:00:30Z'));
            await readSource('hm.0.living.ACTUAL', socket);
            expect(spy).toHaveBeenCalledTimes(2); // still the cached pair
            vi.setSystemTime(new Date('2026-08-24T10:01:30Z'));
            expect((await readSource('hm.0.living.ACTUAL', socket))?.room).toBe('Living room');
            expect(spy).toHaveBeenCalledTimes(4); // a room added meanwhile would show up now
        } finally {
            vi.useRealTimers();
        }
    });

    it('does nothing without a selection and ignores non-states', async () => {
        const socket = fakeSocket(objects);
        expect(await readSource('', socket)).toBeNull();
        expect(await readSource('nothing_selected', socket)).toBeNull();
        expect(await readSource('hm.0.living', socket)).toBeNull();
        expect(await readSource('hm.0.missing', socket)).toBeNull();
    });
});

describe('ownership model', () => {
    const defaults = { step: 1, label: '' };

    it('fills an empty field and one still carrying its declared default', () => {
        expect(overwritable('label', {}, defaults)).toBe(true);
        expect(overwritable('step', { step: 1 }, defaults)).toBe(true);
    });

    it('never writes over a value the user touched, not even the identical default', () => {
        const data = { step: 1, [TOUCHED_KEY]: ['step'] } as unknown as WidgetData;
        expect(overwritable('step', data, defaults)).toBe(false);
    });

    it('leaves a field the user cleared empty', () => {
        const data = { label: '', [TOUCHED_KEY]: ['label'] } as unknown as WidgetData;
        expect(overwritable('label', data, defaults)).toBe(false);
    });

    it('refills what the automation itself wrote', () => {
        const data = { label: 'Old', [OWNED_KEY]: ['label'] } as unknown as WidgetData;
        expect(overwritable('label', data, defaults)).toBe(true);
    });

    it('treats a binding as a value of the user', () => {
        const data = { rightLabel: '{hm.0.living.ACTUAL}' } as unknown as WidgetData;
        expect(overwritable('rightLabel', data, { rightLabel: '' })).toBe(false);
        // ...unless the automation put it there itself, which is what valueBinding does.
        const owned = { ...data, [OWNED_KEY]: ['rightLabel'] } as unknown as WidgetData;
        expect(overwritable('rightLabel', owned, { rightLabel: '' })).toBe(true);
        expect(overwritable('rightLabel', { rightLabel: 'plain' }, {})).toBe(false);
    });

    it('keeps a user value that differs from the default', () => {
        expect(overwritable('step', { step: 5 }, defaults)).toBe(false);
    });

    it('keeps the bookkeeping per row index', () => {
        const data = { [TOUCHED_KEY]: ['label3'] } as unknown as WidgetData;
        expect(overwritable('label3', data, defaults, 'label')).toBe(false);
        expect(overwritable('label2', data, defaults, 'label')).toBe(true);
    });

    it('reduces a new data object to the keys that changed', () => {
        const before = { a: 1, b: 2 } as unknown as WidgetData;
        const after = { a: 1, b: 3, c: 4 } as unknown as WidgetData;
        expect(changedKeys(after, before)).toEqual({ b: 3, c: 4 });
        // The bookkeeping lists are rebuilt on every write, so they always come out as changed.
        const marked = markTouchedIn(before, 'a');
        expect(Object.keys(changedKeys(marked, before))).toEqual([TOUCHED_KEY, OWNED_KEY]);
    });

    it('marks a field as touched and drops it from the owned list', () => {
        let data = { label: 'auto', [OWNED_KEY]: ['label', 'unit'] } as unknown as WidgetData;
        const change = markTouched('label');
        void change({ name: 'label' }, data, next => (data = next), fakeSocket({}));
        expect(data[TOUCHED_KEY]).toEqual(['label']);
        expect(data[OWNED_KEY]).toEqual(['unit']);
    });
});

describe('applyRules', () => {
    const obj = stateObj({ name: 'Temperature', unit: '°C', min: 5, max: 30, step: 0.5 });
    const rules = [
        { target: 'label', from: (src: FillSource) => objectName(src.obj) },
        { target: 'unit', from: (src: FillSource) => src.obj.common.unit },
        { target: 'step', from: (src: FillSource) => src.obj.common.step },
    ];

    it('writes free fields and books them as owned', () => {
        const next = applyRules(rules, source(obj), {}, { step: 1 });
        expect(next).toMatchObject({ label: 'Temperature', unit: '°C', step: 0.5 });
        expect(next?.[OWNED_KEY]).toEqual(['label', 'unit', 'step']);
    });

    it('skips a touched field and reports nothing when everything is taken', () => {
        const data = { label: 'Mine', unit: 'K', step: 2, [TOUCHED_KEY]: ['label', 'unit', 'step'] };
        expect(applyRules(rules, source(obj), data as unknown as WidgetData, { step: 1 })).toBeNull();
    });

    it('overwrites everything when forced and clears the touched marks it replaced', () => {
        const data = { label: 'Mine', [TOUCHED_KEY]: ['label'] } as unknown as WidgetData;
        const next = applyRules(rules, source(obj), data, {}, '', true);
        expect(next?.label).toBe('Temperature');
        expect(next?.[TOUCHED_KEY]).toEqual([]);
    });

    it('writes only the fields of its own row', () => {
        const next = applyRules(rules, source(obj), {}, {}, '2');
        expect(Object.keys(next as object).filter(key => key.startsWith('label'))).toEqual(['label2']);
    });

    it('empties the rows an expand rule drops and names them', () => {
        const rules = [fill.stateList('count', 'value', 'label')];
        const src = source(stateObj({ states: { 0: 'Auto', 1: 'Manual' } }));
        // The state of a Select the automation filled from a different object before.
        const data = {
            count: 4,
            value3: 'old',
            label3: 'Old',
            [OWNED_KEY]: ['count', 'value3', 'label3'],
        } as unknown as WidgetData;
        const next = applyRules(rules, src, data, {}) as Record<string, unknown>;
        expect(next.count).toBe(2);
        expect(next.value3).toBeNull();
        expect(next.label3).toBeNull();
        expect(overwrittenBy(rules, src, data)).toEqual(expect.arrayContaining(['value3', 'label3']));
        // A row the user typed is left alone until the button forces it.
        const touched = { ...data, [TOUCHED_KEY]: ['label3'] } as unknown as WidgetData;
        expect((applyRules(rules, src, touched, {}) as Record<string, unknown>).label3).toBe('Old');
        expect((applyRules(rules, src, touched, {}, '', true) as Record<string, unknown>).label3).toBeNull();
    });

    it('names what a forced refill would overwrite', () => {
        const data = { label: 'Mine', unit: '°C' } as unknown as WidgetData;
        expect(overwrittenBy(rules, source(obj), data)).toEqual(['label']);
    });
});

describe('icons, places, siblings and json columns', () => {
    const src = (obj: ioBroker.Object, extra: Partial<FillSource> = {}): FillSource =>
        ({ obj, siblings: [], ...extra }) as FillSource;

    it('takes the icon from the object, then the channel, then the role', () => {
        const own = stateObj({ icon: '/vis.0/main/own.png', role: 'value.temperature' });
        expect(fill.icon('image').from?.(src(own))).toBe('/vis.0/main/own.png');
        const fromParent = src(stateObj({ role: 'value.temperature' }), {
            parent: stateObj({ icon: 'https://example.org/channel.png' }),
        });
        expect(fill.icon('image').from?.(fromParent)).toBe('https://example.org/channel.png');
        expect(fill.icon('image').from?.(src(stateObj({ icon: 'data:image/png;base64,AAA' })))).toBe(
            'data:image/png;base64,AAA',
        );
        expect(fill.icon('image').from?.(src(stateObj({ role: 'value.temperature' })))).toBe('thermometer');
        expect(fill.icon('image').from?.(src(stateObj({ role: 'switch.light.dimmer' })))).toBe('lightbulb');
        expect(fill.icon('image').from?.(src(stateObj({ role: 'state' })))).toBeUndefined();
        // A bare file name only resolves inside the adapter's own admin folder: the role decides.
        expect(fill.icon('image').from?.(src(stateObj({ icon: 'hm-rpc.png', role: 'value.temperature' })))).toBe(
            'thermometer',
        );
        expect(fill.icon('image').from?.(src(stateObj({ icon: 'hm-rpc.png', role: 'state' })))).toBeUndefined();
        expect(roleIcon('value.humidity')).toBe('water-percent');
        expect(roleIcon(undefined)).toBeUndefined();
    });

    it('writes room and function as one line', () => {
        expect(fill.place('subLabel').from?.(src(stateObj({}), { room: 'Kitchen', func: 'Light' }))).toBe(
            'Kitchen · Light',
        );
        expect(fill.place('subLabel').from?.(src(stateObj({}), { room: 'Kitchen' }))).toBe('Kitchen');
        expect(fill.place('subLabel').from?.(src(stateObj({})))).toBeUndefined();
    });

    it('binds the right-hand column to the state instead of freezing its value', () => {
        const obj = { ...stateObj({ unit: 'W' }), _id: 'hm.0.plug.POWER' } as ioBroker.Object;
        expect(fill.valueBinding('rightLabel').from?.(src(obj))).toBe('{hm.0.plug.POWER} W');
    });

    it('finds a sibling by role and by the last ID segment', () => {
        const working = { ...stateObj({ role: 'indicator.working' }), _id: 'hm.0.dim.WORKING' } as ioBroker.Object;
        const other = { ...stateObj({ role: 'state' }), _id: 'hm.0.dim.WORKING2' } as ioBroker.Object;
        const rule = fill.sibling('oid-working', ['indicator.working', 'working']);
        expect(rule.from?.(src(stateObj({}), { siblings: [other, working] as never }))).toBe('hm.0.dim.WORKING');
        expect(rule.from?.(src(stateObj({}), { siblings: [other] as never }))).toBeUndefined();
    });

    it('reads the table columns out of the JSON value', () => {
        const rule = fill.jsonColumns('countCols', 'label');
        const value = JSON.stringify([{ name: 'Bath', temp: 21 }, { name: 'Hall', temp: 19 }]);
        expect(rule.expand?.(src(stateObj({}), { value }))).toEqual({ countCols: 2, label0: 'name', label1: 'temp' });
        expect(rule.expand?.(src(stateObj({}), { value: 'not json' }))).toEqual({});
        expect(rule.expand?.(src(stateObj({})))).toEqual({});
    });

    it('reads the value only for a rule that asks for it', async () => {
        const objects = { 'hm.0.t': stateObj({ name: 'T' }) };
        const socket = { ...fakeSocket(objects), getState: () => Promise.resolve({ val: '[]' } as ioBroker.State) };
        const spy = vi.spyOn(socket, 'getState');
        await readSource('hm.0.t', socket);
        expect(spy).not.toHaveBeenCalled();
        await readSource('hm.0.t', socket, true);
        expect(spy).toHaveBeenCalledTimes(1);
    });
});

describe('wiring', () => {
    const attrs = [
        {
            name: 'common',
            fields: [
                { name: 'oid', label: 'oid', type: 'id' },
                { name: 'label', label: 'label', type: 'text' },
                { name: 'step', label: 'step', type: 'number', default: 1 },
                { name: 'color', label: 'color', type: 'color' },
            ],
        },
    ] as never;

    const map = {
        oid: [
            { target: 'label', from: (src: FillSource) => objectName(src.obj) },
            { target: 'step', from: (src: FillSource) => src.obj.common.step },
        ],
    };

    it('collects the declared defaults', () => {
        expect(fieldDefaults(attrs)).toEqual({ step: 1 });
    });

    it('puts the fill on the trigger, the sentinel on targets and nothing on the rest', () => {
        const wired = withAutoFill(attrs, map);
        const fields = wired[0].fields as unknown as Array<{ name: string; onChange?: unknown }>;
        expect(typeof fields[0].onChange).toBe('function');
        expect(typeof fields[1].onChange).toBe('function');
        expect(fields[3].onChange).toBeUndefined();
    });

    it('adds the refill button to the group that carries the trigger', () => {
        const fields = withAutoFill(attrs, map)[0].fields as unknown as Array<{ name: string; type: string; label?: string }>;
        const button = fields[fields.length - 1];
        expect(button).toMatchObject({ name: 'oidAutoFillAgain', type: 'custom', label: 'autoFillAgain' });
    });

    it('fills from the object in exactly one changeData call', async () => {
        const objects = { 'hm.0.t': stateObj({ name: 'Temperature', step: 0.5 }) };
        const changeData = vi.fn();
        const fill = autoFill(map.oid, { step: 1 });
        await fill({ name: 'oid' }, { oid: 'hm.0.t', step: 1 }, changeData, fakeSocket(objects));
        expect(changeData).toHaveBeenCalledTimes(1);
        expect(changeData.mock.calls[0][0]).toMatchObject({ label: 'Temperature', step: 0.5 });
    });

    it('does not call the socket without a selection', async () => {
        const socket = fakeSocket({});
        const spy = vi.spyOn(socket, 'getObject');
        const changeData = vi.fn();
        await autoFill(map.oid, {})({ name: 'oid' }, {}, changeData, socket);
        expect(spy).not.toHaveBeenCalled();
        expect(changeData).not.toHaveBeenCalled();
    });
});
