import { describe, expect, it, vi } from 'vitest';

import type { RxWidgetInfo, WidgetData } from '@iobroker/types-vis-2';

import MaterialDesignButtonState from './MaterialDesignButtonState';
import MaterialDesignIconList from './MaterialDesignIconList';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignList from './MaterialDesignList';
import MaterialDesignProgress from './MaterialDesignProgress';
import MaterialDesignProgressCircular from './MaterialDesignProgressCircular';
import MaterialDesignRoundSlider from './MaterialDesignRoundSlider';
import MaterialDesignSelect from './MaterialDesignSelect';
import MaterialDesignSlider from './MaterialDesignSlider';
import MaterialDesignSwitch from './MaterialDesignSwitch';
import MaterialDesignTable from './MaterialDesignTable';
import MaterialDesignValue from './MaterialDesignValue';
import { resetEnumCache, type FillSocket } from './deviceFill';
import { OWNED_KEY, TOUCHED_KEY } from './autoFillKeys';

const temperature = {
    _id: 'hm.0.living.ACTUAL',
    type: 'state',
    common: { name: 'Temperature', type: 'number', unit: '°C', min: 5, max: 30, step: 0.5, write: false, role: 'value.temperature' },
    native: {},
} as unknown as ioBroker.Object;

const light = {
    _id: 'hm.0.living.STATE',
    type: 'state',
    common: { name: 'Light', type: 'boolean', role: 'switch', states: { true: 'On', false: 'Off' } },
    native: {},
} as unknown as ioBroker.Object;

const mode = {
    _id: 'hm.0.living.MODE',
    type: 'state',
    common: { name: 'Mode', type: 'number', role: 'level.mode', states: { 0: 'Auto', 1: 'Manual' } },
    native: {},
} as unknown as ioBroker.Object;

const table = {
    _id: 'javascript.0.rooms.table',
    type: 'state',
    common: { name: 'Rooms', type: 'string', role: 'json' },
    native: {},
} as unknown as ioBroker.Object;

const objects: Record<string, ioBroker.Object> = {
    [temperature._id]: temperature,
    [light._id]: light,
    [mode._id]: mode,
    [table._id]: table,
};

const socket: FillSocket = {
    getObject: (id: string) => Promise.resolve(objects[id] ?? null),
    getObjectViewSystemCached: () => Promise.resolve({}),
    getEnums: () => Promise.resolve({}),
    getState: (id: string) =>
        Promise.resolve(
            id === table._id
                ? ({
                      val: JSON.stringify([
                          { name: 'Bath', temp: 21 },
                          { name: 'Hall', temp: 19 },
                      ]),
                  } as ioBroker.State)
                : null,
        ),
};

/** The generated widget classes are typed as the base class; only getWidgetInfo() matters here. */
const widget = (cls: unknown): { getWidgetInfo: () => RxWidgetInfo } => cls as { getWidgetInfo: () => RxWidgetInfo };

/** Runs the `oid` field's onChange the way the editor does and returns what it wrote. */
async function pick(info: RxWidgetInfo, oid = temperature._id): Promise<Record<string, unknown>> {
    const field = info.visAttrs
        ?.flatMap(group => group.fields || [])
        .find(entry => entry.name === 'oid') as { name: string; onChange?: unknown } | undefined;
    expect(typeof field?.onChange).toBe('function');
    const data = { oid } as unknown as WidgetData;
    let written: Record<string, unknown> = {};
    const onChange = field!.onChange as (
        f: unknown,
        d: WidgetData,
        c: (next: WidgetData) => void,
        s: FillSocket,
    ) => Promise<void>;
    await onChange(field, data, next => (written = next as Record<string, unknown>), socket);
    return written;
}

/** The same, for the `oid` of one row of a counted group. */
async function pickRow(info: RxWidgetInfo, index: number, oid = temperature._id): Promise<Record<string, unknown>> {
    const field = (info.visAttrs || [])
        .filter(group => group.name === 'rows')
        .flatMap(group => group.fields || [])
        .find(entry => entry.name === 'oid') as { name: string; onChange?: unknown } | undefined;
    expect(typeof field?.onChange).toBe('function');
    const data = { [`oid${index}`]: oid } as unknown as WidgetData;
    let written: Record<string, unknown> = {};
    const onChange = field!.onChange as (
        f: unknown,
        d: WidgetData,
        c: (next: WidgetData) => void,
        s: FillSocket,
        i?: number,
    ) => Promise<void>;
    await onChange({ name: 'oid' }, data, next => (written = next as Record<string, unknown>), socket, index);
    return written;
}

