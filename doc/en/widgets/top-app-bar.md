# Top App Bar

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/top-app-bar.md)

A VIS 2 top app bar with responsive navigation drawer and indexed menu items.
Template id: `tplVis2-materialdesign-TopAppBar-Navigation`.

<img src="../../media/vis2_top_app_bar_runtime.png" alt="Material Design top app bar in VIS 2">

## Editor settings

The screenshots show the general/bar groups and the menu data plus one item.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_top_app_bar_editor_overview.png" width="340" alt="Top app bar general and bar layout options">

**General**

- **object id** – receives the selected menu index; an optional second state receives the selected item **name**.
- **number of menu items** – count of indexed item groups (editor method).
- **default / disable default value** – which item is preselected, or none.

**Top App Bar layout**

- **layout** – standard, dense or short.
- **title / show selected item as title** – fixed title, or the active menu entry as the title.
- **colors** – title, background and icon colors.

The **Navigation bar: Layout** group sets the drawer mode (modal, permanent or
automatic above a screen width), drawer width, header and label visibility.

Menu entries come from the data and item groups:

<img src="../../media/vis2_top_app_bar_editor_2.png" width="340" alt="Top app bar menu data and item options">

- **data method** – indexed editor entries or a JSON string.
- **menu id** – value written for this entry.
- **label / header / divider** – entry text, section header flag and separator.
- **icon + color**, **submenus** and **permission group / visibility** per entry.
