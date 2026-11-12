import { MAX_DYNAMIC_ITEMS, squarePreview, indexedFields, itemCount, createInfo, numberValue as n, optionalNumber, textValue as s } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes } from "./MaterialDesignColorScheme";
import { ChartWidget, type ChartSpec } from "./MaterialDesignChartCanvas";

type Data = Record<string, unknown> & {
  oid?: string;
  dataCount?: number;
  chartDataMethod?: string;
};
export function readJson(value: unknown): Record<string, unknown>[] | null {
  try {
    const result: unknown = JSON.parse(s(value));
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

type PieItem = { label: string; value: number; color: string; textColor: string; appendix: string; tooltipTitle: string; tooltipText: string };

function pieItems(data: Data, source: Record<string, unknown>[] | null, valueForIndex: (index: number) => number): PieItem[] {
  const count = source ? Math.min(source.length, MAX_DYNAMIC_ITEMS) : itemCount(data.dataCount);
  return Array.from({ length: count }, (_, i) => {
    const item = source?.[i];
    return {
      label: s(item?.label, s(data[`label${i}`])),
      value: Math.max(0, n(item?.value, valueForIndex(i))),
      color: s(item?.dataColor, s(data[`dataColor${i}`])),
      // Empty means "not configured": the label color is then derived from the slice it is drawn on.
      textColor: s(item?.valueColor, s(data[`valueTextColor${i}`], s(data.valuesFontColor))),
      appendix: s(item?.valueAppendix, s(data[`labelValueAppend${i}`], s(data.valuesAppendText))),
      tooltipTitle: s(item?.tooltipTitle, s(data[`tooltipTitle${i}`])),
      tooltipText: s(item?.tooltipText, s(data[`tooltipText${i}`])),
    };
  });
}
const color = (name: string) => ({ name, label: name, type: "color" as const });
const number = (name: string) => ({
  name,
  label: name,
  type: "number" as const,
});
const attrs: RxWidgetInfo["visAttrs"] = [
  {
    name: "common",
    fields: [
      {
        name: "chartDataMethod",
        label: "chartDataMethod",
        type: "select",
        options: ["inputPerEditor", "jsonStringObject"],
        default: "inputPerEditor",
      },
      { name: "dataCount", label: "dataCount", type: "number", default: 1 },
      { name: "oid", label: "oid", type: "id" },
      {
        name: "chartType",
        label: "chartType",
        type: "select",
        options: ["pie", "doughnut"],
        default: "pie",
      },
      {
        name: "doughnutCutOut",
        label: "doughnutCutOut",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
      },
      ...[
        "chartPaddingTop",
        "chartPaddingLeft",
        "chartPaddingRight",
        "chartPaddingBottom",
      ].map(number),
    ],
  },
  {
    name: "chartLayout",
    label: "group_chartLayout",
    fields: [
      color("backgroundColor"),
      color("chartAreaBackgroundColor"),
      {
        name: "disableHoverEffects",
        label: "disableHoverEffects",
        type: "checkbox",
      },
      number("animationDuration"),
    ],
  },
  {
    name: "card",
    label: "group_listItemCardBackground",
    fields: [
      { name: "cardUse", label: "cardUse", type: "checkbox" },
      { name: "title", label: "title", type: "html" },
      { name: "titleLayout", label: "titleLayout", type: "text" },
      number("borderDistance"),
      { name: "titleFontFamily", label: "titleFontFamily", type: "fontname" },
      color("colorBackground"),
      color("colorTitleSectionBackground"),
      color("colorTextSectionBackground"),
      color("colorTitle"),
    ],
  },
  // One group per data set, holding its object id AND its layout. VIS 1 had those as two separate
  // indexed groups, but vis-2 expands only the FIRST indexed group of a widget: its rescan for the
  // next one tests `group.indexFrom` for truthiness (visWidgetsCatalog.tsx), and ours start at index
  // 0. A second indexed group therefore renders exactly once, with unindexed field names — which is
  // how the per-data-set layout went missing. Field names are unchanged, so saved charts keep every
  // value.
  {
    name: "oids",
    label: "group_oids",
    indexFrom: 0,
    indexTo: "dataCount",
    // vis-2 expands 0..dataCount, one row more than the count asks for, and puts the clone, delete
    // and add buttons on that last row — hiding it left no way to add a data set at all.
    hidden: (data: Data) => s(data.chartDataMethod, "inputPerEditor") !== "inputPerEditor",
    fields: indexedFields(
      [
        { name: "oid", label: "oid", type: "id" },
        color("dataColor"),
        { name: "label", label: "label", type: "text" },
        color("valueTextColor"),
        { name: "labelValueAppend", label: "labelValueAppend", type: "text" },
        { name: "tooltipTitle", label: "tooltipTitle", type: "text" },
        { name: "tooltipText", label: "tooltipText", type: "text" },
      ],
      data => itemCount(data.dataCount),
    ),
  },
  {
    name: "pieLayout",
    label: "group_pieLayout",
    fields: [
      {
        name: "colorScheme",
        label: "colorScheme",
        type: "select",
        options: Object.keys(colorSchemes),
      },
      color("globalColor"),
      color("hoverColor"),
      color("borderColor"),
      color("hoverBorderColor"),
      number("borderWidth"),
      number("hoverBorderWidth"),
    ],
  },
  {
    name: "pieValuesLayout",
    label: "group_pieValuesLayout",
    fields: [
      {
        name: "showValues",
        label: "showValues",
        type: "select",
        options: ["showValuesOn", "showValuesOff", "showValuesAuto"],
        default: "showValuesOn",
      },
      number("valuesSteps"),
      number("valuesMinDecimals"),
      number("valuesMaxDecimals"),
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      color("valuesFontColor"),
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      number("valuesFontSize"),
      {
        name: "valuesPositionAnchor",
        label: "valuesPositionAnchor",
        type: "select",
        options: ["center", "start", "end"],
        default: "center",
      },
      {
        name: "valuesPositionAlign",
        label: "valuesPositionAlign",
        type: "select",
        options: ["center", "start", "end", "right", "bottom", "left", "top"],
        default: "end",
      },
      number("valuesPositionOffset"),
      {
        name: "valuesTextAlign",
        label: "valuesTextAlign",
        type: "select",
        options: ["start", "center", "end", "left", "right"],
        default: "center",
      },
      {
        name: "valuesRotation",
        label: "valuesRotation",
        type: "slider",
        min: 0,
        max: 360,
        step: 1,
      },
      color("valuesBackgroundColor"),
      color("valuesBorderColor"),
      number("valuesBorderWidth"),
      number("valuesBorderRadius"),
    ],
  },
  {
    name: "legendLayout",
    label: "group_legendLayout",
    fields: [
      { name: "showLegend", label: "showLegend", type: "checkbox" },
      {
        name: "legendPosition",
        label: "legendPosition",
        type: "select",
        options: ["top", "left", "bottom", "right"],
        default: "right",
      },
      color("legendFontColor"),
      { name: "legendFontFamily", label: "legendFontFamily", type: "fontname" },
      number("legendFontSize"),
      {
        name: "legendBoxWidth",
        label: "legendBoxWidth",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: "legendPointStyle",
        label: "legendPointStyle",
        type: "checkbox",
        default: true,
      },
      number("legendDistanceToChart"),
      number("legendPadding"),
    ],
  },
  {
    name: "tooltipLayout",
    label: "group_tooltipLayout",
    fields: [
      {
        name: "showTooltip",
        label: "showTooltip",
        type: "checkbox",
        default: true,
      },
      color("tooltipBackgroundColor"),
      number("tooltipArrowSize"),
      number("tooltipDistanceToBar"),
      number("tooltipBoxRadius"),
      {
        name: "tooltipShowColorBox",
        label: "tooltipShowColorBox",
        type: "checkbox",
        default: true,
      },
      number("tooltipXpadding"),
      number("tooltipYpadding"),
      color("tooltipTitleFontColor"),
      {
        name: "tooltipTitleFontFamily",
        label: "tooltipTitleFontFamily",
        type: "fontname",
      },
      number("tooltipTitleFontSize"),
      number("tooltipTitleMarginBottom"),
      color("tooltipBodyFontColor"),
      {
        name: "tooltipBodyFontFamily",
        label: "tooltipBodyFontFamily",
        type: "fontname",
      },
      number("tooltipBodyFontSize"),
      { name: "tooltipBodyAppend", label: "tooltipBodyAppend", type: "text" },
      number("tooltipValueMinDecimals"),
      number("tooltipValueMaxDecimals"),
    ],
  },
];
export default class MaterialDesignChartPie extends ChartWidget {
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Chart-Pie", "Pie Chart", attrs, ["card", "pieValuesLayout", "legendLayout", "tooltipLayout"]),
      visPrev: squarePreview('F012B'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartPie.getWidgetInfo();
  }
  chartSpec(data: Data, value: (oid: unknown) => ioBroker.StateValue | undefined): ChartSpec {
    const source = s(data.chartDataMethod) === "jsonStringObject" ? readJson(value(data.oid)) : null;
    const items = pieItems(data, source, i => n(value(data[`oid${i}`])));
    const doughnut = s(data.chartType) === "doughnut";
    return {
      type: s(data.chartType, "pie"),
      colorBy: "item",
      labels: items.map(item => item.label),
      datasets: [{
        label: "",
        values: items.map(item => item.value),
        colors: items.map(item => item.color || undefined),
        extra: () => ({
          hoverBackgroundColor: s(data.hoverColor) || undefined,
          hoverBorderColor: s(data.hoverBorderColor) || undefined,
          hoverBorderWidth: optionalNumber(data.hoverBorderWidth),
          borderColor: s(data.borderColor, "#fff"),
          borderWidth: n(data.borderWidth, 1),
        }),
      }],
      options: { cutout: doughnut ? `${n(data.doughnutCutOut, 50)}%` : 0 },
      // `align: "end"` pushes the label outward from the middle of the arc band: inside the slice on a
      // pie, but outside the narrow ring on a doughnut — doughnuts centre it in the band instead.
      valueLabels: { align: doughnut ? "center" : "end", anchor: "center" },
      valueLabel: (point, number) => {
        const item = items[point.dataIndex];
        return { color: item?.textColor || undefined, text: `${number}${s(item?.appendix)}` };
      },
      tooltip: {
        title: point => (items[point.dataIndex]?.tooltipTitle ? items[point.dataIndex].tooltipTitle.split("\\n") : ""),
        label: (point, number) => {
          const item = items[point.dataIndex];
          return item?.tooltipText ? item.tooltipText.split("\\n") : `${s(item?.label)}: ${number}${s(item?.appendix)}${s(data.tooltipBodyAppend)}`;
        },
      },
      legendShown: false,
    };
  }
  
}
