import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { createInfo, RenderProps, stateValue, VisWidget } from "./widgetUtils";

type Kind = "masonry" | "grid";
type Data = Record<string, unknown> & { countViews?: number };
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const n = (v: unknown, d = 0): number =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);

const visibilityFields = [
  {
    name: "visibleResolutionGreaterThan",
    label: "visibleResolutionGreaterThan",
    type: "number" as const,
  },
  {
    name: "visibleResolutionLessThan",
    label: "visibleResolutionLessThan",
    type: "number" as const,
  },
  { name: "visibilityOid", label: "visibilityOid", type: "id" as const },
  {
    name: "visibilityCondition",
    label: "visibilityCondition",
    type: "select" as const,
    options: [
      "==",
      "!=",
      "<=",
      ">=",
      "<",
      ">",
      "consist",
      "not consist",
      "exist",
      "not exist",
    ],
    default: "==",
  },
  {
    name: "visibilityConditionValue",
    label: "visibilityConditionValue",
    type: "text" as const,
  },
];
const breakpoints = [
  {
    name: "handySettings",
    label: "group_handySettings",
    fields: [
      {
        name: "handyPortraitWidth",
        label: "handyPortraitWidth",
        type: "number" as const,
      },
      {
        name: "handyPortraitCols",
        label: "handyPortraitCols",
        type: "number" as const,
      },
      {
        name: "handyPortraitGaps",
        label: "handyPortraitGaps",
        type: "number" as const,
      },
      {
        name: "handyLandscapeWidth",
        label: "handyLandscapeWidth",
        type: "number" as const,
      },
      {
        name: "handyLandscapeCols",
        label: "handyLandscapeCols",
        type: "number" as const,
      },
      {
        name: "handyLandscapeGaps",
        label: "handyLandscapeGaps",
        type: "number" as const,
      },
    ],
  },
  {
    name: "tabletSettings",
    label: "group_tabletSettings",
    fields: [
      {
        name: "tabletPortraitWidth",
        label: "tabletPortraitWidth",
        type: "number" as const,
      },
      {
        name: "tabletPortraitCols",
        label: "tabletPortraitCols",
        type: "number" as const,
      },
      {
        name: "tabletPortraitGaps",
        label: "tabletPortraitGaps",
        type: "number" as const,
      },
      {
        name: "tabletLandscapeWidth",
        label: "tabletLandscapeWidth",
        type: "number" as const,
      },
      {
        name: "tabletLandscapeCols",
        label: "tabletLandscapeCols",
        type: "number" as const,
      },
      {
        name: "tabletLandscapeGaps",
        label: "tabletLandscapeGaps",
        type: "number" as const,
      },
    ],
  },
];
const gridBreakpoints = [
  {
    name: "handySettings",
    label: "group_handySettings",
    fields: [
      {
        name: "handyGridPortraitColSpan",
        label: "handyGridPortraitColSpan",
        type: "number" as const,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        name: "handyPortraitWidth",
        label: "handyPortraitWidth",
        type: "number" as const,
      },
      {
        name: "handyPortraitGaps",
        label: "handyPortraitGaps",
        type: "number" as const,
      },
      {
        name: "handyGridLandscapeColSpan",
        label: "handyGridLandscapeColSpan",
        type: "number" as const,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        name: "handyLandscapeWidth",
        label: "handyLandscapeWidth",
        type: "number" as const,
      },
      {
        name: "handyLandscapeGaps",
        label: "handyLandscapeGaps",
        type: "number" as const,
      },
    ],
  },
  {
    name: "tabletSettings",
    label: "group_tabletSettings",
    fields: [
      {
        name: "tabletGridPortraitColSpan",
        label: "tabletGridPortraitColSpan",
        type: "number" as const,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        name: "tabletPortraitWidth",
        label: "tabletPortraitWidth",
        type: "number" as const,
      },
      {
        name: "tabletPortraitGaps",
        label: "tabletPortraitGaps",
        type: "number" as const,
      },
      {
        name: "tabletGridLandscapeColSpan",
        label: "tabletGridLandscapeColSpan",
        type: "number" as const,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        name: "tabletLandscapeWidth",
        label: "tabletLandscapeWidth",
        type: "number" as const,
      },
      {
        name: "tabletLandscapeGaps",
        label: "tabletLandscapeGaps",
        type: "number" as const,
      },
    ],
  },
];

