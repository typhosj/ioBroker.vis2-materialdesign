import { afterEach, describe, expect, it, vi } from 'vitest';

import { createButtonClass } from './MaterialDesignButtons';
import MaterialDesignCard from './MaterialDesignCard';
import { MaterialDesignDialog } from './MaterialDesignDialog';
import MaterialDesignIconList from './MaterialDesignIconList';
import MaterialDesignSelect from './MaterialDesignSelect';
import { MaterialDesignViews } from './MaterialDesignViews';

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
        const props = fixture<ConstructorParameters<typeof MaterialDesignCard>[0] & Parameters<MaterialDesignCard['renderWidgetBody']>[0]>({ id: 'card', context: {} });
        const card = new MaterialDesignCard(props);
        card.state = fixture<typeof card.state>({ rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 1 } });
        card.renderWidgetBody(props);
        card.state = fixture<typeof card.state>({ rxData: { refresh_oid: 'test.0.refresh', refresh_oid_delay: 100 }, values: { 'test.0.refresh.val': 2 } });
        card.renderWidgetBody(props);
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
