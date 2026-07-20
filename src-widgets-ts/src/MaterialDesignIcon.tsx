import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { squarePreview, BaseRxData, RenderProps, VisWidget, createInfo } from './widgetUtils';
import { renderIcon } from './MaterialDesignButtons';

interface IconData extends BaseRxData {
    mdwIcon?: string;
    mdwIconSize?: number;
    mdwIconColor?: string;
}

const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            { name: 'mdwIcon', label: 'mdwIcon', type: 'icon', default: 'material-design' },
            { name: 'mdwIconSize', label: 'mdwIconSize', type: 'number' },
            { name: 'mdwIconColor', label: 'mdwIconColor', type: 'color' },
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
        ],
    },
];

export default class MaterialDesignIcon extends VisWidget {
    constructor(props: VisRxWidgetProps) {
        super(props);
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Icon', 'Material Design Icon', attrs),
            visPrev: squarePreview('F0976'),
            visDefaultStyle: {
                width: 50,
                height: 50,
            },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignIcon.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as IconData;
        const icon = renderIcon(data.mdwIcon || 'material-design', data.mdwIconColor || '#44739e', Number(data.mdwIconSize) || 50);

        return (
            <div
                className="materialdesign-widget materialdesign-icon"
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    height: '100%',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                {icon}
            </div>
        );
    }
}
