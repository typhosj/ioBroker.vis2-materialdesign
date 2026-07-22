# Buttons

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/buttons.md)

Six native VIS 2 button variants for navigation, links, state writes, multi-state
writes, numeric addition and on/off toggling.

Template ids: `tplVis2-materialdesign-Button-Navigation`, `-Link`, `-State`,
`-State-Multi`, `-Adition` and `-Toggle`.

<img src="../../media/vis2_buttons_runtime.png" alt="Material Design buttons in VIS 2">

## Editor settings

Pick the variant in the **Material Design** widget set, select it and open the
**WIDGET** tab. The screenshots use the *State* and *Multi State* variants; the
editor UI follows the ioBroker system language, so they are German. Settings not
listed below are self-explanatory.

<img src="../../media/vis2_buttons_editor_overview.png" width="340" alt="Button general and label options">

**General** – the action fields depend on the chosen variant:

- **Navigation** – target VIS 2 view to open.
- **Link** – URL and *open in new window*.
- **State** – object id and the value written on click.
- **Addition** – increment (`+`/`-` step) with optional min / max clamp.
- **Toggle** – *toggle type* (`boolean` or custom off / on value) and *push button* (write on press and release).

**Label**

- **button text / label true** – caption; a second text can be shown in the on state.
- **alignment** – icon/text arrangement inside the button.

The **Multi State** variant replaces the single value with indexed object/value
rows, each with its own delay:

<img src="../../media/vis2_buttons_editor_2.png" width="340" alt="Multi State indexed object/value entry">

The **Image / Icon** group takes a Material Design icon name or image source (with
a separate on-state color), **Colors** overrides the theme, **Feedback** adds
haptics and a click sound, and **Locking** requires an unlock click before the
action runs.
