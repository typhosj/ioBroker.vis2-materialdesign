import { describe, expect, it } from 'vitest';

import scenarioJson from '../../scenario/scenario.json';
import { dynamicStates, validateScenario } from './scenario';

const object = (type: string) => ({ type: 'state', common: { name: 'x', type, role: 'state', read: true, write: true } });

describe('validateScenario', () => {
    it('accepts the shipped scenario', () => {
        const scenario = validateScenario(scenarioJson);
        expect(Object.keys(scenario.states).length).toBeGreaterThan(40);
        expect(scenario.objects['0_userdata.0.demo.living.light']._id).toBe('0_userdata.0.demo.living.light');
    });

    it('reports every problem at once', () => {
        const raw = {
            objects: { '0_userdata.0.demo.a': object('number'), 'javascript.0.b': object('string') },
            states: { '0_userdata.0.demo.a': 'text', 'javascript.0.b': 'x', '0_userdata.0.demo.c': 1 },
            ticker: { '0_userdata.0.demo.missing': { min: 0, max: 1, step: 1, everyMs: 1000 } },
            history: { '0_userdata.0.demo.gone': { shape: 'flat', base: 0, amplitude: 1, noise: 0 } },
        };
        let message = '';
        try {
            validateScenario(raw);
        } catch (error) {
            message = (error as Error).message;
        }
        expect(message).toMatch(/demo\.a: value type string does not match common\.type number/);
        expect(message).toMatch(/javascript\.0\.b: outside 0_userdata\.0\.demo\./);
        expect(message).toMatch(/demo\.c: state without object/);
        expect(message).toMatch(/ticker 0_userdata\.0\.demo\.missing: unknown state/);
        expect(message).toMatch(/history 0_userdata\.0\.demo\.gone: unknown state/);
    });

    it('rejects a ticker with a non-numeric value or bad bounds', () => {
        const raw = {
            objects: { '0_userdata.0.demo.t': object('number') },
            states: { '0_userdata.0.demo.t': 1 },
            ticker: { '0_userdata.0.demo.t': { min: 'a', max: 1, step: 1, everyMs: 1000 } },
        };
        expect(() => validateScenario(raw)).toThrow(/ticker 0_userdata\.0\.demo\.t: min, max, step and everyMs must be finite numbers/);
    });

    it('rejects anything that is not an object', () => {
        expect(() => validateScenario(null)).toThrow(/scenario must be an object/);
        expect(() => validateScenario([])).toThrow(/scenario must be an object/);
    });

    it('treats json as a string type and fills missing ticker and history', () => {
        const scenario = validateScenario({ objects: { '0_userdata.0.demo.j': object('json') }, states: { '0_userdata.0.demo.j': '[]' } });
        expect(scenario.ticker).toEqual({});
        expect(scenario.history).toEqual({});
    });
});

describe('dynamicStates', () => {
    it('places calendar events around the given day and yields valid JSON', () => {
        const states = dynamicStates(new Date('2026-06-15T10:00:00'));
        const events = JSON.parse(states['0_userdata.0.demo.calendar.events']);
        expect(events.length).toBeGreaterThanOrEqual(5);
        expect(events.some((e: { start: string }) => e.start.startsWith('2026-06-15'))).toBe(true);
        expect(Array.isArray(JSON.parse(states['0_userdata.0.demo.notifications.alerts']))).toBe(true);
    });
});
