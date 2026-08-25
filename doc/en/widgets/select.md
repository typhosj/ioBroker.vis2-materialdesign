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
- The **+** button in the header of the last **menu item** group adds an entry, the two buttons next to it clone and delete one. That last group shows only its header — it is the add bar, not an entry.
- An entry without a **value** uses its **label** as the value written to the object.

The **Input layout** group (outlined / filled / solo, rounded / shaped) matches the
[Input](input.md) widget. Labels, clear / collapse icons and colors live in their
own optional groups. JSON entries can use `value`, `text`, `subText`, `icon` and
`iconColor`.

**Sub text of input**

- **text** – a hint rendered under the field, with its own font, size and color.
- **always show** – on, the hint stands under the field permanently. Off, it
  appears only while the list is open.

**Counter layout**

- **show counter** – prints how many entries the list offers. This is an entry
  count, not a character count: a select has no maximum to count against.

**Input layout** (further fields)

- **background color hover / selected** and **border color hover** fill the two
  states between resting and open. Each stage falls back to the previous one when
  it is not set, so a field configured with only a resting color looks unchanged.
- **auto focus** – focuses the field when the view is opened. It stays off inside
  the editor, where a field grabbing focus while widgets are arranged is a
  nuisance.

**Label of input**

- **offset x / y** move the label, the same way [Input](input.md) does.

**Icons**

For the clear, collapse (menu arrow), prepend, inner-prepend and outer-append icons
you can select an icon or an image.

<img src="../../media/vis2_select_editor_icons.png" width="340" alt="Select icon fields">

## Autocomplete only

Autocomplete adds two fields of its own next to the shared ones:

- **input mode** – *write* accepts free text, *select* only allows entries from
  the list.
- **input type** – `text`, `date` or `time` for the filter input. `date` and
  `time` hand over the browser's own picker; anything else stays text. Select
  itself has no text entry, so this setting only exists on Autocomplete.

