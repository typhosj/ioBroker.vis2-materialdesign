# Table

[Back to README](../../../README.md#widget-documentation)

A native VIS 2 table for JSON rows with configurable indexed columns. Template
id: `tplVis2-materialdesign-Table`.

<img src="../../media/vis2_table_runtime.png" alt="Material Design table in VIS 2">

## Editor settings

<table>
<tr><td><img src="../../media/vis2_table_editor_overview.png" width="300"></td>
<td><ul><li><b>oid/data JSON:</b> JSON array from a state or direct text.</li><li><b>column count:</b> creates indexed column groups.</li><li>Each column sets label, sort key, text or image type, width and alignment. Display order follows the JSON property order.</li><li>Choose standard, card or outlined-card layout.</li></ul></td></tr>
</table>

```json
[{ "device": "Temperature", "room": "Living room", "value": "22.4 °C" }]
```

Use a JSON object with the same property order for every row.
