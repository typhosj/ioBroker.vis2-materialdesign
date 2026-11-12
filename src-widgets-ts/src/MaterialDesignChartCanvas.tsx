import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController, LineController, PieController, DoughnutController,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Legend, Title, Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { RxWidgetInfo } from "@iobroker/types-vis-2";

import { boolValue, designStyle, designStyleClasses, legacySurface, m3OnColor, numberValue, optionalNumber, sanitizeHtml, stateValue, textValue, visLocale, VisWidget, type RenderProps } from "./widgetUtils";
import { CHART_TEXT_COLOR, m3ChartColors } from "./chartAxis";
import { scheme } from "./MaterialDesignColorScheme";

// The shared coercions all take a fallback. `optionalNumber` (in widgetUtils, next to them) and this
// one are the other half: a field the user left empty has to stay `undefined` so the key is omitted
// from the chart.js config entirely, rather than overwriting a chart.js default with a zero.
const optionalText = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

// Deliberately not `chart.js/auto`, which drags in the radar/polar/bubble/scatter/time engine we
// never draw (~2x the gzip). The guard is for vitest/jsdom, whose resolver loads a build without
// these named exports; charts never render in the unit tests.
if (typeof (Chart as { register?: unknown }).register === "function") {
  Chart.register(
    BarController, LineController, PieController, DoughnutController,
    ArcElement, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale,
    Filler, Legend, Title, Tooltip,
    // Without registering the plugin, `Chart.defaults.plugins.datalabels` does not exist and the spread
    // below replaces the whole default set with a lone `color` — no value label is ever drawn.
    ChartDataLabels,
  );
}

// Value labels sit ON the drawn element, so a fixed color is unreadable on half the palette.
export function labelColorFor(context: { dataIndex: number; dataset?: { backgroundColor?: unknown }; chart?: { canvas?: HTMLCanvasElement } }): string {
  const background = context.dataset?.backgroundColor;
  let color = Array.isArray(background) ? background[context.dataIndex] : background;
  // M3 paths pass tokens, which no color parser reads — resolve them off the canvas, where the
  // widget root's custom properties are in scope.
  const token = typeof color === "string" && color.match(/^var\((--[^),]+)/)?.[1];
  if (token && context.chart?.canvas) color = getComputedStyle(context.chart.canvas).getPropertyValue(token).trim();
  return (typeof color === "string" && m3OnColor(color)) || "#000";
}

if (Chart.defaults.plugins) {
  (Chart.defaults.plugins as { datalabels?: { color?: unknown } }).datalabels = {
    ...(Chart.defaults.plugins as { datalabels?: object }).datalabels,
    color: labelColorFor,
  };
}

// chart.js hands the datalabels callbacks a `datasetIndex` too; `labelColorFor` has no use for it,
// so it is added here rather than widening that function's contract.
type LabelContext = Parameters<typeof labelColorFor>[0] & { datasetIndex?: number };

