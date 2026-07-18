# Charts

[Back to README](../../../README.md#widget-documentation)

Four native VIS 2 chart widgets: Bar, Pie, JSON and Line History.

Template ids: `tplVis2-materialdesign-Chart-Bar`, `-Pie`, `-JSON` and
`-Line-History`.

<img src="../../media/vis2_charts_runtime.png" alt="Material Design charts in VIS 2">

## Editor settings

<table>
<tr><td><img src="../../media/vis2_charts_editor_overview.png" width="300"></td>
<td><ul><li><b>Bar/Pie:</b> configure indexed state datasets, labels and colors.</li><li><b>JSON:</b> reads labels and datasets from a JSON state.</li><li><b>Line History:</b> selects history instance, time range, aggregate and refresh interval per state.</li><li>Legend, axes, tooltip, animation and colors have separate groups.</li></ul></td></tr>
</table>

JSON chart example:

```json
{ "axisLabels": ["Mon", "Tue", "Wed"], "graphs": [{ "legendText": "Power", "color": "#44739e", "data": [2, 5, 3] }] }
```
