# Material Design Widgets – User guide

[Project overview](../../README.md) · [Deutsch](../de/README.md)

## Requirements

- ioBroker Admin 7.6.20 or newer
- Node.js 22 or newer
- an installed VIS 2 adapter
- a current Chromium-based browser or Firefox as target environment

A complete browser/runtime compatibility matrix has not been tested yet.

## Installation and quick start

1. Install **Material Design Widgets** (`vis2-materialdesign`) from the ioBroker
   Admin adapter list.
2. Open the VIS 2 editor and a project.
3. Open the **Material Design** widget set.
4. Drag a widget into the view and select it.
5. Configure its object ID and behaviour in the **WIDGET** tab.
6. Save the project and test it in runtime mode.

Use **Value** for a first test: select an object under `oid`, configure unit and
decimal places, then save the view.

## Use a theme

Theme use is optional:

1. Open the adapter configuration.
2. Configure light and dark colors, fonts and font sizes in the **Theme Editor**,
   then save.
3. Select a widget in the VIS 2 editor.
4. Choose **Theme → use theme** and confirm.

This places the matching theme references in the selected widget. Widget values
changed afterwards remain individual overrides. The global JavaScript script in
the adapter configuration is only needed when scripts must access theme values
directly.

## Design style

Every widget renders in one of two styles, selected in the **WIDGET** tab under
**General → design style**:

- **Classic** – the established Material Design 2-era look, the default.
- **Material 3** – Material 3 color roles, shape, type and state layers.
- **Project default** – follows the style set in the adapter's **Design** tab, so
  a whole project can be switched centrally.

<img src="../media/vis2_style_editor_basic.png" width="300" alt="Design style in the General group">

Material 3 changes presentation only. Object ids, option names, values, write
behaviour, timers and navigation are identical in both styles, and setting a
widget back to `Classic` restores the old look exactly. Colors, fonts and sizes
you configured explicitly still win — Material 3 only fills in the values you
left empty, so clear those fields to let a widget follow the Material 3 palette.

Dark mode follows the same `vis2-materialdesign.0.colors.darkTheme` state the
classic style already uses: `auto` takes it from VIS 2's own theme, `light` and
`dark` force one. The **Design** tab derives the complete Material 3
scheme from one seed color; leave the seed empty for Google's baseline palette.

Each widget page shows both styles side by side in light and dark mode.

**show advanced options**, right below the style, reveals the rarely used option
groups of the selected widget. A widget that already carries such values shows
them without the switch.

### Known limits of the Material 3 beta

- **The widgets read instance 0.** The theme, dark-mode, design-style and Material 3
  states are read from `vis2-materialdesign.0.…`. The adapter is a singleton, and
  ioBroker creates instance 0 by default, so this is what every normal install has —
  but an instance deliberately created under a different number is not picked up by
  the widgets.
- **`Project default` shows the classic style for a moment.** A widget set to
  `Project default` renders classic until the project's design-style state has
  arrived over the socket, then switches. On a slow connection that is visible as a
  brief flash on every panel load. Setting the style on the widget itself
  (`Material 3` instead of `Project default`) avoids it.
- **A seed written by a script does not recompute the scheme.** The seed color is
  converted to the full Material 3 scheme when the adapter configuration is saved,
  not when the state changes. Write the seed in the **Design** tab and save.

<img src="../media/vis2_style_editor_advanced.png" width="300" alt="Additional option groups with advanced options enabled">

## Choose a widget by task

- Switch and navigate: [Buttons](widgets/buttons.md),
  [Icon Buttons](widgets/icon-buttons.md), [Checkbox](widgets/checkbox.md),
  [Switch](widgets/switch.md)
- Enter values: [Input, Select and Autocomplete](widgets/input.md),
  [Slider](widgets/slider.md), [Slider Round](widgets/slider-round.md)
- Display values: [Value](widgets/value.md), [HTML Card](widgets/html-card.md),
  [Progress](widgets/progress.md)
- Display data: [List](widgets/list.md), [Table](widgets/table.md),
  [Charts](widgets/charts.md), [Calendar](widgets/calendar.md)
- Structure views: [Top App Bar](widgets/top-app-bar.md),
  [Responsive Layout](widgets/responsive-layout.md), [Dialog](widgets/dialog.md)

[Complete widget catalog](widgets/README.md)

## Show values inside texts

The object id of a widget controls its state — it does not write a value into
the text. Values come from a VIS 2 binding: an object id in curly braces inside
a text or HTML field is replaced by the value of that state at runtime.

```
Temperature: {0_userdata.0.temp}°C
```

This works in every text and HTML field of these widgets, so also in the label,
the sub label and the right label of each list row, in the cells of the table
and in the HTML of the [HTML Card](widgets/html-card.md). That is how a
[List](widgets/list.md) shows several values below each other, which otherwise
needs one [Value](widgets/value.md) widget per state.

The binding is evaluated by VIS 2, not by this adapter. The chain icon next to
the field name (**Use field as binding**) switches the field to the VIS 2
binding editor, which helps with formatting (decimals, conversion, conditions).

## Troubleshooting

- **Widget set is missing:** verify that `vis2-materialdesign` and VIS 2 are
  installed, then reload the VIS 2 editor.
- **Theme remains unchanged:** save the adapter configuration, run
  **Theme → use theme** again and reload runtime mode.
- **Changes are hidden after reinstalling the same version:** perform a hard
  browser reload.
- **Widget does not write:** check whether the object is writable and whether
  read-only mode or widget locking is active.
- **List, table, calendar or chart is empty:** compare its JSON with the example
  on the widget page.
- **A row shows its label but no value:** the object id of a row only controls
  its state. Values come from
  [Show values inside texts](#show-values-inside-texts).
- **A repeating group (menu item, data set, column, view) does not grow:** use
  the **+** button in the header of the last of these groups. Typing a number
  into the matching count field does not rebuild the groups right away — VIS 2
  redraws them on the button or after the selection changes. The last group
  shows only its header with the buttons: it is the add bar, not an entry, which
  keeps the count meaning the number of entries.

## Browser note

Vibration is not available in every browser or device. See the
[Vibration API compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate#browser_compatibility).

Report problems with adapter version, browser, affected widget and a screenshot
in the [issue tracker](https://github.com/typhosj/ioBroker.vis2-materialdesign/issues).
