/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createButtonClass } from './MaterialDesignButtons';
import MaterialDesignCard from './MaterialDesignCard';
import { MaterialDesignDialog } from './MaterialDesignDialog';
import MaterialDesignIconList from './MaterialDesignIconList';
import MaterialDesignSelect from './MaterialDesignSelect';
import { MaterialDesignViews } from './MaterialDesignViews';
import MaterialDesignCalendar from './MaterialDesignCalendar';
import MaterialDesignChartLineHistory from './MaterialDesignChartLineHistory';

function fixture<T>(value: unknown): T { return value as T; }

afterEach(() => {
    vi.useRealTimers();
});

describe('widget lifecycle cleanup', () => {
    it('cancels delayed multi-state writes on unmount', () => {
        vi.useFakeTimers();
        const writes: Array<[string, ioBroker.StateValue]> = [];
        const Button = createButtonClass({ id: 'test', name: 'Test', kind: 'multiState', layout: 'default', label: 'Test', icon: 'plus' });
        const props = fixture<ConstructorParameters<typeof Button>[0]>({ context: { setValue: (id: string, value: ioBroker.StateValue): void => { writes.push([id, value]); } } });
        const widget = fixture<{ activate: (data: Record<string, unknown>, current: undefined) => void; componentWillUnmount: () => void }>(new Button(props));

        widget.activate({ countOids: 100_000, oid0: 'test.0.value', value0: '1', delayInMs0: 100 }, undefined);
        expect(vi.getTimerCount()).toBe(1);
        widget.componentWillUnmount();
        vi.runAllTimers();

        expect(writes).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops recursive view measurement on unmount', () => {
        vi.useFakeTimers();
        const widget = fixture<{ startMeasure: () => void; componentWillUnmount: () => void }>(new MaterialDesignViews({}, 'grid'));

        widget.startMeasure();
        expect(vi.getTimerCount()).toBe(1);
        widget.componentWillUnmount();
        vi.runAllTimers();

        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops dialog measurement and select filter timers on unmount', () => {
        vi.useFakeTimers();
        const dialog = fixture<{ viewRef: { current: { scrollHeight: number } | null }; startMeasure: () => void; componentWillUnmount: () => void }>(new MaterialDesignDialog({}, 'view'));
        dialog.viewRef.current = { scrollHeight: 100 };
        dialog.startMeasure();

        const select = fixture<{ scheduleFilterReset: () => void; componentWillUnmount: () => void }>(new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({})));
        select.scheduleFilterReset();
        expect(vi.getTimerCount()).toBe(2);

        dialog.componentWillUnmount();
        select.componentWillUnmount();
        vi.runAllTimers();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels card refresh work on unmount', () => {
        vi.useFakeTimers();
        const props = { id: 'card', context: {} };
        const card = new MaterialDesignCard(fixture<ConstructorParameters<typeof MaterialDesignCard>[0]>(props));
        card.state = fixture<typeof card.state>({ rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 1 } });
        card.renderWidgetBody(fixture<Parameters<MaterialDesignCard['renderWidgetBody']>[0]>(props));
        card.state = fixture<typeof card.state>({ rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 2 } });
        card.renderWidgetBody(fixture<Parameters<MaterialDesignCard['renderWidgetBody']>[0]>(props));
        expect(vi.getTimerCount()).toBe(1);

        card.componentWillUnmount();
        vi.runAllTimers();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels icon-list auto-relock work on unmount', () => {
        vi.useFakeTimers();
        const setValue = vi.fn();
        const iconList = fixture<{
            actionProps: (item: Record<string, unknown>, index: number, current: unknown, data: Record<string, unknown>) => { onClick: () => void };
            componentWillUnmount: () => void;
        }>(new MaterialDesignIconList(fixture<ConstructorParameters<typeof MaterialDesignIconList>[0]>({ context: { setValue } })));
        const action = iconList.actionProps({
            listType: 'buttonToggle', objectId: 'test.0.value', lockEnabled: true, text: 'Toggle',
        }, 0, false, { autoLockAfter: 1 });
        action.onClick();
        expect(setValue).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(1);
        iconList.componentWillUnmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

// The tests above name five widgets by hand, which is exactly how the two setInterval owners
// stayed uncovered for so long. A leaked interval is the worst of the bunch: a timeout fires once
// and is gone, an interval keeps re-rendering a dead widget for as long as the page is open.
describe('interval owners release their timer', () => {
    it('stops the calendar minute clock', () => {
        vi.useFakeTimers();
        const calendar = fixture<{ syncClock: (needed: boolean) => void; componentWillUnmount: () => void }>(
            new MaterialDesignCalendar(fixture<ConstructorParameters<typeof MaterialDesignCalendar>[0]>({ context: {} })),
        );

        calendar.syncClock(true);
        expect(vi.getTimerCount()).toBe(1);
        // Switching to a month view (or turning the now indicator off) has to stop it too, not
        // just unmounting — otherwise it re-renders once a minute for an indicator nobody draws.
        calendar.syncClock(false);
        expect(vi.getTimerCount()).toBe(0);

        calendar.syncClock(true);
        calendar.componentWillUnmount();
        vi.runOnlyPendingTimers();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops the line-history refresh interval', () => {
        vi.useFakeTimers();
        const chart = new MaterialDesignChartLineHistory(fixture<ConstructorParameters<typeof MaterialDesignChartLineHistory>[0]>({ context: {} }));
        chart.state = fixture<typeof chart.state>({ rxData: { refreshMethod: 'timeInterval', refreshTimeInterval: '1 minute' }, values: {} });

        fixture<{ update: () => void }>(chart).update();
        expect(vi.getTimerCount()).toBe(1);

        chart.componentWillUnmount();
        vi.runOnlyPendingTimers();
        expect(vi.getTimerCount()).toBe(0);
    });
});

// A widget that starts a timer, subscribes to an event or attaches an observer and then forgets
// componentWillUnmount leaks it — and a componentWillUnmount that does not chain to super skips
// the base class cleanup instead. Neither shows up in a render test, and neither is something the
// five cases above would catch for a widget added next year.
describe('every widget that starts work can stop it', () => {
    const sources = import.meta.glob<string>('./MaterialDesign*.tsx', { eager: true, query: '?raw', import: 'default' });
    const code = (text: string): string => text.replace(/^\s*\/\/.*$/gm, '');
    const STARTS_WORK = /\b(?:setTimeout|setInterval|requestAnimationFrame|addEventListener)\s*\(|new (?:Resize|Mutation|Intersection)Observer\b/;

    const owners = Object.entries(sources).filter(([, text]) => STARTS_WORK.test(code(text)));

    it('finds the widgets that start work', () => {
        expect(owners.length).toBeGreaterThan(5);
    });

    it.each(owners)('%s declares componentWillUnmount and chains to super', (_file, text) => {
        const body = code(text);
        expect(body).toContain('componentWillUnmount');
        expect(/super\.componentWillUnmount\??\.?\(\)/.test(body)).toBe(true);
    });
});
