# Responsive Layout

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/responsive-layout.md)

Responsive VIS 2 containers for Masonry Views, Grid Views and state-controlled
embedded views.

Template ids: `tplVis2-materialdesign-Masonry-Views`,
`tplVis2-materialdesign-Grid-Views`, `tplVis2-materialdesign-view-in-widget`
and `tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_responsive_layout_runtime.png" alt="Responsive Material Design layout in VIS 2">

## Editor settings

The screenshot shows the **General** group and one indexed **View** entry of the
Masonry container. Settings not listed below are self-explanatory. The editor UI
follows the ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_responsive_layout_editor_overview.png" width="340" alt="Responsive layout general and view options">

**General**

- **number of columns / spacing between views** – the base grid used on desktop.
- **number of views** – how many indexed **View [n]** groups exist.
- The **Phone settings** and **Tablet settings** groups override the column count per screen size.

**View [n]**

- **view** (`Seite`) – the embedded VIS 2 view.
- **height / width / order** – size and position within the grid (Grid uses explicit row/column spans).
- **visibility object / condition / value** – show this view only when a state matches.

**Advanced View** selects a single embedded view from a state value; see
[Advanced View in Widget](html-widgets.md).

Embedded content uses the native VIS 2 child-view mechanism; it does not change
the active top-level view.

**Choose between them:** use Masonry or Grid to arrange multiple views at once.
Use [Advanced View in Widget](html-widgets.md) when a state selects exactly one
child view.
