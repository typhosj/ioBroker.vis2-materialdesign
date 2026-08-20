import React, { useEffect, useRef } from "react";
import Chart from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { boolValue, numberValue, textValue } from "./widgetUtils";

// The shared coercions all take a fallback. These two are the other half: a field the user left
// empty has to stay `undefined` so the key is omitted from the chart.js config entirely, rather
// than overwriting a chart.js default with a zero or an empty string.
const optionalNumber = (value: unknown): number | undefined => (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? undefined : Number(value));
const optionalText = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

// chart.js paints the canvas, never the plot rectangle, so `chartAreaBackgroundColor` needs a
// plugin of its own. Reads `options.plugins.mdwChartArea.color`.
const chartAreaBackground = {
  id: "mdwChartArea",
  beforeDraw(chart: { chartArea?: { left: number; top: number; right: number; bottom: number }; ctx?: CanvasRenderingContext2D }, _easing: unknown, options: { color?: unknown }): void {
    const color = typeof options?.color === "string" ? options.color : "";
    const area = chart.chartArea;
    if (!color || !area || !chart.ctx) return;
    chart.ctx.save();
    chart.ctx.fillStyle = color;
    chart.ctx.fillRect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    chart.ctx.restore();
  },
};

// The tooltip options were declared on every chart widget but never handed to chart.js, so only
// `showTooltip` did anything. Unset entries are left out, otherwise they overwrite chart.js defaults.
export function tooltipConfig(data: Record<string, unknown>, callbacks?: object): object {
  const enabled = boolValue(data.showTooltip, true);
  const config: Record<string, unknown> = { enabled, mode: optionalText(data.tooltipMode) || "nearest" };
  const put = (key: string, value: unknown): void => { if (value !== undefined) config[key] = value; };
  put("position", optionalText(data.tooltipPosition));
  put("bodyAlign", optionalText(data.tooltipBodyAlignment));
  put("backgroundColor", optionalText(data.tooltipBackgroundColor));
  put("titleFontColor", optionalText(data.tooltipTitleFontColor));
  put("bodyFontColor", optionalText(data.tooltipBodyFontColor));
  put("titleFontFamily", optionalText(data.tooltipTitleFontFamily));
  put("bodyFontFamily", optionalText(data.tooltipBodyFontFamily));
  put("titleFontSize", optionalNumber(data.tooltipTitleFontSize));
  put("bodyFontSize", optionalNumber(data.tooltipBodyFontSize));
  put("caretSize", optionalNumber(data.tooltipArrowSize));
  put("caretPadding", optionalNumber(data.tooltipDistanceToBar));
  put("cornerRadius", optionalNumber(data.tooltipBoxRadius));
  put("xPadding", optionalNumber(data.tooltipXpadding));
  put("yPadding", optionalNumber(data.tooltipYpadding));
  put("titleMarginBottom", optionalNumber(data.tooltipTitleMarginBottom));
  if (data.tooltipShowColorBox !== undefined && data.tooltipShowColorBox !== null && data.tooltipShowColorBox !== "") {
    config.displayColors = boolValue(data.tooltipShowColorBox, false);
  }
  if (callbacks) config.callbacks = callbacks;
  return config;
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
        <span key={index} style={{ alignItems: "center", color: textValue(data.legendFontColor) || undefined, display: "flex" }}>
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

// Value labels on the drawn element (chartjs-plugin-datalabels). Every chart passes its own text
// and color per item, the rest of the look comes from the `values*` fields.
// `valuesSteps` thins the labels out (every n-th item); 0/1 shows all.
export function datalabelsConfig(
  data: Record<string, unknown>,
  label: (index: number) => { text: string; color?: string },
  defaults: { align: string; anchor: string },
): object {
  const show = textValue(data.showValues, "showValuesOn");
  const steps = Math.max(1, numberValue(data.valuesSteps, 1));
  const visible = show === "showValuesAuto" ? "auto" : true;
  type LabelContext = { dataIndex: number };
  return {
    align: textValue(data.valuesPositionAlign, defaults.align),
    anchor: textValue(data.valuesPositionAnchor, defaults.anchor),
    backgroundColor: textValue(data.valuesBackgroundColor) || null,
    borderColor: textValue(data.valuesBorderColor) || null,
    borderRadius: numberValue(data.valuesBorderRadius),
    borderWidth: numberValue(data.valuesBorderWidth),
    color: (context: LabelContext): string => label(context.dataIndex).color || textValue(data.valuesFontColor, "#000"),
    display: show === "showValuesOff" ? false : (context: LabelContext): boolean | string => (context.dataIndex % steps === 0 ? visible : false),
    font: { family: textValue(data.valuesFontFamily) || undefined, size: numberValue(data.valuesFontSize, 12) },
    formatter: (_value: unknown, context: LabelContext): string => label(context.dataIndex).text,
    offset: numberValue(data.valuesPositionOffset, 4),
    rotation: numberValue(data.valuesRotation),
    textAlign: textValue(data.valuesTextAlign, "center"),
  };
}

// `chartPadding*` in px around the plot. Only sides that are set are emitted, so chart.js keeps
// its own spacing for the rest.
export function layoutConfig(data: Record<string, unknown>): object | undefined {
  const padding: Record<string, number> = {};
  for (const [side, key] of [["top", "chartPaddingTop"], ["left", "chartPaddingLeft"], ["right", "chartPaddingRight"], ["bottom", "chartPaddingBottom"]] as const) {
    const value = optionalNumber(data[key]);
    if (value !== undefined) padding[side] = value;
  }
  return Object.keys(padding).length ? { padding } : undefined;
}

// `tooltipValueMin/MaxDecimals`. Undefined when the user set neither, so the caller keeps its own
// text — the bar label already carries the datalabel decimals, which are a different setting.
export function tooltipNumber(data: Record<string, unknown>, value: unknown): string | undefined {
  const min = optionalNumber(data.tooltipValueMinDecimals);
  const max = optionalNumber(data.tooltipValueMaxDecimals);
  const raw = optionalNumber(value);
  if (raw === undefined || (min === undefined && max === undefined)) return undefined;
  // Intl throws when min > max, which the editor lets you configure one field at a time.
  const lower = Math.max(0, Math.min(20, min ?? 0));
  return raw.toLocaleString(undefined, {
    minimumFractionDigits: lower,
    maximumFractionDigits: Math.max(lower, Math.min(20, max ?? Math.max(min ?? 0, 2))),
  });
}

// `data`/`options` are typed loosely: callers build chart.js v2 configs whose
// runtime shape (null data points for gaps, numeric stack ids) is wider than
// @types/chart.js allows. The strict typing is re-applied at the `new Chart` call.
type Props = { type: string; data: object; options: object };

export function MaterialDesignChartCanvas({ type, data, options }: Props): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<{ destroy(): void } | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    chart.current?.destroy();
    chart.current = new Chart(canvas.current, { type, data, options, plugins: [ChartDataLabels, chartAreaBackground] });
    return () => {
      chart.current?.destroy();
    };
  }, [type, data, options]);
  return <canvas className="materialdesign-chart-container" style={{ height: "100%", width: "100%" }} ref={canvas} />;
}
