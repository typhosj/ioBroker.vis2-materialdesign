# Select und Autocomplete

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/select.md)

Native VIS-2-Dropdowns zur Wertauswahl. Autocomplete verhält sich wie Select,
filtert die Einträge aber zusätzlich beim Tippen.

Template-IDs: `tplVis2-materialdesign-Select` und `tplVis2-materialdesign-Autocomplete`.

<img src="../../media/vis2_select_runtime.png" alt="Material-Design-Auswahlelemente in VIS 2">

Autocomplete nutzt dieselben Einstellungen, filtert die Liste aber beim Tippen —
praktisch bei langen Wertelisten wie Städten oder Titeln.

<img src="../../media/vis2_autocomplete_runtime.png" alt="Material-Design-Autocomplete in VIS 2">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_select_editor_overview.png" width="300"></td>
<td><ul><li><b>Daten des Menüs:</b> Werteliste, JSON-String, JSON-Objekt oder die States des verknüpften Objekts.</li><li><b>Layout:</b> outlined, filled oder solo (optional rounded/shaped) — wie beim <a href="input.md">Eingabe</a>-Widget.</li><li><b>Symbole:</b> ein Icon je Eintrag plus das Icon des gewählten Werts (prepend, prepend-inner oder append).</li><li>Beschriftungen, Löschen-/Aufklapp-Icons und Farben liegen in optionalen Gruppen.</li></ul></td></tr>
</table>

Wertelisten-Beispiel: Werte `1;2;3`, Texte `Wohnzimmer;Küche;Bad`, Icons
`sofa;silverware-fork-knife;shower`. JSON-Einträge können `value`, `text`,
`subText`, `icon` und `iconColor` nutzen.
