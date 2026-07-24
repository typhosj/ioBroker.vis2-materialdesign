import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { squarePreview, BaseRxData, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, iconField } from './widgetUtils';
import { m3ColorExplicit, renderIcon } from './MaterialDesignButtons';

interface IconData extends BaseRxData {
    mdwIcon?: string;
    mdwIconSize?: number;
    mdwIconColor?: string;
}

const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        fields: [
            iconField('mdwIcon', 'mdwIcon', 'material-design'),
            { name: 'mdwIconSize', label: 'mdwIconSize', type: 'number' },
            { name: 'mdwIconColor', label: 'mdwIconColor', type: 'color' },
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
            ...createInfo('tplVis2-materialdesign-Icon', 'Icon', attrs),
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
        // Material 3 (Phase 4, ../../MATERIAL3_PLAN.md): default icon color from the primary token;
        // an explicit saved color still wins per the token-precedence rule (m3ColorExplicit).
        const isM3 = designStyle(data as unknown as Record<string, unknown>) === 'material3';
        const iconColor = isM3 && !m3ColorExplicit(data.mdwIconColor) ? 'var(--md-sys-color-primary)' : data.mdwIconColor || '#44739e';
        const icon = renderIcon(data.mdwIcon || 'material-design', iconColor, Number(data.mdwIconSize) || 50);

        return (
            <div
                className={`materialdesign-widget materialdesign-icon${isM3 ? ` ${designStyleClasses(data as unknown as Record<string, unknown>, this.isDarkTheme())}` : ''}`}
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
