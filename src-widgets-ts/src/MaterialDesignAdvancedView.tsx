import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { createInfo, RenderProps, stateValue, VisWidget } from "./widgetUtils";

type Kind = "state" | "state8";
type Data = Record<string, unknown>;
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const n = (v: unknown, d = 0): number =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
const b = (v: unknown, d = false): boolean =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";

export function advancedViewInfo(kind: Kind): RxWidgetInfo {
  const state8 = kind === "state8";
  return {
    ...createInfo(
      `tplVis2-materialdesign-view-in-widget${state8 ? "8" : ""}`,
      state8 ? "Advanced View in Widget 8" : "Advanced View in Widget",
      state8
        ? [
            {
              name: "common",
              fields: [
                { name: "oid", label: "oid", type: "id" },
                { name: "persistent", label: "persistent", type: "checkbox" },
                {
                  name: "notIfInvisible",
                  label: "notIfInvisible",
                  type: "checkbox",
                },
                {
                  name: "fadeInDuration",
                  label: "fadeInDuration",
                  type: "number",
                  default: 50,
                },
                {
                  name: "fadeOutDuration",
                  label: "fadeOutDuration",
                  type: "number",
                  default: 50,
                },
                { name: "debug", label: "debug", type: "checkbox" },
                { name: "count", label: "count", type: "number", default: 1 },
              ],
            },
            {
              name: "views",
              label: "group_views",
              indexFrom: 0,
              indexTo: "count",
              fields: [
                {
                  name: "contains_view_",
                  label: "contains_view_",
                  type: "views",
                },
              ],
            },
          ]
        : [
            {
              name: "common",
              fields: [
                { name: "oid", label: "oid", type: "id" },
                {
                  name: "fadeInDuration",
                  label: "fadeInDuration",
                  type: "number",
                  default: 50,
                },
                {
                  name: "fadeOutDuration",
                  label: "fadeOutDuration",
                  type: "number",
                  default: 50,
                },
                {
                  name: "fadeEffect",
                  label: "fadeEffect",
                  type: "select",
                  options: ["linear", "swing"],
                  default: "swing",
                },
                {
                  name: "renderAlways",
                  label: "renderAlways",
                  type: "checkbox",
                },
                {
                  name: "countRenderViewsOnLoad",
                  label: "countRenderViewsOnLoad",
                  type: "number",
                },
                {
                  name: "slowConnection",
                  label: "slowConnection",
                  type: "checkbox",
                },
                {
                  name: "hideErrorMessage",
                  label: "hideErrorMessage",
                  type: "checkbox",
                },
                { name: "debug", label: "debug", type: "checkbox" },
              ],
            },
            {
              name: "renderViewsOnLoad",
              label: "group_renderViewsOnLoad",
              indexFrom: 0,
              indexTo: "countRenderViewsOnLoad",
              fields: [{ name: "View", label: "View", type: "views" }],
            },
          ],
    ),
    visPrev: '<img src="widgets/basic/img/Prev_ContainerView.png"></img>',
    visDefaultStyle: { width: 400, height: 270 },
  };
}

export class MaterialDesignAdvancedView extends VisWidget {
  private widgetId = "materialdesign-advanced-view";
  private readonly rendered = new Set<string>();
  constructor(
    props: any,
    private readonly kind: Kind,
  ) {
    super(props);
  }
  getWidgetInfo(): RxWidgetInfo {
    return advancedViewInfo(this.kind);
  }
  componentDidMount(): void {
    super.componentDidMount();
    this.renderViews();
  }
  componentDidUpdate(): void {
    this.renderViews();
  }
  private selected(data: Data): string {
    const value = stateValue(this.state as VisRxWidgetState, s(data.oid));
    const index =
      value === true || value === "true"
        ? 1
        : value === false || value === "false"
          ? 0
          : Math.max(0, Math.floor(n(value)));
    return this.kind === "state8"
      ? s(data[`contains_view_${index}`])
      : s(value);
  }
  private candidates(data: Data): string[] {
    if (this.kind === "state8")
      return Array.from(
        new Set(
          Array.from(
            { length: Math.max(0, Math.floor(n(data.count, 1))) + 1 },
            (_, index) => s(data[`contains_view_${index}`]),
          ).filter(Boolean),
        ),
      );
    if (!b(data.renderAlways)) return [this.selected(data)].filter(Boolean);
    return Array.from(
      new Set(
        [
          this.selected(data),
          ...Array.from(
            {
              length:
                Math.max(0, Math.floor(n(data.countRenderViewsOnLoad))) + 1,
            },
            (_, index) => s(data[`View${index}`]),
          ),
        ].filter(Boolean),
      ),
    );
  }
  private renderViews(): void {
    const data = this.state.rxData as unknown as Data;
    const vis = (
      window as unknown as {
        vis?: { renderView?: (target: string, view: string) => void };
      }
    ).vis;
    if (!vis?.renderView) return;
    this.candidates(data).forEach((view, index) => {
      const target = `${this.widgetId}-${index}`;
      const signature = `${target}:${view}`;
      if (!this.rendered.has(signature)) {
        vis.renderView(target, view);
        this.rendered.add(signature);
      }
    });
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    this.widgetId = props.id;
    const data = this.state.rxData as unknown as Data;
    const selected = this.selected(data);
    const views = this.candidates(data);
    const duration = Math.max(0, n(data.fadeInDuration, 50));
    return (
      <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
        {views.length ? (
          views.map((view, index) => (
            <div
              key={`${index}:${view}`}
              id={`${this.widgetId}-${index}`}
              style={{
                display: view === selected ? "block" : "none",
                height: "100%",
                opacity: view === selected ? 1 : 0,
                transition: `opacity ${duration}ms ${s(data.fadeEffect, "ease")}`,
              }}
            />
          ))
        ) : !b(data.hideErrorMessage) ? (
          <span className="container-error">error: view not found.</span>
        ) : null}
      </div>
    );
  }
}
