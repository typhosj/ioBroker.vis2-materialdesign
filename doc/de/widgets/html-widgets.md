# Advanced View in Widget

[Zurück zur README](../../../README.md#widget-documentation)

HTML-Control-Snippets aus VIS 1 werden von nativen VIS-2-Widgets nicht verwendet.
Der Ersatz ist ein Child-View-Container, der komplette VIS-2-Ansichten einbettet
und per State auswählt.

Template-IDs: `tplVis2-materialdesign-view-in-widget` und
`tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_html_widgets_runtime.png" alt="Eingebettete VIS-2-Ansicht">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_html_widgets_editor_overview.png" width="300"></td>
<td><ul><li>Steuernde Objekt-ID und einzubettende Ansichten wählen.</li><li>Ein-/Ausblenddauer und optionales Vorrendern konfigurieren.</li><li>Die `8`-Variante bietet indizierte State-zu-View-Einträge und Persistenz.</li></ul></td></tr>
</table>

Alte HTML-Snippets mit nativen VIS-2-Widgets in einer Child View neu aufbauen.
Legacy-Attribute `mdw-*` sind keine unterstützte VIS-2-Konfigurationsschnittstelle.
