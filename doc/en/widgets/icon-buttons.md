# Icon Buttons

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/icon-buttons.md)

Compact icon-only VIS 2 buttons for navigation, links, state, multi-state,
addition, toggle and a circular value slider.

Template ids start with `tplVis2-materialdesign-Icon-Button-`, followed by
`Navigation`, `Link`, `State`, `State-Multi`, `Adition`, `Toggle` or `Slider`.

<img src="../../media/vis2_icon_buttons_runtime.png" alt="Material Design icon buttons in VIS 2">

## Editor settings

The screenshots show a normal icon button and the circular *Slider* variant.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_icon_buttons_editor_overview.png" width="340" alt="Icon button general and icon options">

**General** – the action fields match the corresponding [button](buttons.md)
variant (target view, URL, object id and value, …).

**Image / Icon**

- **image** – Material Design icon name or image source.
- **icon color / on-state color** – recolor a single-color icon; a separate color can mark the on state.
- **icon size** – size of the icon inside the round button.

The **Slider** variant turns the button into a circular value slider:

<img src="../../media/vis2_icon_buttons_editor_2.png" width="340" alt="Icon button slider variant options">

- **slider only** – value control without the click action.
- **value off / on** – value range mapped onto the arc.
- **angle offset / arc** – where the arc starts and how far it sweeps.
- **slider width / thickness** – geometry of the arc.
- **foreground / background color** and **show in front / always** – arc colors and when the arc is visible.

Material Design icon names, local image paths, URLs and data URLs are supported.
Single-color SVGs can be recolored with the icon color.