// `valuesSteps` thins the labels out (every n-th item); 0/1 shows all.
// `label` receives the whole chart.js context, not just the data index: a chart with more than one
// dataset (the JSON chart) needs `datasetIndex` to find its value; single-dataset charts ignore it.
export function datalabelsConfig(
  data: Record<string, unknown>,
  label: (context: LabelContext) => { text: string; color?: string },
  defaults: { align: string; anchor: string },
): object {
  const show = textValue(data.showValues, "showValuesOn");
  const steps = Math.max(1, numberValue(data.valuesSteps, 1));
  const visible = show === "showValuesAuto" ? "auto" : true;
  const align = textValue(data.valuesPositionAlign, defaults.align);
  const anchor = textValue(data.valuesPositionAnchor, defaults.anchor);
  // `labelColorFor` only reads right while the label sits ON the element (align/anchor center). The
  // bar default parks it above the bar, where the contrast pick produced white on white.
  const onElement = align === "center" || anchor === "center";
  const offElementColor = (context: LabelContext): string => {
    const canvas = context.chart?.canvas;
    const token = canvas && designStyle(data) === "material3" ? getComputedStyle(canvas).getPropertyValue("--md-sys-color-on-surface").trim() : "";
    return token || CHART_TEXT_COLOR;
  };
  return {
    align,
    anchor,
    backgroundColor: textValue(data.valuesBackgroundColor) || null,
    borderColor: textValue(data.valuesBorderColor) || null,
    borderRadius: numberValue(data.valuesBorderRadius),
    borderWidth: numberValue(data.valuesBorderWidth),
    color: (context: LabelContext): string => label(context).color || (onElement ? labelColorFor(context) : offElementColor(context)),
    display: show === "showValuesOff" ? false : (context: LabelContext): boolean | string => (context.dataIndex % steps === 0 ? visible : false),
    font: { family: textValue(data.valuesFontFamily) || undefined, size: numberValue(data.valuesFontSize, 12) },
    formatter: (_value: unknown, context: LabelContext): string => label(context).text,
    offset: numberValue(data.valuesPositionOffset, 4),
    rotation: numberValue(data.valuesRotation),
    textAlign: textValue(data.valuesTextAlign, "center"),
  };
}

// chart.js paints the canvas, never the plot rectangle, so `chartAreaBackgroundColor` needs a plugin
// of its own. Reads `options.plugins.mdwChartArea.color`.
const chartAreaBackground = {
  id: "mdwChartArea",
  beforeDraw(chart: Chart, _args: unknown, options: { color?: unknown }): void {
    const color = typeof options?.color === "string" ? options.color : "";
    const area = chart.chartArea;
    if (!color || !area) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    ctx.restore();
  },
};

// The tooltip options were declared on every chart widget but never handed to chart.js, so only
// `showTooltip` did anything. Unset entries are left out, otherwise they overwrite chart.js defaults.
export function tooltipConfig(data: Record<string, unknown>, callbacks?: object): object {
  const enabled = boolValue(data.showTooltip, true);
  const config: Record<string, unknown> = { enabled, mode: optionalText(data.tooltipMode) || "nearest" };
  const put = (key: string, value: unknown): void => { if (value !== undefined) config[key] = value; };
  put("position", optionalText(data.tooltipPosition) || "nearest");
  put("bodyAlign", optionalText(data.tooltipBodyAlignment));
  put("backgroundColor", optionalText(data.tooltipBackgroundColor));
  put("titleColor", optionalText(data.tooltipTitleFontColor));
  put("bodyColor", optionalText(data.tooltipBodyFontColor));
  const titleFont = { family: optionalText(data.tooltipTitleFontFamily), size: optionalNumber(data.tooltipTitleFontSize) };
  const bodyFont = { family: optionalText(data.tooltipBodyFontFamily), size: optionalNumber(data.tooltipBodyFontSize) };
  if (titleFont.family || titleFont.size) config.titleFont = titleFont;
  if (bodyFont.family || bodyFont.size) config.bodyFont = bodyFont;
  put("caretSize", optionalNumber(data.tooltipArrowSize));
  put("caretPadding", optionalNumber(data.tooltipDistanceToBar));
  put("cornerRadius", optionalNumber(data.tooltipBoxRadius));
  put("titleMarginBottom", optionalNumber(data.tooltipTitleMarginBottom));
  // v4 folded xPadding/yPadding into one `padding`.
  const padX = optionalNumber(data.tooltipXpadding);
  const padY = optionalNumber(data.tooltipYpadding);
  if (padX !== undefined || padY !== undefined) config.padding = { x: padX ?? 6, y: padY ?? 6 };
  if (data.tooltipShowColorBox !== undefined && data.tooltipShowColorBox !== null && data.tooltipShowColorBox !== "") {
    config.displayColors = boolValue(data.tooltipShowColorBox, false);
  }
  if (callbacks) config.callbacks = callbacks;
  return config;
}

