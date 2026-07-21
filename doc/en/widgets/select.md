# Select and Autocomplete

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/select.md)

Native VIS 2 dropdowns for choosing a value. Autocomplete behaves like Select but
also filters the entries while you type.

Template ids: `tplVis2-materialdesign-Select` and `tplVis2-materialdesign-Autocomplete`.

<img src="../../media/vis2_select_runtime.png" alt="Material Design select controls in VIS 2">

Autocomplete uses the same settings but filters the list as you type — handy for
long value lists such as cities or titles.

<img src="../../media/vis2_autocomplete_runtime.png" alt="Material Design autocomplete in VIS 2">

## Editor settings

<table>
<tr><td><img src="../../media/vis2_select_editor_overview.png" width="300"></td>
<td><ul><li><b>Data of the menu:</b> value list, JSON string, JSON object or the states of the bound object.</li><li><b>Layout:</b> outlined, filled or solo (optionally rounded/shaped) — same as the <a href="input.md">Input</a> widget.</li><li><b>Icons:</b> a per-entry icon plus the selected value's icon (prepend, prepend-inner or append).</li><li>Labels, clear/collapse icons and colors live in their optional groups.</li></ul></td></tr>
</table>

Value-list example: values `1;2;3`, labels `Living room;Kitchen;Bath`, icons
`sofa;silverware-fork-knife;shower`. JSON entries can use `value`, `text`,
`subText`, `icon` and `iconColor`.
