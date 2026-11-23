import type { HistoryRule } from './history';
import type { TickerRule } from './ticker';

export interface Scenario { objects: Record<string, ioBroker.Object>; states: Record<string, ioBroker.StateValue>; ticker: Record<string, TickerRule>; history: Record<string, HistoryRule> }

export const DEMO_PREFIX = '0_userdata.0.demo.';

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const valueType = (value: unknown): string => (value === null ? 'null' : typeof value);
const expectedType = (commonType: unknown): string => (commonType === 'json' ? 'string' : String(commonType));

export function validateScenario(raw: unknown): Scenario {
    if (!isRecord(raw)) throw new Error('scenario.json: scenario must be an object');
    const problems: string[] = [];
    const objectsIn = isRecord(raw.objects) ? raw.objects : {};
    const statesIn = isRecord(raw.states) ? raw.states : {};
    const tickerIn = isRecord(raw.ticker) ? raw.ticker : {};
    const historyIn = isRecord(raw.history) ? raw.history : {};
    const objects: Record<string, ioBroker.Object> = {};
    for (const [id, value] of Object.entries(objectsIn)) {
        if (!id.startsWith(DEMO_PREFIX)) problems.push(`${id}: outside ${DEMO_PREFIX}`);
        if (!isRecord(value) || !isRecord(value.common)) { problems.push(`${id}: object without common`); continue; }
        objects[id] = { _id: id, native: {}, ...value } as unknown as ioBroker.Object;
    }
    for (const [id, value] of Object.entries(statesIn)) {
        if (!id.startsWith(DEMO_PREFIX)) { if (!(id in objectsIn)) problems.push(`${id}: outside ${DEMO_PREFIX}`); continue; }
        const object = objects[id];
        if (!object) { problems.push(`${id}: state without object`); continue; }
        const expected = expectedType((object.common as { type?: unknown }).type);
        if (expected !== 'mixed' && valueType(value) !== expected) problems.push(`${id}: value type ${valueType(value)} does not match common.type ${String((object.common as { type?: unknown }).type)}`);
    }
    for (const [id, rule] of Object.entries(tickerIn)) {
        if (!(id in statesIn)) { problems.push(`ticker ${id}: unknown state`); continue; }
        const r = rule as Record<string, unknown>;
        if (![r.min, r.max, r.step, r.everyMs].every(v => typeof v === 'number' && Number.isFinite(v))) problems.push(`ticker ${id}: min, max, step and everyMs must be finite numbers`);
    }
    for (const id of Object.keys(historyIn)) if (!(id in statesIn)) problems.push(`history ${id}: unknown state`);
    if (problems.length) throw new Error(`scenario.json:\n- ${problems.join('\n- ')}`);
    return { objects, states: statesIn as Record<string, ioBroker.StateValue>, ticker: tickerIn as Record<string, TickerRule>, history: historyIn as Record<string, HistoryRule> };
}

const pad = (n: number): string => String(n).padStart(2, '0');
const stamp = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
const at = (now: Date, dayOffset: number, hour: number, minute = 0): Date => new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute);

export function dynamicStates(now: Date): Record<string, string> {
    const events = [
        { name: 'Waste collection', start: at(now, 0, 7), end: at(now, 0, 7, 30), color: '#6d4c41' },
        { name: 'Team call', start: at(now, 0, 10), end: at(now, 0, 11), color: '#1e88e5' },
        { name: 'Dentist', start: at(now, 1, 15, 30), end: at(now, 1, 16, 15), color: '#8e24aa' },
        { name: 'Football training', start: at(now, 2, 18), end: at(now, 2, 19, 30), color: '#43a047' },
        { name: 'Birthday Sam', start: at(now, 4, 0), end: at(now, 4, 23, 59), color: '#f4511e' },
        { name: 'Window cleaning', start: at(now, -1, 9), end: at(now, -1, 12), color: '#00897b' },
    ].map(e => ({ ...e, start: stamp(e.start), end: stamp(e.end) }));
    const alerts = [
        { text: 'Kitchen window is open', icon: 'window-open-variant', iconColor: '#fb8c00' },
        { text: 'Battery of the hall sensor is low', icon: 'battery-alert', iconColor: '#e53935' },
    ];
    return {
        [`${DEMO_PREFIX}calendar.events`]: JSON.stringify(events),
        [`${DEMO_PREFIX}notifications.alerts`]: JSON.stringify(alerts),
    };
}