// `chartPadding*` in px around the plot. Only sides that are set are emitted, so chart.js keeps its
// own spacing for the rest.
export function layoutConfig(data: Record<string, unknown>): object | undefined {
  const padding: Record<string, number> = {};
  for (const [side, key] of [["top", "chartPaddingTop"], ["left", "chartPaddingLeft"], ["right", "chartPaddingRight"], ["bottom", "chartPaddingBottom"]] as const) {
    const value = optionalNumber(data[key]);
    if (value !== undefined) padding[side] = value;
  }
  return Object.keys(padding).length ? { padding } : undefined;
}

export type ChartPoint = { datasetIndex: number; dataIndex: number; value: number | null; x?: number; label: string; datasetLabel: string; color: string };
export type ValueLabelSetup = { fields?: Record<string, unknown>; align: string; anchor: string; show?: string };
export type ValueLabelText = { text: string; color?: string };
export type ChartDataset = {
  label: string;
  values: Array<number | null>;
  x?: number[];
  colors: Array<string | undefined>;
  valueLabels?: ValueLabelSetup;
  extra?: (resolved: string[]) => Record<string, unknown>;
};
export type ChartSpec = {
  type: string;
  colorBy: "item" | "dataset";
  labels?: string[];
  datasets: ChartDataset[];
  scales?: Record<string, unknown>;
  options?: Record<string, unknown>;
  valueLabels?: ValueLabelSetup;
  valueLabel?: (point: ChartPoint, number: string, fallback: ValueLabelText) => ValueLabelText;
  tooltip?: { title?: (point: ChartPoint) => string | string[]; label?: (point: ChartPoint, number: string) => string | string[] };
  legendShown?: boolean;
  error?: string;
};
export type ChartConfig = {
  type: string;
  data: { labels?: string[]; datasets: Record<string, unknown>[] };
  options: Record<string, any>;
  legend: Array<{ label: string; color: string }>;
};

type Group = RxWidgetInfo["visAttrs"][number];
type Field = Group["fields"][number];
const colorField = (name: string): Field => ({ name, label: name, type: "color" });
const numberField = (name: string): Field => ({ name, label: name, type: "number" });
const fontField = (name: string): Field => ({ name, label: name, type: "fontname" });

export function cardGroup(): Group {
  return {
    name: "card",
    label: "group_listItemCardBackground",
    fields: [
      { name: "cardUse", label: "cardUse", type: "checkbox" },
      { name: "title", label: "title", type: "html" },
      { name: "titleLayout", label: "titleLayout", type: "text" },
      numberField("borderDistance"),
      fontField("titleFontFamily"),
      colorField("colorBackground"),
      colorField("colorTitleSectionBackground"),
      colorField("colorTextSectionBackground"),
      colorField("colorTitle"),
    ],
  };
}

export function legendGroup({ shown }: { shown?: boolean }): Group {
  return {
    name: "legendLayout",
    label: "group_legendLayout",
    fields: [
      { name: "showLegend", label: "showLegend", type: "checkbox", ...(shown === undefined ? {} : { default: shown }) },
      { name: "legendPosition", label: "legendPosition", type: "select", options: ["top", "left", "bottom", "right"], default: "right" },
      colorField("legendFontColor"),
      fontField("legendFontFamily"),
      numberField("legendFontSize"),
      { name: "legendBoxWidth", label: "legendBoxWidth", type: "slider", min: 0, max: 100, step: 1 },
      { name: "legendPointStyle", label: "legendPointStyle", type: "checkbox", default: true },
      numberField("legendDistanceToChart"),
      numberField("legendPadding"),
    ],
  };
}