export function viewsInfo(kind: Kind): RxWidgetInfo {
  const masonry = kind === "masonry";
  const common = masonry
    ? [
        { name: "countCols", label: "countCols", type: "number" as const },
        { name: "desktopGaps", label: "desktopGaps", type: "number" as const },
        {
          name: "countViews",
          label: "countViews",
          type: "number" as const,
          default: 3,
        },
        {
          name: "viewAlignment",
          label: "viewAlignment",
          type: "select" as const,
          options: ["left", "center", "right", "justify"],
          default: "center",
        },
        {
          name: "showResolutionAssistant",
          label: "showResolutionAssistant",
          type: "checkbox" as const,
          default: true,
        },
        { name: "debug", label: "debug", type: "checkbox" as const },
      ]
    : [
        {
          name: "countViews",
          label: "countViews",
          type: "number" as const,
          default: 3,
        },
        { name: "desktopGaps", label: "desktopGaps", type: "number" as const },
        {
          name: "viewVertAlignment",
          label: "viewVertAlignment",
          type: "select" as const,
          options: ["center", "flex-start", "flex-end"],
          default: "center",
        },
        {
          name: "viewHorAlignment",
          label: "viewHorAlignment",
          type: "select" as const,
          options: [
            "center",
            "flex-start",
            "flex-end",
            "space-around",
            "space-between",
          ],
          default: "center",
        },
        {
          name: "viewColSpan",
          label: "viewColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        {
          name: "showResolutionAssistant",
          label: "showResolutionAssistant",
          type: "checkbox" as const,
          default: true,
        },
        { name: "debug", label: "debug", type: "checkbox" as const },
      ];
  const settings = masonry ? breakpoints : gridBreakpoints;
  const itemFields = masonry
    ? [
        { name: "View", label: "View", type: "views" as const },
        { name: "viewsHeight", label: "viewsHeight", type: "number" as const },
        { name: "viewsWidth", label: "viewsWidth", type: "dimension" as const },
        {
          name: "viewSortOrder",
          label: "viewSortOrder",
          type: "number" as const,
        },
        ...visibilityFields,
      ]
    : [
        { name: "View", label: "View", type: "views" as const },
        { name: "viewsHeight", label: "viewsHeight", type: "number" as const },
        {
          name: "viewSortOrder",
          label: "viewSortOrder",
          type: "number" as const,
        },
        {
          name: "viewColSpan",
          label: "viewColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        {
          name: "handyGridPortraitColSpan",
          label: "handyGridPortraitColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        {
          name: "handyGridLandscapeColSpan",
          label: "handyGridLandscapeColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        {
          name: "tabletGridPortraitColSpan",
          label: "tabletGridPortraitColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        {
          name: "tabletGridLandscapeColSpan",
          label: "tabletGridLandscapeColSpan",
          type: "number" as const,
          min: 1,
          max: 12,
          step: 1,
        },
        ...visibilityFields,
      ];
  return {
    ...createInfo(
      `tplVis2-materialdesign-${masonry ? "Masonry-Views" : "Grid-Views"}`,
      masonry ? "Masonry Views" : "Grid Views",
      [
        { name: "common", fields: common },
        ...settings,
        {
          name: "View",
          label: "group_View",
          indexFrom: 0,
          indexTo: "countViews",
          fields: itemFields,
        },
      ],
    ),
    visPrev: `<img src="widgets/materialdesign/img/prev_${masonry ? "masonry" : "grid"}_views.png"></img>`,
    visDefaultStyle: { width: "100%", height: "100%" },
  };
}

function visible(
  value: unknown,
  condition: string,
  expected: unknown,
): boolean {
  switch (condition) {
    case "!=":
      return String(value) !== String(expected);
    case "<=":
      return n(value) <= n(expected);
    case ">=":
      return n(value) >= n(expected);
    case "<":
      return n(value) < n(expected);
    case ">":
      return n(value) > n(expected);
    case "consist":
      return String(value).includes(String(expected));
    case "not consist":
      return !String(value).includes(String(expected));
    case "exist":
      return value !== undefined && value !== null;
    case "not exist":
      return value === undefined || value === null;
    default:
      return String(value) === String(expected);
  }
}

