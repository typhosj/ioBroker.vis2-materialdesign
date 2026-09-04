# Charts

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/charts.md)

Four native VIS 2 charts for different data sources.

<img src="../../media/vis2_charts_runtime.png" alt="Material Design charts in VIS 2">

## Widgets

- [Bar chart](chart-bar.md) – compare individual current state values.
- [Pie chart](chart-pie.md) – show proportions of individual current state values.
- [JSON chart](chart-json.md) – combine several bar and line datasets from one JSON state.
- [Line history chart](chart-line-history.md) – load time series directly from a history instance.

Bar and Pie can read values from indexed editor datasets or from one shared JSON
state. **Number of data sets** is a count: 3 gives three data sets, in the groups
Data set [0] to [2]. VIS 1 stored the last index there, where 3 meant four data
sets — so check the value once when rebuilding an old chart. JSON Chart uses a separate multi-dataset format. Line History queries
historic values through the selected history adapter instance.

## Shared settings

All four charts share these groups. The screenshot has the **Chart layout** and
**Legend** groups expanded. The editor UI follows the ioBroker system language,
so the screenshots are German.

<img src="../../media/vis2_charts_editor_overview.png" width="340" alt="Shared chart layout and legend options">

**Chart layout** – general appearance: background colors, value-axis defaults
(min / max, decimals) and animation duration.

**Card background** – optionally wraps the chart and an HTML title in a Material
Design card.

**Legend** – whether the legend is shown and its **position**: top / bottom
arrange entries horizontally, left / right vertically.

**Tooltip** – shows values when a chart element is touched or hovered.

A **color scheme** distributes a palette across datasets that have no individual
color.

## Values drawn on the chart

All four charts can write their values right onto the bars, segments or points.
The fields are named alike everywhere but sit in different places: in the bar and
JSON chart in the **bar chart values layout:** group, in the pie chart in **pie
chart values layout:**, and in the line history chart per dataset, inside its
indexed group:

- **show values** – `yes`, `no` or `automatic` (only where there is room).
- **label every nth value** – thins out dense series.
- **minimal / maximal decimals** and **values text appendix** – format and unit.
- **positioning**, **position align**, **values position offset**, **text align** and **text rotation** – where the label sits relative to the data point.
- font color, family and size.
- **value label background color**, **value label border color**, **value label border width** and **value label corner radius** – put the label into a box of its own so it stays readable on a colored bar.

The groups of the bar, JSON and pie chart sit behind **show advanced options**.
