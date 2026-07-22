import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import {
    BaseRxData,
    PressState,
    RenderProps,
    VisWidget,
    card,
    commonAttrs,
    createInfo,
    parseActionValue,
    setStateValue,
} from './widgetUtils';

const attrs = [
    ...commonAttrs,
    {
        name: 'action',
        fields: [
            {
                name: 'value',
                label: 'value',
                type: 'text',
                default: 'true',
            },
        ],
    },
];

export default class MaterialDesignButton extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return createInfo('tplMaterialDesignButton', 'Button', attrs);
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignButton.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as BaseRxData;
        const pressState = this.state as PressState;
        const background = pressState.active ? '#0d47a1' : pressState.hovered ? '#1565c0' : '#1976d2';
        const writeValue = (): void => setStateValue(this.props, data.oid, parseActionValue(data.value));

        return card(
            <button
                type="button"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    borderRadius: 4,
                    background,
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    transform: pressState.active ? 'translateY(1px)' : 'none',
                    transition: 'background 120ms ease, transform 80ms ease',
                }}
                onMouseEnter={() => this.setState({ hovered: true })}
                onMouseLeave={() => this.setState({ active: false, hovered: false })}
                onMouseDown={() => this.setState({ active: true })}
                onMouseUp={() => {
                    this.setState({ active: false });
                    writeValue();
                }}
                onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        this.setState({ active: true });
                    }
                }}
                onKeyUp={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        this.setState({ active: false });
                        writeValue();
                    }
                }}
                onTouchStart={() => this.setState({ active: true })}
                onTouchEnd={() => {
                    this.setState({ active: false });
                    writeValue();
                }}
            >
                {data.label || 'Button'}
            </button>,
        );
    }
}
