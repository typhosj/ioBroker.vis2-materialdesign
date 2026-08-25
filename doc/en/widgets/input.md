# Input

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/input.md)

A native VIS 2 field for entering text or numbers.
Template id: `tplVis2-materialdesign-Input`.

<img src="../../media/vis2_input_runtime.png" alt="Material Design input in VIS 2">

## Editor settings

The screenshot shows the **General** and **Input layout** groups expanded.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_input_editor_overview.png" width="340" alt="Input general and layout options">

**General**

- **type** – text, number, date, time or **mask**.
- **input mask / max length** – the fixed input pattern and character limit used by the mask type.

**Input layout**

- **layout** – outlined, filled, solo (borderless) and the rounded / shaped variants.
- **alignment** – horizontal alignment of the entered text.
- **background color hover** – fills the stage between resting and focused. Left empty, the resting color is kept.

**Sub text of input**

- **text** – the hint under the field, with its own font, size and color.
- **always show** – on, the hint stands under the field permanently. Off, it appears only while the field is focused, matching [Select](select.md).

Character counter and clear icon (**Counter layout**), and labels,
prefix/suffix, inner icons and colors live in their own optional groups.

**Icons**

For the clear, prepend, inner-prepend, append and outer-append icons you can select
an icon or an image.

<img src="../../media/vis2_input_editor_icons.png" width="340" alt="Input icon fields">

To choose from a list of values use the [Select](select.md) widget instead.
