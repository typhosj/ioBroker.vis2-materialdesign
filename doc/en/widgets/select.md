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

The screenshot shows the menu groups expanded. Settings not listed below are
self-explanatory. The editor UI follows the ioBroker system language, so the
screenshots are German.

<img src="../../media/vis2_select_editor_overview.png" width="340" alt="Select menu data, layout and item options">

**Data of the menu**

- **data method** – *value list*, *JSON string*, *JSON object* or *states of the object* (uses the enum values of the bound object).
- **value list / labels / icons** – semicolon-separated lists that build the entries, e.g. values `1;2;3`, labels `Living room;Kitchen;Bath`, icons `sofa;silverware-fork-knife;shower`.

**Menu layout**

- **list position / offset** – where the dropdown opens relative to the field.
- **show selected icon** – marks the active entry with a check.
- **open on clear** – reopens the list after the value is cleared.

**Menu item**

- Per-entry **value**, **label**, **subLabel**, **icon** and **icon color** when the entries are configured in the editor.

The **Input layout** group (outlined / filled / solo, rounded / shaped) matches the
[Input](input.md) widget. Labels, clear / collapse icons and colors live in their
own optional groups. JSON entries can use `value`, `text`, `subText`, `icon` and
`iconColor`.
