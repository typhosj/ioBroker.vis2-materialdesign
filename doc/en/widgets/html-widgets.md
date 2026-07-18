# Advanced View in Widget

[Back to README](../../../README.md#widget-documentation)

VIS 1 HTML-control snippets are not used by native VIS 2 widgets. Their VIS 2
replacement is a child-view container that embeds complete VIS 2 views and
selects them from a state.

Template ids: `tplVis2-materialdesign-view-in-widget` and
`tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_html_widgets_runtime.png" alt="Embedded VIS 2 view">

## Editor settings

<table>
<tr><td><img src="../../media/vis2_html_widgets_editor_overview.png" width="300"></td>
<td><ul><li>Select the controlling object id and embedded views.</li><li>Configure fade-in/out and optional pre-rendering.</li><li>The `8` variant provides indexed state-to-view entries and persistence settings.</li></ul></td></tr>
</table>

Rebuild old HTML snippets with native VIS 2 widgets inside a child view. Legacy
`mdw-*` HTML attributes are not a supported VIS 2 configuration API.
