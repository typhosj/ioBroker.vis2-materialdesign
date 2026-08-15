import React from "react";
import { MAX_DYNAMIC_ITEMS, squarePreview, boundedCount, createInfo, indexedFields, itemCount, RenderProps, stateValue, VisWidget } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";

type Kind = "state" | "state8";
type Data = Record<string, unknown>;
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
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
              fields: indexedFields(
                [
                  {
                    name: "contains_view_",
                    label: "contains_view_",
                    type: "views",
                  },
                ],
                data => itemCount(data.count),
              ),
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
                // `slowConnection` is gone: it delayed the legacy `vis.renderView` network path,
                // which VIS2 does not have — views are embedded from the loaded project.
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
              fields: indexedFields([{ name: "View", label: "View", type: "views" }], data =>
                boundedCount(data.countRenderViewsOnLoad, 0, MAX_DYNAMIC_ITEMS),
              ),
            },
          ],
    ),
    visPrev: squarePreview('F056A'),
    visDefaultStyle: { width: 400, height: 270 },
  };
}

const fadeCss = `@keyframes mdw-view-fade-in{from{opacity:0}to{opacity:1}}@keyframes mdw-view-fade-out{from{opacity:1}to{opacity:0}}`;
// jQuery easings, kept as option values for the old configs; `swing` is no CSS timing function, and
// an invalid one drops the whole animation.
const easings: Record<string, string> = { linear: "linear", swing: "ease-in-out" };

export class MaterialDesignAdvancedView extends VisWidget {
  private widgetId = "materialdesign-advanced-view";
  private shown = "";
  private outgoing = "";
  private fadeTimer?: number;
  constructor(
    props: any,
    private readonly kind: Kind,
  ) {
    super(props);
  }
  getWidgetInfo(): RxWidgetInfo {
    return advancedViewInfo(this.kind);
  }
  componentWillUnmount(): void {
    if (this.fadeTimer) window.clearTimeout(this.fadeTimer);
    super.componentWillUnmount();
  }
  // Native VIS2 child-view embedding (legacy vis.renderView is a stub in VIS2).
  private embed(view: string): React.JSX.Element {
    return (
      this as unknown as {
        getWidgetView: (
          v: string,
          p?: Record<string, unknown>,
        ) => React.JSX.Element;
      }
    ).getWidgetView(view, { style: { width: "100%", height: "100%" } });
  }
  private selected(data: Data): string {
    const value = stateValue(this.state, s(data.oid));
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
      // Without `persistent` only the selected view is mounted; the others are built on demand.
      return b(data.persistent)
        ? Array.from(
            new Set(
              Array.from(
                { length: itemCount(data.count) },
                (_, index) => s(data[`contains_view_${index}`]),
              ).filter(Boolean),
            ),
          )
        : [this.selected(data)].filter(Boolean);
    if (!b(data.renderAlways)) return [this.selected(data)].filter(Boolean);
    return Array.from(
      new Set(
        [
          this.selected(data),
          ...Array.from(
            {
              length: boundedCount(data.countRenderViewsOnLoad, 0, MAX_DYNAMIC_ITEMS),
            },
            (_, index) => s(data[`View${index}`]),
          ),
        ].filter(Boolean),
      ),
    );
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    this.widgetId = props.id;
    const data = this.state.rxData as unknown as Data;
    // A hidden widget keeps its child views mounted and running; `notIfInvisible` drops them.
    if (b(data.notIfInvisible) && !this.state.visible) {
      this.shown = "";
      this.outgoing = "";
      return <div style={{ height: "100%", width: "100%" }} />;
    }
    const selected = this.selected(data);
    const fadeIn = Math.max(0, n(data.fadeInDuration, 50));
    const fadeOut = Math.max(0, n(data.fadeOutDuration, 50));
    const easing = easings[s(data.fadeEffect, "swing")] || "ease-in-out";
    if (selected !== this.shown) {
      if (b(data.debug))
        console.log(
          `materialdesign ${props.id}: ${s(data.oid) || "no oid"} = ${JSON.stringify(stateValue(this.state, s(data.oid)))} -> view ${selected ? `"${selected}"` : "not found"}`,
        );
      // The view that just lost the state stays mounted until its fade-out ended.
      this.outgoing = this.shown;
      this.shown = selected;
      if (this.fadeTimer) window.clearTimeout(this.fadeTimer);
      this.fadeTimer = this.outgoing
        ? window.setTimeout(() => {
            this.fadeTimer = undefined;
            this.outgoing = "";
            this.forceUpdate();
          }, fadeOut)
        : undefined;
    }
    const candidates = this.candidates(data);
    const views = this.outgoing && !candidates.includes(this.outgoing) ? [...candidates, this.outgoing] : candidates;
    return (
      <div style={{ height: "100%", position: "relative", width: "100%", overflow: "hidden" }}>
        <style>{fadeCss}</style>
        {views.length ? (
          views.map((view, index) => (
            <div
              // Keyed by name, not by position: the outgoing view moves in the list and must not remount.
              key={view}
              id={`${this.widgetId}-${index}`}
              style={{
                // Stacked, not toggled through `display`, which cannot animate at all.
                animation: view === selected
                  ? `mdw-view-fade-in ${fadeIn}ms ${easing} both`
                  : view === this.outgoing
                    ? `mdw-view-fade-out ${fadeOut}ms ${easing} both`
                    : undefined,
                height: "100%",
                inset: 0,
                opacity: view === selected || view === this.outgoing ? undefined : 0,
                pointerEvents: view === selected ? undefined : "none",
                position: "absolute",
                visibility: view === selected || view === this.outgoing ? undefined : "hidden",
              }}
            >
              {this.embed(view)}
            </div>
          ))
        ) : !b(data.hideErrorMessage) ? (
          <span className="container-error">error: view not found.</span>
        ) : null}
      </div>
    );
  }
}
