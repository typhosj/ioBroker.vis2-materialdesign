# Input

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/input.md)

A native VIS 2 field for entering text or numbers. Template id:
`tplVis2-materialdesign-Input`.

<img src="../../media/vis2_input_runtime.png" alt="Material Design input field in VIS 2">

## Editor settings

The screenshot shows the **Common** and **layout input** groups expanded.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_input_editor_overview.png" width="340" alt="Input general and layout options">

**Common**

- **Object ID** – the state the input is written to.
- **input type** – `text`, `number`, `date`, `time` or `mask`. `number` writes a
  number, everything else writes text; a number field cleared by the user writes
  nothing instead of putting a 0 into the state.
- **input mask** – for the `mask` input type only. Placeholders: `#` digit,
  `S` letter, `A` letter uppercased, `a` letter lowercased, `N` digit or letter,
  `X` any character. Every other character is a fixed separator, so `##:##`
  gives a time entry.
- **max length** – caps the entry and supplies the number behind the slash in the
  counter.

`text`, `number` and `mask` write on leaving the field or on Enter, `date` and
`time` write right after picking a value.

**layout input**

- **layout** – `regular`, `solo`, `solo-rounded`, `solo-shaped`, `filled`,
  `filled-rounded`, `filled-shaped`, `outlined`, `outlined-rounded` or
  `outlined-shaped`.
- **text alignment** – `left`, `center` or `right` for the entered text.
- **auto focus** – the field takes the focus when the view loads.
- Background, border and text colors each cover the normal, hovered and selected
  state.

**label of input**

- **text** – the floating label above the field.
- **offset x / offset y** – move it when it collides with an icon.

**appendixs of the input**

- **prepended text / appended text** – fixed text left or right inside the field,
  a unit for example. It is not written to the state.

**sub text of input**

- **text** – hint line below the field.
- **always show** – switched off, the hint only appears while the field has the
  focus.

**counter layout**

- **show counter** – shows the character count in the bottom right, as `12 / 30`
  once **max length** is set.

**icons**

The **text delete icon**, the **prefixed icon**, the **inner prefixed symbol**,
the **appended symbol** and the **outer appended symbol** each take an icon or an
image plus size and color.

<img src="../../media/vis2_input_editor_icons.png" width="340" alt="Input icon fields">

To pick from a list of values use the [Select](select.md) widget instead.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the regular, filled, filled-rounded,
outlined, outlined-rounded and solo layouts, prefix/suffix, hint and counter, a
number field with the clear icon and centred text.

<img src="../../media/vis2_input_styles.png" alt="Input field in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_input_styles_dark.png" alt="Input field in the Classic and the Material 3 style, dark theme">
