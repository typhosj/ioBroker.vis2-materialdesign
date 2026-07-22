# Material Design Icons and Utilities

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/material-design-icons-and-images.md)

Native VIS 2 utility widgets for a standalone icon, color-scheme preview and
installed package version.

Template ids: `tplVis2-materialdesign-Icon`,
`tplVis2-materialdesign-ColorScheme-Preview` and
`tplVis2-materialdesign-Installed-Version`.

<img src="../../media/vis2_material_design_icons_and_images_runtime.png" alt="Material Design icons in VIS 2">

## Editor settings

The screenshot shows the **Icon** widget with its **General** group expanded.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_material_design_icons_and_images_editor_overview.png" width="340" alt="Icon editor options">

**General (Icon widget)**

- **image** – a Material Design icon name (e.g. `lightbulb`), an image path/URL or a data URL.
- **icon color** – recolors single-color SVG/icons through a CSS mask; multi-color images stay unchanged.
- **use icon size for image** / **width / height** – force a fixed icon size instead of the automatic one.
- **object id** – optional; only needed when the icon should react to a state value.

The **Color Scheme Preview** widget shows the available Material Design palettes,
and **Installed Version** shows the packaged widget version — both need no options.

Icon/image fields accept Material Design icon names, common image paths, HTTP(S)
URLs and data URLs. SVG masks support a single configured color.
