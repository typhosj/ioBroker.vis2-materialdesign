import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

export interface BaseRxData {
    oid: string;
    label: string;
    prefix: string;
    suffix: string;
    color: string;
    size: string;
    icon: string;
    value: string;
}

export interface PressState {
    active?: boolean;
    hovered?: boolean;
}

export const setColor = '#ffc107';

export const commonAttrs = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            {
                name: 'oid',
                label: 'oid',
                type: 'id',
            },
            {
                name: 'label',
                label: 'label',
                type: 'text',
                default: '',
            },
        ],
    },
];

export const valueTextAttrs = [
    ...commonAttrs,
    {
        name: 'text',
        fields: [
            {
                name: 'prefix',
                label: 'prefix',
                type: 'text',
                default: '',
            },
            {
                name: 'suffix',
                label: 'suffix',
                type: 'text',
                default: '',
            },
        ],
    },
];

export function stateValue(state: VisRxWidgetState, oid: string): ioBroker.StateValue | undefined {
    return oid ? state.values?.[`${oid}.val`] : undefined;
}

export function setStateValue(props: VisRxWidgetProps, oid: string, value: ioBroker.StateValue): void {
    const context = (props as unknown as { context?: { setValue?: (id: string, value: ioBroker.StateValue) => void } }).context;
    if (oid && context?.setValue) {
        context.setValue(oid, value);
    }
}

export function parseActionValue(value: string): ioBroker.StateValue {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (value !== '' && !Number.isNaN(Number(value))) {
        return Number(value);
    }
    return value;
}

export function card(children: React.ReactNode): React.JSX.Element {
    return <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 8 }}>{children}</div>;
}

export function createInfo(id: string, name: string, attrs: RxWidgetInfo['visAttrs']): RxWidgetInfo {
    return {
        id,
        visSet: 'vis2-materialdesign',
        visSetLabel: 'Material Design',
        visSetColor: setColor,
        visName: name,
        visAttrs: attrs,
    };
}

export const VisWidget = window.visRxWidget as typeof VisRxWidget<BaseRxData, VisRxWidgetState>;

export type RenderProps = RxRenderWidgetProps;