export function tooltipGroup(): Group {
  return {
    name: "tooltipLayout",
    label: "group_tooltipLayout",
    fields: [
      { name: "showTooltip", label: "showTooltip", type: "checkbox", default: true },
      { name: "tooltipMode", label: "tooltipMode", type: "select", options: ["nearest", "point", "index", "dataset", "x", "y"], default: "nearest" },
      { name: "tooltipPosition", label: "tooltipPosition", type: "select", options: ["average", "nearest"], default: "nearest" },
      colorField("tooltipBackgroundColor"),
      numberField("tooltipArrowSize"),
      numberField("tooltipDistanceToBar"),
      numberField("tooltipBoxRadius"),
      { name: "tooltipShowColorBox", label: "tooltipShowColorBox", type: "checkbox", default: true },
      numberField("tooltipXpadding"),
      numberField("tooltipYpadding"),
      colorField("tooltipTitleFontColor"),
      fontField("tooltipTitleFontFamily"),
      numberField("tooltipTitleFontSize"),
      numberField("tooltipTitleMarginBottom"),
      colorField("tooltipBodyFontColor"),
      fontField("tooltipBodyFontFamily"),
      numberField("tooltipBodyFontSize"),
      { name: "tooltipBodyAlignment", label: "tooltipBodyAlignment", type: "select", options: ["left", "center", "right"], default: "left" },
      { name: "tooltipBodyAppend", label: "tooltipBodyAppend", type: "text" },
      numberField("tooltipValueMinDecimals"),
      numberField("tooltipValueMaxDecimals"),
    ],
  };
}

export function valuesGroup(name: "barValuesLayout" | "pieValuesLayout", { show, anchor, align }: { show: string; anchor: string; align: string }): Group {
  return {
    name,
    label: `group_${name}`,
    fields: [
      { name: "showValues", label: "showValues", type: "select", options: ["showValuesOn", "showValuesOff", "showValuesAuto"], default: show },
      numberField("valuesSteps"),
      numberField("valuesMinDecimals"),
      numberField("valuesMaxDecimals"),
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      colorField("valuesFontColor"),
      fontField("valuesFontFamily"),
      numberField("valuesFontSize"),
      { name: "valuesPositionAnchor", label: "valuesPositionAnchor", type: "select", options: ["center", "start", "end"], default: anchor },
      { name: "valuesPositionAlign", label: "valuesPositionAlign", type: "select", options: ["center", "start", "end", "right", "bottom", "left", "top"], default: align },
      numberField("valuesPositionOffset"),
      { name: "valuesTextAlign", label: "valuesTextAlign", type: "select", options: ["start", "center", "end", "left", "right"], default: "center" },
      { name: "valuesRotation", label: "valuesRotation", type: "slider", min: 0, max: 360, step: 1 },
      colorField("valuesBackgroundColor"),
      colorField("valuesBorderColor"),
      numberField("valuesBorderWidth"),
      numberField("valuesBorderRadius"),
    ],
  };
}

const LEGACY_CHART_COLOR = "#44739e";

// Intl throws a RangeError when min > max, and the editor stores the two decimals fields one at a
// time — the throw took the whole vis view down.
export function chartNumber(value: unknown, min: unknown, max: unknown, kind: "value" | "tooltip"): string {
  const raw = optionalNumber(value);
  if (raw === undefined) return "";
  const bound = (v: number): number => Math.min(20, Math.max(0, Math.floor(v)));
  const lower = bound(optionalNumber(min) ?? 0);
  const upper = Math.max(lower, bound(optionalNumber(max) ?? (kind === "value" ? lower : Math.max(lower, 2))));
  return raw.toLocaleString(visLocale(), { minimumFractionDigits: lower, maximumFractionDigits: upper });
}

