# Advanced View in Widget

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/html-widgets.md)

A child-view container that embeds complete VIS 2 views and selects one from a
state.

Template ids: `tplVis2-materialdesign-view-in-widget` and
`tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_html_widgets_runtime.png" alt="Embedded VIS 2 view">

## Editor settings

The screenshot shows the **General** group. Settings not listed below are
self-explanatory. The editor UI follows the ioBroker system language, so the
screenshots are German.

<img src="../../media/vis2_html_widgets_editor_overview.png" width="340" alt="Advanced view in widget general options">

**General**

- **object id** – the state whose value selects the embedded view.
- **views** – the VIS 2 views that can be shown.
- **fade in / out** – transition when switching between views.
- **pre-render** – optionally keep views mounted so switching is instant.

The `8` variant adds indexed state-value-to-view entries and persistence
settings for up to eight mappings.

Use [Responsive Layout](responsive-layout.md) instead when multiple child views
must be arranged at the same time.
