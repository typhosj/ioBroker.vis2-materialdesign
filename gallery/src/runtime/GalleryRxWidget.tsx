import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import React from 'react';

import type { FakeSocket, StateCallback } from './fakeSocket';
import { translate } from './i18n';
import { subscribedIds } from './widgetInfo';

export interface GalleryContext {
    socket: FakeSocket;
    themeType: 'light' | 'dark';
    activeView: string;
    setValue(id: string, value: ioBroker.StateValue): void;
    changeView(view: string): void;
    renderView(view: string, props?: Record<string, unknown>): React.ReactElement;
}

export interface GalleryWidgetProps { id: string; tpl: string; view: string; data: Record<string, unknown>; style: React.CSSProperties; context: GalleryContext; editMode: false }

interface GalleryWidgetState { rxData: Record<string, unknown>; rxStyle: React.CSSProperties; values: Record<string, unknown>; visible: boolean; editMode: false }

// Clean-room stand-in for vis-2's VisRxWidget (CC BY-NC, not copied). Covers what the widgets use:
// GALLERY_SPEC.md section 2.1. Known limit: no bindings, no visibility conditions, no widget groups.
export class GalleryRxWidget extends React.Component<GalleryWidgetProps, GalleryWidgetState> {
    refService = React.createRef<HTMLDivElement>();
    private subscribed: string[] = [];
    private mounted = false;

    constructor(props: GalleryWidgetProps) {
        super(props);
        this.state = { rxData: props.data, rxStyle: props.style, values: {}, visible: true, editMode: false };
    }

    static t(key: string, ...args: string[]): string {
        return translate(key, ...args);
    }

    private widgetInfo(): RxWidgetInfo | undefined {
        return (this.constructor as { getWidgetInfo?: () => RxWidgetInfo }).getWidgetInfo?.();
    }

    private onStateChanged: StateCallback = (id, state) => {
        if (!this.mounted) return;
        this.setState(prev => ({
            values: { ...prev.values, [`${id}.val`]: state?.val, [`${id}.ack`]: state?.ack, [`${id}.ts`]: state?.ts, [`${id}.lc`]: state?.lc, [`${id}.q`]: state?.q, [`${id}.from`]: state?.from },
        }));
    };

    private syncSubscriptions(data: Record<string, unknown>): void {
        const info = this.widgetInfo();
        const next = info ? subscribedIds(info, data) : [];
        const { socket } = this.props.context;
        this.subscribed.filter(id => !next.includes(id)).forEach(id => socket.unsubscribeState(id, this.onStateChanged));
        const added = next.filter(id => !this.subscribed.includes(id));
        this.subscribed = next;
        if (added.length) void socket.subscribeState(added, this.onStateChanged);
    }

    componentDidMount(): void {
        this.mounted = true;
        this.syncSubscriptions(this.state.rxData);
    }

    componentDidUpdate(prevProps: GalleryWidgetProps): void {
        if (prevProps.data === this.props.data && prevProps.style === this.props.style) return;
        const prevRxData = this.state.rxData;
        this.setState({ rxData: this.props.data, rxStyle: this.props.style }, () => {
            this.syncSubscriptions(this.props.data);
            if (prevProps.data !== this.props.data) this.onRxDataChanged(prevRxData);
        });
    }

    componentWillUnmount(): void {
        this.mounted = false;
        this.subscribed.forEach(id => this.props.context.socket.unsubscribeState(id, this.onStateChanged));
        this.subscribed = [];
    }

    onRxDataChanged(_prevRxData: Record<string, unknown>): void {}

    getWidgetView(view: string, props?: Record<string, unknown>): React.ReactElement {
        return this.props.context.renderView(view, props);
    }

    renderWidgetBody(_props: unknown): React.ReactNode {
        return null;
    }

    render(): React.ReactNode {
        const { id, style } = this.props;
        return (
            <div className="vis-widget" id={id} ref={this.refService} style={{ position: 'absolute', boxSizing: 'border-box', ...style }}>
                {this.renderWidgetBody({ ...this.props, style, className: '' })}
            </div>
        );
    }
}

export function installShim(): void {
    Object.defineProperty(window, 'visRxWidget', { configurable: true, value: GalleryRxWidget });
}
