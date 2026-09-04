# Table

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/table.md)

A native VIS 2 table for JSON rows with configurable indexed columns. Template
id: `tplVis2-materialdesign-Table`.

<img src="../../media/vis2_table_runtime.png" alt="Material Design table in VIS 2">

## Editor settings

The screenshots show the general/layout groups and one indexed column. Settings
not listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_table_editor_overview.png" width="340" alt="Table general and layout options">

**General**

- **Object ID** – a state whose value is a JSON array of the rows.
- **data as JSON** – the same data entered directly as text, when no state
  carries it. The object id wins as soon as it is set.
- **number of columns** – number of indexed **column layout [n]** groups.

**layout**

- **table layout** – `standard`, `card` or `cardOutlined` (a card with an outline
  instead of a shadow).
- **show row heading** – the header row carrying the column labels.
- **fixed table headline** – the header row stays put while scrolling.
- **rounded edges** – rounded corners; switched off the frame stays square.
- **row heading height / row heading textsize / row heading fontfamily** – apply
  to the header row only, **row height** applies to the data rows only.

**colors**

- **background color row / background color odd row** – with the second color
  set, the two alternate row by row; left empty, the first one applies to every
  row.
- **hover background color row** – color of the row under the mouse pointer.
- **divider** – line between the rows; the last row gets none.
- **border color** – frame around the table.

Each column is configured in its own indexed **column layout [n]** group:

<img src="../../media/vis2_table_editor_2.png" width="340" alt="Indexed table column options">

- **show column** – switched off the column is dropped without renumbering the
  remaining ones.
- **Label** – column header text. It only names the column, it does not pick
  which JSON property the column shows.
- **column type** – `text` or `Image`. With `Image` the cell value is a URL and
  **image size** caps its width.
- **object name for sorting** – the JSON property a click on this column header
  sorts by. Left empty, the property the column itself shows is used. A second
  click reverses the direction.
- **column width (wordwrap must be active) / text alignment / no wordwrap** –
  column sizing and text behaviour.
- **Prefix / Suffix** – text added around the cell value. Both may contain
  `#[obj.name]`, which is replaced by the `name` property of the same row.

The columns are the properties of the **first** row, in its order: **column
layout [0]** shows the first property, **[1]** the second and so on.

```json
[{ "device": "Temperature", "room": "Living room", "value": "22.4 °C" }]
```

Every further row is read against those columns: a property a row does not have
leaves its cell empty and does not shift the remaining columns.

The table shows only what that JSON contains. To list individual states below
each other without building a JSON first, the [List](list.md) with bindings in
its row texts is the shorter way, see
[Show values inside texts](../README.md#show-values-inside-texts).

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the table with and without a header
row, rounded, with a fixed header and with row dividers.

<img src="../../media/vis2_table_styles.png" alt="Table in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_table_styles_dark.png" alt="Table in the Classic and the Material 3 style, dark theme">
