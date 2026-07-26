import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController, LineController, PieController, DoughnutController,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Legend, Title, Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { m3OnColor } from "./widgetUtils";

// Chart.js 4 no longer auto-registers. Register only the pieces these 4 widgets use — bar/line/
// pie/doughnut controllers, their elements, the linear + category scales (no time scale: the Line
// History chart pre-formats its own tick labels, staying moment-free), and the legend/title/tooltip/
// fill plugins. This is deliberately NOT `chart.js/auto`, which would drag in the radar/polar/bubble/
// scatter/time/radial engine we never draw (~2x the gzip). Datalabels stays a per-chart plugin.
// Guard the call: the real bundler resolves chart.js' ESM entry correctly, but the vitest/jsdom
// resolver loads a build where these named exports are absent (Chart.register is not a function).
// Charts never render in the unit tests (they only exercise the pure data helpers), so skipping
// registration there is harmless; the browser build always registers.
if (typeof (Chart as { register?: unknown }).register === "function") {
  Chart.register(
    BarController, LineController, PieController, DoughnutController,
    ArcElement, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale,
    Filler, Legend, Title, Tooltip,
  );
}

// Default all chart text (axis ticks + axis titles) to the Material Design blue
// instead of chart.js' grey #666, matching the legacy widget theme. Per-axis color
// fields (and the M3 render paths) still override this. v4 renamed the global from
// defaults.global.defaultFontColor to defaults.color.
Chart.defaults.color = "#44739e";

// Value labels sit ON the drawn element (pie slice, bar), so a single fixed color is unreadable on
// half the palette — the plugin's own default is a mid grey, and a dark blue or violet slice swallows
// it. Derive the label color from the color of the element it is drawn on instead: the same sRGB
// contrast pick used for the M3 seed pairs and the calendar events. A chart that sets its own
// `plugins.datalabels.color` still wins, since this is only the default.
export function labelColorFor(context: { dataIndex: number; dataset?: { backgroundColor?: unknown }; chart?: { canvas?: HTMLCanvasElement } }): string {
  const background = context.dataset?.backgroundColor;
  let color = Array.isArray(background) ? background[context.dataIndex] : background;
  // M3 paths pass tokens (`var(--md-sys-color-primary)`), which no color parser can read — resolve
  // them off the canvas, where the widget root's custom properties are in scope.
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

type LabelContext = Parameters<typeof labelColorFor>[0];

// The value-label option group (`showValues`, decimals, appendix, font, anchor/align/offset/rotation)
// exists on Bar and Pie with identical field names but was never wired to the plugin — the labels
// rendered with plugin defaults and every setting in the group was inert. Both charts build their
// per-item text/color themselves (they differ in how: Bar precomputes `valueText`, Pie formats the
// slice value), so they pass that in as `label` and share everything else here.
// `valuesSteps` thins the labels out (every n-th item), which is what keeps a bar chart with many
// bars readable; 0/1 shows all.
export function datalabelsConfig(
  data: Record<string, unknown>,
  label: (index: number) => { text: string; color?: string },
  defaults: { align: string; anchor: string },
): object {
  const num = (value: unknown, fallback = 0): number => (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? fallback : Number(value));
  const str = (value: unknown, fallback = ""): string => (typeof value === "string" && value ? value : fallback);
  const show = str(data.showValues, "showValuesOn");
  const steps = Math.max(1, num(data.valuesSteps, 1));
  const visible = show === "showValuesAuto" ? "auto" : true;
  return {
    align: str(data.valuesPositionAlign, defaults.align),
    anchor: str(data.valuesPositionAnchor, defaults.anchor),
    color: (context: LabelContext): string => label(context.dataIndex).color || labelColorFor(context),
    display: show === "showValuesOff" ? false : (context: LabelContext): boolean | string => (context.dataIndex % steps === 0 ? visible : false),
    font: { family: str(data.valuesFontFamily) || undefined, size: num(data.valuesFontSize, 12) },
    formatter: (_value: unknown, context: LabelContext): string => label(context.dataIndex).text,
    offset: num(data.valuesPositionOffset, 4),
    rotation: num(data.valuesRotation),
    textAlign: str(data.valuesTextAlign, "center"),
  };
}

// `data`/`options` are typed loosely: callers build chart.js configs whose runtime
// shape (null data points for gaps, numeric stack ids) is wider than the strict
// types allow. The strict typing is re-applied at the `new Chart` call.
type Props = { type: string; data: object; options: object };

export function MaterialDesignChartCanvas({ type, data, options }: Props): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    chart.current?.destroy();
    try {
      chart.current = new Chart(canvas.current, {
        type: type as never,
        data: data as never,
        options,
        plugins: [ChartDataLabels],
      });
    } catch (error) {
      // A malformed config must not white-screen the whole vis view. Log the shape that failed
      // (scale ids vs the axis ids the datasets reference) so the mismatch is visible, then render
      // nothing. This turned the chart.js v4 migration's opaque "getBasePixel of undefined" into a
      // named, diagnosable failure.
      chart.current = null;
      const opt = options as { scales?: Record<string, { type?: string }> };
      const dsAxes = ((data as { datasets?: { xAxisID?: string; yAxisID?: string }[] }).datasets || []).map(
        d => ({ x: d.xAxisID, y: d.yAxisID }),
      );
      console.error("materialdesign chart render failed", error, {
        type,
        scales: opt.scales ? Object.keys(opt.scales) : undefined,
        datasetAxes: dsAxes,
      });
    }
    return () => {
      chart.current?.destroy();
    };
  }, [type, data, options]);
  return <canvas className="materialdesign-chart-container" style={{ height: "100%", width: "100%" }} ref={canvas} />;
}