function resolveColors(spec: ChartSpec, data: Record<string, unknown>, context: { isM3: boolean; isDark: boolean }): string[][] {
  const count = spec.colorBy === "item" ? spec.datasets[0]?.values.length ?? 0 : spec.datasets.length;
  const palette = textValue(data.colorScheme) ? scheme(textValue(data.colorScheme), count) : [];
  const fallback = textValue(data.globalColor) || (context.isM3 ? m3ChartColors(context.isDark).primary : LEGACY_CHART_COLOR);
  const pick = (explicit: string | undefined, index: number): string => explicit || palette[index] || fallback;
  return spec.datasets.map((dataset, d) => (spec.colorBy === "item" ? dataset.values.map((_v, i) => pick(dataset.colors[i], i)) : [pick(dataset.colors[0], d)]));
}

export function chartConfig(spec: ChartSpec, data: Record<string, unknown>, context: { isM3: boolean; isDark: boolean }): ChartConfig {
  const resolved = resolveColors(spec, data, context);
  const point = (datasetIndex: number, dataIndex: number): ChartPoint => {
    const dataset = spec.datasets[datasetIndex];
    const colors = resolved[datasetIndex] || [];
    return {
      datasetIndex,
      dataIndex,
      value: dataset?.values[dataIndex] ?? null,
      x: dataset?.x?.[dataIndex],
      label: spec.labels?.[dataIndex] ?? "",
      datasetLabel: dataset?.label ?? "",
      color: (spec.colorBy === "item" ? colors[dataIndex] : colors[0]) ?? "",
    };
  };
  const valueLabels = (setup: ValueLabelSetup): object => {
    const fields = setup.fields ?? data;
    return datalabelsConfig(
      setup.show ? { ...fields, showValues: textValue(fields.showValues, setup.show) } : fields,
      context => {
        const at = point(numberValue(context.datasetIndex), numberValue(context.dataIndex));
        const number = chartNumber(at.value, fields.valuesMinDecimals, fields.valuesMaxDecimals, "value");
        const fallback = { text: number ? `${number}${textValue(fields.valuesAppendText)}` : "", color: textValue(fields.valuesFontColor) || undefined };
        return spec.valueLabel ? spec.valueLabel(at, number, fallback) : fallback;
      },
      { align: setup.align, anchor: setup.anchor },
    );
  };
  type TooltipItem = { datasetIndex?: number; dataIndex?: number };
  const callbacks: Record<string, unknown> = {
    label: (item: TooltipItem) => {
      const at = point(numberValue(item.datasetIndex), numberValue(item.dataIndex));
      const number = chartNumber(at.value, data.tooltipValueMinDecimals, data.tooltipValueMaxDecimals, "tooltip");
      return spec.tooltip?.label ? spec.tooltip.label(at, number) : `${at.datasetLabel ? `${at.datasetLabel}: ` : ""}${number}${textValue(data.tooltipBodyAppend)}`;
    },
  };
  const title = spec.tooltip?.title;
  if (title) callbacks.title = (items: TooltipItem[]) => (items[0] ? title(point(numberValue(items[0].datasetIndex), numberValue(items[0].dataIndex))) : "");
  return {
    type: spec.type,
    data: {
      ...(spec.labels ? { labels: spec.labels } : {}),
      datasets: spec.datasets.map((dataset, d) => {
        const color = spec.colorBy === "item" ? resolved[d] : resolved[d][0];
        return {
          label: dataset.label,
          data: dataset.x ? dataset.values.map((y, i) => ({ x: dataset.x?.[i], y })) : dataset.values,
          backgroundColor: color,
          ...(spec.colorBy === "dataset" ? { borderColor: color } : {}),
          ...(dataset.valueLabels ? { datalabels: valueLabels(dataset.valueLabels) } : {}),
          ...dataset.extra?.(resolved[d]),
        };
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: layoutConfig(data),
      hover: boolValue(data.disableHoverEffects) ? { mode: null } : undefined,
      animation: { duration: numberValue(data.animationDuration, 1000) },
      ...(spec.scales ? { scales: spec.scales } : {}),
      ...spec.options,
      plugins: {
        legend: { display: false },
        mdwChartArea: { color: textValue(data.chartAreaBackgroundColor) },
        tooltip: tooltipConfig(data, callbacks),
        datalabels: spec.valueLabels ? valueLabels(spec.valueLabels) : { display: false },
      },
    },
    legend: spec.colorBy === "item"
      ? (spec.labels ?? []).map((label, i) => ({ label, color: resolved[0]?.[i] ?? "" }))
      : spec.datasets.map((dataset, d) => ({ label: dataset.label, color: resolved[d][0] })),
  };
}

// chart.js' own legend is off in all our charts (it cannot be styled per widget field), so the
// widgets draw their own from the same `legend*` fields. One component for all of them.
export function ChartLegend({ data, entries, defaultShown = true }: {
  data: Record<string, unknown>;
  entries: { label: string; color: string }[];
  defaultShown?: boolean;
}): React.JSX.Element | null {
  if (!boolValue(data.showLegend, defaultShown)) return null;
  const horizontal = ["top", "bottom"].includes(textValue(data.legendPosition));
  const isM3 = designStyle(data) === "material3";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        flexWrap: "wrap",
        flexShrink: 0,
        fontFamily: textValue(data.legendFontFamily) || undefined,
        fontSize: numberValue(data.legendFontSize, 14),
        gap: numberValue(data.legendPadding, 8),
        padding: numberValue(data.legendDistanceToChart),
      }}
    >
      {entries.map((entry, index) => (
        <span key={index} style={{ alignItems: "center", color: textValue(data.legendFontColor) || (isM3 ? "var(--md-sys-color-on-surface)" : undefined), display: "flex" }}>
          <i
            style={{
              background: entry.color,
              borderRadius: boolValue(data.legendPointStyle, true) ? "50%" : 0,
              display: "inline-block",
              flexShrink: 0,
              height: numberValue(data.legendBoxWidth, 10),
              marginRight: 4,
              width: numberValue(data.legendBoxWidth, 10),
            }}
          />
          {entry.label}
        </span>
      ))}
    </div>
  );
}

