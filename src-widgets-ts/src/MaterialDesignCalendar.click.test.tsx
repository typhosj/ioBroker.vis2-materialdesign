import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import MaterialDesignCalendar, { eventClickValue } from './MaterialDesignCalendar';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fixture<T>(value: unknown): T { return value as T; }

const stamp = (hour: number): string => { const date = new Date(); date.setHours(hour, 0, 0, 0); return date.toISOString(); };
const row = { date: 'heute 10:00', event: 'Zahnarzt', _date: stamp(10), _end: stamp(11), _allDay: false, _IDID: 'ev1', _calId: 'termine@example.test', _calColor: '#4faba2' };
const table = JSON.stringify([row]);

let container: HTMLDivElement;
let root: Root;
let setValue: Mock<(id: string, value: unknown) => void>;

function mount(rxData: Record<string, unknown>): void {
    const calendar = new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>({ id: 'w00001', context: { setValue } }));
    calendar.state = fixture<typeof calendar.state>({ rxData: { oid: 'cal.table', ...rxData }, values: { 'cal.table.val': table } });
    act(() => root.render(calendar.renderWidgetBody(fixture<Parameters<MaterialDesignCalendar['renderWidgetBody']>[0]>({}))));
}

const event = (): HTMLElement => {
    const found = container.querySelector<HTMLElement>('.v-event');
    if (!found) throw new Error('missing .v-event');
    return found;
};

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    setValue = vi.fn();
    (window as unknown as { vis?: { instance?: string } }).vis = { instance: 'a.f1fa48' };
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete (window as unknown as { vis?: unknown }).vis;
});

describe('eventClickValue', () => {
    it('wraps the unchanged row with the browser instance', () => {
        expect(JSON.parse(eventClickValue('a.f1fa48', row))).toEqual({ instance: 'a.f1fa48', event: row });
    });

    it('writes an empty event for a missing row', () => {
        expect(JSON.parse(eventClickValue('', undefined))).toEqual({ instance: '', event: {} });
    });
});

describe('calendar event tap', () => {
    for (const calendarView of ['month', 'week']) {
        it(`writes instance and row in the ${calendarView} view`, () => {
            mount({ calendarView, eventClickOid: 'google-calendar.0.draft.edit' });
            expect(event().getAttribute('role')).toBe('button');
            act(() => { event().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
            expect(setValue).toHaveBeenCalledTimes(1);
            const [id, value] = setValue.mock.calls[0];
            expect(id).toBe('google-calendar.0.draft.edit');
            expect(JSON.parse(String(value))).toEqual({ instance: 'a.f1fa48', event: row });
        });
    }

    it('reacts to Enter and Space, not to other keys', () => {
        mount({ calendarView: 'week', eventClickOid: 'x.0.edit' });
        for (const key of ['Enter', ' ', 'a', 'Tab']) {
            act(() => { event().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
        }
        expect(setValue).toHaveBeenCalledTimes(2);
    });

    it('writes an empty instance when vis has none', () => {
        delete (window as unknown as { vis?: unknown }).vis;
        mount({ calendarView: 'week', eventClickOid: 'x.0.edit' });
        act(() => { event().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        expect(JSON.parse(String(setValue.mock.calls[0][1])).instance).toBe('');
    });

    for (const eventClickOid of [undefined, '', '   ']) {
        it(`stays a plain event without an object ID (${JSON.stringify(eventClickOid)})`, () => {
            mount({ calendarView: 'week', eventClickOid });
            expect(event().getAttribute('role')).toBeNull();
            expect(event().getAttribute('tabindex')).toBeNull();
            act(() => { event().dispatchEvent(new MouseEvent('click', { bubbles: true })); });
            expect(setValue).not.toHaveBeenCalled();
        });
    }
});
