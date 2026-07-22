# Slider

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/slider.md)

Horizontaler oder vertikaler nativer VIS-2-Slider für numerische Zustände.
Template-ID: `tplVis2-materialdesign-Slider`.

<img src="../../media/vis2_slider_runtime.png" alt="Material-Design-Slider in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Gruppen, die Verhalten und Beschriftung bestimmen.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_slider_editor_overview.png" width="340" alt="Slider Allgemein und Skala">

**Allgemein**

- **oid** – der Wert-State; **oid-working** meldet optional, dass ein Gerät die Zielposition noch anfährt.
- **Ausrichtung / Umkehren** – horizontal oder vertikal, sowie invertierte Richtung.
- **Min / Max / Schritt** – Wertebereich und Schrittweite.
- **Nur lesen** – zeigt den Wert an, schreibt aber nie.

**Schritte Layout (Teilstriche)**

- **Teilstriche zeigen** – zeichnet Markierungen entlang der Spur.
- **Teilstrich-Texte** – zeigt den Wert an jedem Teilstrich; Größe und Farben folgen.

<img src="../../media/vis2_slider_editor_2.png" width="340" alt="Slider Beschriftung und Regler-Label">

**Beschriftung**

- **Vorangestellter Text** – Beschriftung links vom Slider.
- **Wertlabel-Stil / Einheit** – Rohwert oder Prozent samt Einheitensuffix.
- **Min-/Max-Texte** und **Kleiner-/Größer-als-Ersatztexte** – zeigen an den Enden oder unter/über einer Grenze festen Text statt der Zahl.

**Layout des Regler-Labels**

- **Regler-Label zeigen** – aus, beim Ziehen oder immer.
- Regler-**Größe**, Hintergrund- und Schriftfarben folgen.
