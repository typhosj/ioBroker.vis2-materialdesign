import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRuntime } from './runtime';

const values = (runtime: ReturnType<typeof createRuntime>) => runtime.store.ids().map(id => [id, runtime.store.getState(id)?.val]);

describe('createRuntime', () => {
    afterEach(() => vi.useRealTimers());

    it('uses the fixed test time for the dynamic states in test mode, whatever the clock says', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-02T08:00:00+01:00'));
        const a = createRuntime({ test: true });
        vi.setSystemTime(new Date('2027-09-20T23:30:00+02:00'));
        const b = createRuntime({ test: true });
        expect(values(a)).toEqual(values(b));
    });

    it('still follows the clock outside test mode and honours an explicit time', () => {
        const early = createRuntime({ test: false, now: new Date('2026-03-02T08:00:00+01:00') });
        const late = createRuntime({ test: false, now: new Date('2027-09-20T23:30:00+02:00') });
        early.stop();
        late.stop();
        expect(values(early)).not.toEqual(values(late));
    });
});