// Callers build chart.js configs whose runtime shape (null points for gaps, numeric stack ids) is
// wider than the strict types; strict typing is re-applied at `new Chart`.
type Props = { type: string; data: object; options: object };

export function MaterialDesignChartCanvas({ type, data, options }: Props): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  // What is already on the instance, by identity. The create effect records what it built with so
  // the update effect below does not immediately re-run it (which would replay the mount animation).
  const applied = useRef<{ data: object; options: object } | null>(null);
  // A malformed config must not white-screen the whole vis view; log the shape that failed.
  const fail = (error: unknown): void => {
    chart.current = null;
    applied.current = null;
    const opt = options as { scales?: Record<string, { type?: string }> };
    const dsAxes = ((data as { datasets?: { xAxisID?: string; yAxisID?: string }[] }).datasets || []).map(
      d => ({ x: d.xAxisID, y: d.yAxisID }),
    );
    console.error("materialdesign chart render failed", error, {
      type,
      scales: opt.scales ? Object.keys(opt.scales) : undefined,
      datasetAxes: dsAxes,
    });
  };
  // Callers build `data`/`options` as fresh object literals inside their render, so putting them in
  // this dependency array would destroy and rebuild the chart on EVERY parent render — i.e. on
  // every state update — restarting the animation and closing any open tooltip. Only the chart
  // TYPE needs a new instance; everything else is handed to the existing one.
  useEffect(() => {
    if (!canvas.current) return;
    chart.current?.destroy();
    try {
      chart.current = new Chart(canvas.current, {
        type: type as never,
        data: data as never,
        options,
        plugins: [ChartDataLabels, chartAreaBackground],
      });
      applied.current = { data, options };
    } catch (error) {
      fail(error);
    }
    return () => {
      chart.current?.destroy();
      chart.current = null;
      applied.current = null;
    };
    // (`data`/`options` are deliberately NOT dependencies here - the effect below applies them.)
  }, [type]);
  useEffect(() => {
    const instance = chart.current;
    if (!instance || (applied.current?.data === data && applied.current?.options === options)) return;
    applied.current = { data, options };
    try {
      instance.data = data as never;
      instance.options = options;
      instance.update();
    } catch (error) {
      instance.destroy();
      fail(error);
    }
  }, [data, options]);
  return <canvas className="materialdesign-chart-container" style={{ height: "100%", width: "100%" }} ref={canvas} />;
}

