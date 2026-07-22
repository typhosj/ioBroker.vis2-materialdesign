# Responsives Layout

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/responsive-layout.md)

Responsive VIS-2-Container für Masonry Views, Grid Views und zustandsgesteuerte
eingebettete Ansichten.

Template-IDs: `tplVis2-materialdesign-Masonry-Views`,
`tplVis2-materialdesign-Grid-Views`, `tplVis2-materialdesign-view-in-widget`
und `tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_responsive_layout_runtime.png" alt="Responsives Material-Design-Layout in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppe **Allgemein** und einen indizierten
**View**-Eintrag des Masonry-Containers. Nicht aufgeführte Einstellungen sind
selbsterklärend.

<img src="../../media/vis2_responsive_layout_editor_overview.png" width="340" alt="Responsives Layout Allgemein und View">

**Allgemein**

- **Anzahl der Spalten / Abstand zwischen Views** – das Grundraster auf dem Desktop.
- **Anzahl der Views** – wie viele indizierte Gruppen **View [n]** existieren.
- Die Gruppen **Handy Einstellungen** und **Tablet Einstellungen** überschreiben die Spaltenzahl je Bildschirmgröße.

**View [n]**

- **View** (`Seite`) – die eingebettete VIS-2-Ansicht.
- **Höhe / Breite / Sortierung** – Größe und Position im Raster (Grid nutzt feste Zeilen-/Spaltenspannen).
- **Sichtbarkeits-Objekt / -Bedingung / -Wert** – diese View nur zeigen, wenn ein State passt.

**Advanced View** wählt per State eine einzelne eingebettete Ansicht; siehe
[Advanced View in Widget](html-widgets.md).

Die native VIS-2-Child-View-Funktion bettet Inhalte ein, ohne die aktive
Hauptansicht zu wechseln.

**Auswahlhilfe:** Masonry oder Grid verwenden, wenn mehrere Views gleichzeitig
responsiv angeordnet werden sollen. [Advanced View in Widget](html-widgets.md)
verwenden, wenn ein State genau eine Child View auswählt.
