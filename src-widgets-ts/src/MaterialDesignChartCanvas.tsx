import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController, LineController, PieController, DoughnutController,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Legend, Title, Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { designStyle, m3OnColor } from "./widgetUtils";

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

// v4 renamed this global from defaults.global.defaultFontColor.
Chart.defaults.color = "#44739e";

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

type LabelContext = Parameters<typeof labelColorFor>[0];

// `valuesSteps` thins the labels out (every n-th item); 0/1 shows all.
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
  const align = str(data.valuesPositionAlign, defaults.align);
  const anchor = str(data.valuesPositionAnchor, defaults.anchor);
  // `labelColorFor` only reads right while the label sits ON the element (align/anchor center). The
  // bar default parks it above the bar, where the contrast pick produced white on white.
  const onElement = align === "center" || anchor === "center";
  const offElementColor = (context: LabelContext): string => {
    const canvas = context.chart?.canvas;
    const token = canvas && designStyle(data) === "material3" ? getComputedStyle(canvas).getPropertyValue("--md-sys-color-on-surface").trim() : "";
    return token || str(Chart.defaults.color, "#44739e");
  };
  return {
    align,
    anchor,
    color: (context: LabelContext): string => label(context.dataIndex).color || (onElement ? labelColorFor(context) : offElementColor(context)),
    display: show === "showValuesOff" ? false : (context: LabelContext): boolean | string => (context.dataIndex % steps === 0 ? visible : false),
    font: { family: str(data.valuesFontFamily) || undefined, size: num(data.valuesFontSize, 12) },
    formatter: (_value: unknown, context: LabelContext): string => label(context.dataIndex).text,
    offset: num(data.valuesPositionOffset, 4),
    rotation: num(data.valuesRotation),
    textAlign: str(data.valuesTextAlign, "center"),
  };
}

// Callers build chart.js configs whose runtime shape (null points for gaps, numeric stack ids) is
// wider than the strict types; strict typing is re-applied at `new Chart`.
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
      // A malformed config must not white-screen the whole vis view; log the shape that failed.
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
