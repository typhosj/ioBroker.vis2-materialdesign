# Diagramme

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/charts.md)

Vier native VIS-2-Diagramme für unterschiedliche Datenquellen.

<img src="../../media/vis2_charts_runtime.png" alt="Material-Design-Diagramme in VIS 2">

## Widgets

- [Balkendiagramm](chart-bar.md) – einzelne aktuelle State-Werte vergleichen.
- [Kreisdiagramm](chart-pie.md) – Anteile einzelner aktueller State-Werte darstellen.
- [JSON-Diagramm](chart-json.md) – mehrere Balken- und Linienreihen aus einem JSON-State kombinieren.
- [Linienverlaufsdiagramm](chart-line-history.md) – Zeitreihen direkt aus einer History-Instanz laden.

Bar und Pie können ihre Werte entweder aus indizierten Editor-Datensätzen oder
aus einem gemeinsamen JSON-State lesen. **Anzahl der Datensätze** ist die Anzahl:
3 ergibt drei Datensätze mit den Gruppen Datensatz [0] bis [2]. In VIS 1 war der
Wert der letzte Index, dort ergab 3 vier Datensätze — beim Übernehmen eines alten
Diagramms den Wert also einmal prüfen. JSON Chart erwartet ein eigenes
Mehrreihenformat. Line History fragt historische Werte über die ausgewählte
History-Adapterinstanz ab.

## Gemeinsame Einstellungen

Alle vier Diagramme teilen diese Gruppen. Der Screenshot zeigt die Gruppen
**Diagramm Layout** und **Legende** aufgeklappt. Die Editor-Sprache folgt der
ioBroker-Systemsprache, daher sind die Screenshots deutsch.

<img src="../../media/vis2_charts_editor_overview.png" width="340" alt="Gemeinsame Diagramm- und Legenden-Optionen">

**Abstand von oben / links / rechts / unten** – Polsterung zwischen Zeichenfläche
und Widget-Rand. Eine leer gelassene Seite behält den Abstand, den chart.js selbst
wählt. Die vier Felder liegen bei Balken und Kreis in **Allgemein**, beim
JSON-Diagramm und beim Linienverlauf in **Diagramm Layout**.

**Diagramm Layout** – allgemeines Aussehen: Hintergrundfarben, Wertachsen-Vorgaben
(Min / Max, Dezimalstellen) und Animationsdauer.

**Card Hintergrund** – bettet Diagramm und HTML-Titel optional in eine
Material-Design-Karte ein. **Schriftgröße des Titels** bestimmt dessen Größe.

**Legende** – ob die Legende gezeigt wird und wie sie aussieht. Balken-, Kreis-
und JSON-Diagramm nutzen dieselbe Legende:

- **Legendenposition** – oben/unten ordnen Einträge horizontal an, links/rechts
  vertikal; die Position entscheidet außerdem, ob die Legende vor oder hinter der
  Zeichenfläche sitzt.
- **Legendenpunktlayout aktivieren** – runde Punkte statt eckiger Kästchen.
- **Breite der Legendenbox** – Größe dieser Markierung; Schrift, Farbe, Polsterung
  und Abstand zur Zeichenfläche folgen.

Balken und Kreis lassen die Legende aus, bis sie eingeschaltet wird, das
JSON-Diagramm zeigt sie standardmäßig.

**Werte** (*Balkendiagrammwerte Layout* / *Kreisdiagrammwerte Layout*, beim
Linienverlauf je Datensatz) – die Beschriftungen im Diagramm selbst:

- **Werte anzeigen** – `on` beschriftet jeden Balken, jedes Segment und jeden
  Punkt, `off` keinen, `auto` überlässt es chart.js. Balken und Kreis stehen auf
  ein, Linienverlauf auf aus: eine Verlaufslinie trägt hunderte Punkte, und eine
  Beschriftung an jedem davon ist eine Textwand.

- **jeden n-ten Wert beschriften** – dünnt die Beschriftungen aus, z. B. `5` für
  jeden fünften Punkt.
- Schrift, Farbe, Box und Platzierung der Beschriftungen folgen in derselben Gruppe.

**Tooltip** – zeigt Werte beim Berühren oder Überfahren eines Diagrammelements.
Neben den Farben ist auch die Geometrie einstellbar: **Pfeilgröße**,
**Tooltip-Abstand**, **Rahmenradius**, **x-padding** / **Y-Polsterung**,
**Titelabstand nach unten** und **Farbfeld anzeigen**. **Text Anhang** wird hinter
den Wert gehängt (Balken und Kreis), **Text minimale / maximale Dezimalstellen**
formatieren die Tooltip-Zahl — getrennt von den Wertbeschriftungen, die eigene
Dezimalstellen tragen.

**Hover-Effekte** – **Effekt für selektiert / hover deaktivieren** in der Gruppe
Diagramm Layout schaltet die Hervorhebung ganz ab; ohne das färben **Farbe
selektiert / hover** (Balken, Kreis) und **Rahmenfarbe / -breite selektiert /
hover** (Kreis) das Element unter dem Zeiger.

Ein **Farbschema** verteilt eine Palette auf Datensätze ohne eigene Farbe.