describe('widgets fill themselves from the selected object', () => {
    it('Value takes name, unit and decimals', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignValue.getWidgetInfo())).toMatchObject({
            prepandText: 'Temperature',
            valueLabelUnit: '°C',
            maxDecimals: 1,
        });
    });

    it('Slider takes range, step, unit, name and the read-only flag', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignSlider.getWidgetInfo())).toMatchObject({
            min: 5,
            max: 30,
            step: 0.5,
            valueLabelUnit: '°C',
            prepandText: 'Temperature',
            readOnly: true,
        });
    });

    it('Round Slider takes range, step and unit', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignRoundSlider.getWidgetInfo())).toMatchObject({
            min: 5,
            max: 30,
            step: 0.5,
            valueLabelUnit: '°C',
        });
    });

    it('Progress and Progress Circular take range, unit and decimals', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignProgress.getWidgetInfo())).toMatchObject({
            min: 5,
            max: 30,
            valueLabelUnit: '°C',
            valueMaxDecimals: 1,
        });
        resetEnumCache();
        expect(await pick(MaterialDesignProgressCircular.getWidgetInfo())).toMatchObject({
            min: 5,
            max: 30,
            valueLabelUnit: '°C',
        });
    });

    it('Switch takes the state texts and the switching values', async () => {
        resetEnumCache();
        expect(await pick(widget(MaterialDesignSwitch).getWidgetInfo(), light._id)).toMatchObject({
            labelTrue: 'On',
            labelFalse: 'Off',
            toggleType: 'boolean',
        });
        expect(await pick(widget(MaterialDesignSwitch).getWidgetInfo(), mode._id)).toMatchObject({
            toggleType: 'value',
            valueOff: '0',
            valueOn: '1',
        });
    });

    it('Button State takes the name and the first state as its value', async () => {
        resetEnumCache();
        expect(await pick(widget(MaterialDesignButtonState).getWidgetInfo(), mode._id)).toMatchObject({
            buttontext: 'Mode',
            value: '0',
        });
    });

    it('Select builds its menu entries from common.states', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignSelect.getWidgetInfo(), mode._id)).toMatchObject({
            inputLabelText: 'Mode',
            countSelectItems: 2,
            value0: '0',
            label0: 'Auto',
            value1: '1',
            label1: 'Manual',
        });
    });

    it('Input takes label, suffix and the numeric input type', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignInput.getWidgetInfo())).toMatchObject({
            inputLabelText: 'Temperature',
            inputSuffix: '°C',
            inputType: 'number',
        });
    });

    it('List fills the row it was picked in and binds the right-hand column', async () => {
        resetEnumCache();
        const written = await pickRow(MaterialDesignList.getWidgetInfo(), 2);
        expect(written).toMatchObject({ label2: 'Temperature', rightLabel2: '{hm.0.living.ACTUAL} °C' });
        expect(Object.keys(written).filter(key => key.startsWith('label'))).toEqual(['label2']);
    });

    it('Icon List fills label, unit and the read-only flag of its row', async () => {
        resetEnumCache();
        expect(await pickRow(MaterialDesignIconList.getWidgetInfo(), 0)).toMatchObject({
            label0: 'Temperature',
            valueAppendix0: '°C',
            readOnly0: true,
        });
    });

    it('Table takes its columns from the JSON the state carries', async () => {
        resetEnumCache();
        expect(await pick(MaterialDesignTable.getWidgetInfo(), table._id)).toMatchObject({
            countCols: 2,
            label0: 'name',
            label1: 'temp',
        });
    });

    it('sends the changed keys only when the refill button writes', async () => {
        resetEnumCache();
        vi.stubGlobal('confirm', () => true);
        vi.stubGlobal('alert', () => undefined);
        try {
            const info = MaterialDesignSlider.getWidgetInfo();
            const button = info.visAttrs
                ?.flatMap(group => group.fields || [])
                .find(entry => entry.name === 'oidAutoFillAgain') as {
                name: string;
                component: (
                    field: unknown,
                    data: WidgetData,
                    onDataChange: (next: WidgetData) => void,
                    props: unknown,
                ) => { props: { onClick: () => void } };
            };
            expect(typeof button?.component).toBe('function');
            const data = {
                oid: temperature._id,
                valueLabelUnit: 'kWh',
                prepandText: 'Mine',
                [TOUCHED_KEY]: ['valueLabelUnit', 'prepandText'],
            } as unknown as WidgetData;
            let written: Record<string, unknown> | undefined;
            const element = button.component(
                { name: 'oidAutoFillAgain' },
                data,
                next => (written = next as Record<string, unknown>),
                { context: { socket } },
            );
            element.props.onClick();
            await vi.waitFor(() => expect(written).toBeDefined());
            // The forced refill replaces what the user owned...
            expect(written).toMatchObject({ valueLabelUnit: '°C', prepandText: 'Temperature', min: 5, max: 30 });
            // ...and carries nothing that did not change, the trigger included: a custom field's
            // onDataChange merges into EVERY selected widget.
            expect(Object.keys(written!)).not.toContain('oid');
            expect(written![TOUCHED_KEY]).toEqual([]);
            expect(written![OWNED_KEY]).toContain('min');
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('leaves the other selected widgets alone when the icon picker writes', () => {
        // What the editor does with what a custom field hands it (WidgetField.tsx, field.component):
        // it merges the keys into EVERY selected widget, and null deletes.
        const merge = (target: Record<string, unknown>, sent: Record<string, unknown>): Record<string, unknown> => {
            const out = { ...target };
            for (const [key, value] of Object.entries(sent)) {
                if (value === null) {
                    delete out[key];
                } else {
                    out[key] = value;
                }
            }
            return out;
        };
        const picker = MaterialDesignList.getWidgetInfo()
            .visAttrs?.flatMap(group => group.fields || [])
            .find(entry => entry.name === 'listImage') as {
            component: (
                field: unknown,
                data: WidgetData,
                onDataChange: (next: WidgetData) => void,
                props: unknown,
            ) => { props: { onChange: (value: string) => void } };
        };
        expect(typeof picker?.component).toBe('function');
        const first = { oid0: 'hm.0.a', label0: 'First', rightLabel0: '{hm.0.a}' } as unknown as WidgetData;
        const second = { oid0: 'hm.0.b', label0: 'Second' };
        let sent: Record<string, unknown> = {};
        const element = picker.component(
            { name: 'listImage0' },
            first,
            next => (sent = next as Record<string, unknown>),
            {},
        );
        element.props.onChange('thermometer');
        expect(sent).toMatchObject({ listImage0: 'thermometer' });
        expect(sent[TOUCHED_KEY]).toEqual(['listImage0']);
        const merged = merge(second, sent);
        expect(merged.label0).toBe('Second');
        expect(merged.oid0).toBe('hm.0.b');
        expect(merged.rightLabel0).toBeUndefined();
        expect(merged.listImage0).toBe('thermometer');
    });

    it('empties the menu entries the new state list no longer has', async () => {
        resetEnumCache();
        const info = MaterialDesignSelect.getWidgetInfo();
        const field = info.visAttrs?.flatMap(group => group.fields || []).find(entry => entry.name === 'oid') as {
            onChange?: (f: unknown, d: WidgetData, c: (n: WidgetData) => void, s: FillSocket) => Promise<void>;
        };
        // A Select the automation filled from another object before, now pointed at a two-state one.
        const data = {
            oid: mode._id,
            countSelectItems: 4,
            value0: 'a',
            label0: 'A',
            value3: 'd',
            label3: 'D',
            [OWNED_KEY]: ['countSelectItems', 'value0', 'label0', 'value3', 'label3'],
        } as unknown as WidgetData;
        let written: Record<string, unknown> = {};
        await field.onChange!({ name: 'oid' }, data, next => (written = next as Record<string, unknown>), socket);
        expect(written).toMatchObject({ countSelectItems: 2, value0: '0', label0: 'Auto', value1: '1', label1: 'Manual' });
        // Row 3 belonged to the object before this one; leaving it would bring it back the moment
        // the user raises the count again.
        expect(written.value3).toBeNull();
        expect(written.label3).toBeNull();
    });

    it('keeps a binding the user put on a field the automation may write', async () => {
        resetEnumCache();
        const info = MaterialDesignValue.getWidgetInfo();
        const field = info.visAttrs?.flatMap(group => group.fields || []).find(entry => entry.name === 'oid') as {
            onChange?: (f: unknown, d: WidgetData, c: (n: WidgetData) => void, s: FillSocket) => Promise<void>;
        };
        // The binding dialog writes straight into the project, so no sentinel exists for it.
        const data = { oid: temperature._id, prepandText: '{hm.0.living.NAME}' } as unknown as WidgetData;
        let written: Record<string, unknown> = {};
        await field.onChange!({ name: 'oid' }, data, next => (written = next as Record<string, unknown>), socket);
        expect(written.prepandText).toBe('{hm.0.living.NAME}');
        expect(written.valueLabelUnit).toBe('°C');
    });

    it('leaves an existing widget alone when the user owns its fields', async () => {
        resetEnumCache();
        const info = MaterialDesignSlider.getWidgetInfo();
        const field = info.visAttrs?.flatMap(group => group.fields || []).find(entry => entry.name === 'oid') as {
            onChange?: (f: unknown, d: WidgetData, c: (n: WidgetData) => void, s: FillSocket) => Promise<void>;
        };
        const data = {
            oid: temperature._id,
            min: 0,
            max: 100,
            step: 5,
            valueLabelUnit: 'kWh',
            prepandText: 'Mine',
            autoFillTouched: ['min', 'max', 'step', 'valueLabelUnit', 'prepandText', 'readOnly'],
        } as unknown as WidgetData;
        let called = 0;
        await field.onChange!(
            { name: 'oid' },
            data,
            () => {
                called += 1;
            },
            socket,
        );
        expect(called).toBe(0);
    });
});
