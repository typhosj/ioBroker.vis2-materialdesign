import { afterEach, describe, expect, it, vi } from 'vitest';

import { createButtonClass } from './MaterialDesignButtons';
import MaterialDesignCard from './MaterialDesignCard';
import { MaterialDesignDialog } from './MaterialDesignDialog';
import MaterialDesignSelect from './MaterialDesignSelect';
import { MaterialDesignViews } from './MaterialDesignViews';

afterEach(() => {
    vi.useRealTimers();
});

describe('widget lifecycle cleanup', () => {
    it('cancels delayed multi-state writes on unmount', () => {
        vi.useFakeTimers();
        const writes: Array<[string, ioBroker.StateValue]> = [];
        const props = { context: { setValue: (id: string, value: ioBroker.StateValue): void => { writes.push([id, value]); } } } as never;
        const Button = createButtonClass({ id: 'test', name: 'Test', kind: 'multiState', layout: 'default', label: 'Test', icon: 'plus' });
        const widget = new Button(props) as unknown as { activate: (data: Record<string, unknown>, current: undefined) => void; componentWillUnmount: () => void };

        widget.activate({ countOids: 100_000, oid0: 'test.0.value', value0: '1', delayInMs0: 100 }, undefined);
        expect(vi.getTimerCount()).toBe(1);
        widget.componentWillUnmount();
        vi.runAllTimers();

        expect(writes).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops recursive view measurement on unmount', () => {
        vi.useFakeTimers();
        const widget = new MaterialDesignViews({}, 'grid') as unknown as { startMeasure: () => void; componentWillUnmount: () => void };

        widget.startMeasure();
        expect(vi.getTimerCount()).toBe(1);
        widget.componentWillUnmount();
        vi.runAllTimers();

        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops dialog measurement and select filter timers on unmount', () => {
        vi.useFakeTimers();
        const dialog = new MaterialDesignDialog({}, 'view') as unknown as { viewRef: { current: { scrollHeight: number } | null }; startMeasure: () => void; componentWillUnmount: () => void };
        dialog.viewRef.current = { scrollHeight: 100 };
        dialog.startMeasure();

        const select = new MaterialDesignSelect({}) as unknown as { scheduleFilterReset: () => void; componentWillUnmount: () => void };
        select.scheduleFilterReset();
        expect(vi.getTimerCount()).toBe(2);

        dialog.componentWillUnmount();
        select.componentWillUnmount();
        vi.runAllTimers();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels card refresh work on unmount', () => {
        vi.useFakeTimers();
        const props = { id: 'card', context: {} } as never;
        const card = new MaterialDesignCard(props);
        card.state = { rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 1 } } as never;
        card.renderWidgetBody(props);
        card.state = { rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 2 } } as never;
        card.renderWidgetBody(props);
        expect(vi.getTimerCount()).toBe(1);

        card.componentWillUnmount();
        vi.runAllTimers();
        expect(vi.getTimerCount()).toBe(0);
    });
});
