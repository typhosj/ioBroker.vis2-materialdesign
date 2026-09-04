# Tabelle

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/table.md)

Native VIS-2-Tabelle für JSON-Zeilen mit konfigurierbaren indizierten Spalten.
Template-ID: `tplVis2-materialdesign-Table`.

<img src="../../media/vis2_table_runtime.png" alt="Material-Design-Tabelle in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Allgemein-/Layout-Gruppen und eine indizierte Spalte.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_table_editor_overview.png" width="340" alt="Tabelle Allgemein und Layout">

**Allgemein**

- **oid / Daten-JSON** – ein JSON-Array aus einem State oder direkt als Text eingegeben.
- **Spaltenanzahl** – Anzahl der indizierten Gruppen **Spaltenlayout [n]**.

**Layout**

- **Tabellenlayout** – Standard, Karte oder umrandete Karte.
- **Kopf zeigen / fixierter Kopf** – Kopfzeile und ob sie beim Scrollen bleibt.
- **Zeilenhöhe / abgerundeter Rand** – Zeilenabstand und runde Ecken.

**Farbe**

- **Zeilenhintergrund / Zeilenhintergrund ungerade** – ist die zweite Farbe
  gesetzt, wechseln sich beide zeilenweise ab; bleibt sie leer, gilt die erste
  für alle Zeilen.

Jede Spalte wird in ihrer eigenen indizierten Gruppe konfiguriert:

<img src="../../media/vis2_table_editor_2.png" width="340" alt="Indizierte Tabellenspalte">

- **Beschriftung** – Spaltenkopftext.
- **Spaltentyp** – Text- oder Bildzelle.
- **Sortierschlüssel** – die JSON-Eigenschaft, die die Spalte liest und sortiert.
- **Breite / Ausrichtung / kein Umbruch** – Spaltengröße und Textverhalten.
- **Präfix / Suffix** – Text um den Zellenwert.

Die Spalten sind die Eigenschaften der **ersten** Zeile, in deren Reihenfolge.

```json
[{ "geraet": "Temperatur", "raum": "Wohnzimmer", "wert": "22,4 °C" }]
```

Jede weitere Zeile wird gegen diese Spalten gelesen: eine Eigenschaft, die einer
Zeile fehlt, lässt ihre Zelle leer und verschiebt die übrigen Spalten nicht.

Die Tabelle zeigt nur, was in diesem JSON steht. Sollen einzelne Datenpunkte
untereinander erscheinen, ohne sie vorher in ein JSON zu schreiben, ist die
[Liste](list.md) mit Bindungen in den Zeilentexten der kürzere Weg, siehe
[Werte in Texten anzeigen](../README.md#werte-in-texten-anzeigen).

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Tabelle mit und ohne
Kopfzeile, abgerundet, mit fixiertem Kopf und mit Zeilentrennern.

<img src="../../media/vis2_table_styles.png" alt="Tabelle im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_table_styles_dark.png" alt="Tabelle im klassischen und im Material-3-Stil, dunkel">
