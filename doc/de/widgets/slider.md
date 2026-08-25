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
- **Wert erst beim Loslassen senden** – während des Ziehens wird nichts geschrieben, sondern nur einmal, wenn der Zeiger losgelassen wird.

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

## Schreiben während des Ziehens

Ein Zug würde sonst bei jeder Zeigerbewegung einen State schreiben — hunderte
Schreibvorgänge, denen Bus und angeschlossenes Gerät nicht folgen können, sodass
eine Zigbee-Lampe dem Finger Sekunden hinterherhinkt. Das Widget sendet deshalb
die erste Bewegung sofort, damit ein Tippen weiterhin reagiert, begrenzt den Rest
auf einen Schreibvorgang je 200 ms und schreibt beim Loslassen den Rest heraus:
Der Wert, auf dem der Finger stehen bleibt, ist immer der Wert, der ankommt.

**Wert erst beim Loslassen senden** geht weiter und schreibt während des Ziehens
gar nichts. Der Regler folgt in beiden Fällen dem Finger, nur das Schreiben
unterscheidet sich. Sinnvoll für Geräte, die keine Zwischenwerte sehen sollen.
Slider, Runder Slider und der Icon-Button-Slider verhalten sich hier gleich.

