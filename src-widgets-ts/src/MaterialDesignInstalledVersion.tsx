import React from 'react';

import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import { squarePreview, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses } from './widgetUtils';

export default class MaterialDesignInstalledVersion extends VisWidget {
    private version = 'x.x.x';
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-Installed-Version', 'Installed Version', []), visPrev: squarePreview('F02FD'), visDefaultStyle: { width: 120, height: 20 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignInstalledVersion.getWidgetInfo(); }
    componentDidMount(): void { super.componentDidMount(); void this.props.context?.socket?.getObject('system.adapter.vis2-materialdesign').then(obj => { this.version = String(obj?.common?.installedVersion || obj?.common?.version || 'unknown'); this.forceUpdate(); }).catch(() => undefined); }
    renderWidgetBody(props: RenderProps): React.JSX.Element { super.renderWidgetBody(props); const data = this.state.rxData as unknown as Record<string, unknown>; const isM3 = designStyle(data) === 'material3'; const pill = { color: '#fff', fontSize: 12, lineHeight: '18px', padding: '2px 8px', whiteSpace: 'nowrap' as const }; const label = isM3 ? { background: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface)' } : { background: '#5a5a5a' }; const value = isM3 ? { background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' } : { background: '#45b31b' }; return <div className={`materialdesign-widget materialdesign-installed-version${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ''}`} style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', textAlign: 'center', width: '100%' }}><div className="materialdesign-version-container" style={{ display: 'inline-flex' }}><div className="materialdesign-version-content" style={{ ...pill, ...label, borderRadius: '4px 0 0 4px' }}>installed</div><div className="materialdesign-version-content" style={{ ...pill, ...value, borderRadius: '0 4px 4px 0' }}>{this.version}</div></div></div>; }
}