export class MaterialDesignViews extends VisWidget {
  private readonly root = React.createRef<HTMLDivElement>();
  private readonly rendered = new Set<string>();
  private width = 0;
  private widgetId = "materialdesign-views";
  private observer?: ResizeObserver;
  constructor(
    props: any,
    private readonly kind: Kind,
  ) {
    super(props);
  }
  getWidgetInfo(): RxWidgetInfo {
    return viewsInfo(this.kind);
  }
  componentDidMount(): void {
    super.componentDidMount();
    this.observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width || 0);
      if (width && width !== this.width) {
        this.width = width;
        this.forceUpdate();
      }
    });
    if (this.root.current) this.observer.observe(this.root.current);
    this.renderViews();
  }
  componentDidUpdate(): void {
    this.renderViews();
  }
  componentWillUnmount(): void {
    this.observer?.disconnect();
    super.componentWillUnmount?.();
  }
  private renderViews(): void {
    const d = this.state.rxData as unknown as Data;
    const vis = (
      window as unknown as {
        vis?: { renderView?: (target: string, view: string) => void };
      }
    ).vis;
    if (!vis?.renderView) return;
    for (
      let index = 0;
      index <= Math.max(0, Math.floor(n(d.countViews, 3)));
      index++
    ) {
      const view = s(d[`View${index}`]);
      const target = `${this.widgetId}-${this.kind}-${index}`;
      if (view && !this.rendered.has(`${target}:${view}`)) {
        vis.renderView(target, view);
        this.rendered.add(`${target}:${view}`);
      }
    }
  }
  private layout(d: Data): { cols: number; gaps: number; key: string } {
    const width = this.width || this.root.current?.clientWidth || 1025;
    if (width <= n(d.handyPortraitWidth, 393))
      return {
        cols: n(d.handyPortraitCols, 1),
        gaps: n(d.handyPortraitGaps, n(d.desktopGaps)),
        key: "handyGridPortraitColSpan",
      };
    if (width <= n(d.handyLandscapeWidth, 754))
      return {
        cols: n(d.handyLandscapeCols, 2),
        gaps: n(d.handyLandscapeGaps, n(d.desktopGaps)),
        key: "handyGridLandscapeColSpan",
      };
    if (width <= n(d.tabletPortraitWidth, 768))
      return {
        cols: n(d.tabletPortraitCols, 2),
        gaps: n(d.tabletPortraitGaps, n(d.desktopGaps)),
        key: "tabletGridPortraitColSpan",
      };
    if (width <= n(d.tabletLandscapeWidth, 1024))
      return {
        cols: n(d.tabletLandscapeCols, 3),
        gaps: n(d.tabletLandscapeGaps, n(d.desktopGaps)),
        key: "tabletGridLandscapeColSpan",
      };
    return {
      cols: n(d.countCols, 3),
      gaps: n(d.desktopGaps),
      key: "viewColSpan",
    };
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    this.widgetId = props.id;
    const d = this.state.rxData as unknown as Data;
    const layout = this.layout(d);
    const count = Math.max(0, Math.floor(n(d.countViews, 3)));
    const items = Array.from({ length: count + 1 }, (_, index) => ({
      index,
      sort: n(d[`viewSortOrder${index}`], index),
    })).sort((a, b) => a.sort - b.sort);
    return (
      <div
        ref={this.root}
        style={{
          width: "100%",
          height: "100%",
          display: this.kind === "masonry" ? "grid" : "flex",
          gridTemplateColumns:
            this.kind === "masonry"
              ? `repeat(${Math.max(1, layout.cols)}, minmax(0, 1fr))`
              : undefined,
          gap: layout.gaps,
          alignItems: s(d.viewVertAlignment, "center"),
          justifyContent: s(d.viewHorAlignment, "center"),
        }}
      >
        {items.map(({ index }) => {
          const view = s(d[`View${index}`]);
          const isVisible =
            !s(d[`visibilityOid${index}`]) ||
            !visible(
              stateValue(
                this.state as VisRxWidgetState,
                s(d[`visibilityOid${index}`]),
              ),
              s(d[`visibilityCondition${index}`], "=="),
              d[`visibilityConditionValue${index}`],
            );
          const height = n(d[`viewsHeight${index}`]);
          const span = Math.max(
            1,
            Math.min(
              12,
              Math.floor(
                n(
                  d[`${layout.key}${index}`],
                  n(d[layout.key], this.kind === "grid" ? 3 : 1),
                ),
              ),
            ),
          );
          return (
            <div
              key={index}
              style={{
                display: isVisible ? "block" : "none",
                width:
                  this.kind === "masonry"
                    ? s(d[`viewsWidth${index}`], "auto")
                    : `${(span / 12) * 100}%`,
                height: height || (view ? undefined : 100),
                minHeight: view ? undefined : 100,
              }}
            >
              <div
                id={`${this.widgetId}-${this.kind}-${index}`}
                style={{
                  height: height || "100%",
                  width: "100%",
                  border: view ? undefined : "2px dashed #44739e",
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }
}