export function ChartFrame({ data, isDark, config, legendShown, error }: {
  data: Record<string, unknown>;
  isDark: boolean;
  config: ChartConfig;
  legendShown: boolean;
  error?: string;
}): React.JSX.Element {
  const isM3 = designStyle(data) === "material3";
  const position = textValue(data.legendPosition, "right");
  const legendFirst = position === "top" || position === "left";
  const legend = <ChartLegend data={data} entries={config.legend} defaultShown={legendShown} />;
  const body = (
    <div style={{ display: "flex", flexDirection: position === "top" || position === "bottom" ? "column" : "row", height: "100%", minHeight: 0, width: "100%" }}>
      {legendFirst ? legend : null}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
        <MaterialDesignChartCanvas type={config.type} data={config.data} options={config.options} />
      </div>
      {legendFirst ? null : legend}
    </div>
  );
  const content = error ? (
    <span style={{ color: isM3 ? "var(--md-sys-color-error)" : "red" }}>{error}</span>
  ) : boolValue(data.cardUse) ? (
    <div
      className="materialdesign-html-card-container mdc-card"
      style={{
        background: textValue(data.colorBackground) || (isM3 ? "var(--md-sys-color-surface-container-low)" : legacySurface(isDark)),
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        // Inset: the card filled the widget box, and VIS2 clips there — the whole card shadow and
        // its rounded edge sat outside the visible area.
        height: "calc(100% - 6px)",
        margin: 3,
        padding: numberValue(data.borderDistance, 8),
        width: "calc(100% - 6px)",
      }}
    >
      <div
        className="card-title-section"
        style={{
          background: textValue(data.colorTitleSectionBackground),
          color: textValue(data.colorTitle) || (isM3 ? "var(--md-sys-color-on-surface)" : undefined),
          fontFamily: textValue(data.titleFontFamily),
          fontSize: numberValue(data.titleLayout) ? `${numberValue(data.titleLayout)}px` : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(textValue(data.title)) }}
      />
      {/* The canvas is height:100%; without a flex row of its own it keeps the full card height and
          the title pushes its bottom axis out of the widget. */}
      <div style={{ background: textValue(data.colorTextSectionBackground), flex: "1 1 0", minHeight: 0 }}>{body}</div>
    </div>
  ) : (
    body
  );
  return (
    <div
      className={`materialdesign-widget materialdesign-chart${isM3 ? ` ${designStyleClasses(data, isDark)}` : ""}`}
      style={{ background: textValue(data.backgroundColor) || (isM3 ? "var(--md-sys-color-surface)" : undefined), height: "100%", width: "100%" }}
    >
      {content}
    </div>
  );
}

export abstract class ChartWidget extends VisWidget {
  abstract chartSpec(data: Record<string, unknown>, value: (oid: unknown) => ioBroker.StateValue | undefined): ChartSpec;

  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    // The canvas reads no CSS variables, so the theme tokens have to arrive resolved.
    const data = this.themedData();
    const isDark = this.isDarkTheme();
    const spec = this.chartSpec(data, oid => stateValue(this.state, textValue(oid)));
    const config = chartConfig(spec, data, { isM3: designStyle(data) === "material3", isDark });
    return <ChartFrame data={data} isDark={isDark} config={config} legendShown={spec.legendShown ?? true} error={spec.error} />;
  }
}
