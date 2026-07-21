# Dialog

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/dialog.md)

Zwei per State geöffnete VIS-2-Dialoge: einer bettet eine VIS-2-Ansicht ein, der
andere eine iFrame-URL.

Template-IDs: `tplVis2-materialdesign-Vuetify-Dialog-View` und
`tplVis2-materialdesign-Vuetify-Dialog-iFrame`.

<p>
<img src="../../media/vis2_dialog_runtime.png" alt="Geöffneter View-Dialog in VIS 2" width="300">
<img src="../../media/vis2_dialog_iframe_runtime.png" alt="Geöffneter iFrame-Dialog in VIS 2" width="300">
</p>

Links: ein Dialog mit eingebetteter VIS-2-View (ein Raum-Steuerpanel). Rechts: ein Dialog mit eingebetteter iFrame-Seite.

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_dialog_editor_overview.png" width="300"></td>
<td><ul><li>Lokalen Button oder Datenpunkt als Öffnungsmethode wählen. Boolesch true öffnet den Datenpunkt-Dialog; Schließen schreibt false.</li><li>View-Variante: eingebettete VIS-2-Ansicht wählen.</li><li>iFrame-Variante: URL, Sandbox und Scrollen einstellen.</li><li>Dialog, Titel, Aktionsbuttons und Schließen liegen in eigenen Gruppen.</li></ul></td></tr>
</table>

**Keine Sandbox** nur für vertrauenswürdige iFrame-Inhalte aktivieren.

Für dauerhaft eingebettete Inhalte ohne Dialog siehe
[Advanced View in Widget](html-widgets.md).
