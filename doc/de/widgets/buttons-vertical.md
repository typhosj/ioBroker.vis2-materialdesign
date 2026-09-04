# Buttons vertikal

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/buttons-vertical.md)

Vertikale Gegenstücke aller sechs Button-Aktionen. Icon und Beschriftung stehen
untereinander; Aktion und Zustandsverhalten entsprechen den normalen Buttons.

Template-IDs verwenden das Suffix `-vertical`, zum Beispiel
`tplVis2-materialdesign-Button-Toggle-vertical`.

<img src="../../media/vis2_buttons_vertical_runtime.png" alt="Vertikale Material-Design-Buttons in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein**, **Beschriftung** und **Symbol**
aufgeklappt. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_buttons_vertical_editor_overview.png" width="340" alt="Vertikaler Button Allgemein, Beschriftung und Icon">

**Allgemein** – die Aktionsfelder entsprechen dem jeweiligen normalen
[Button](buttons.md) (Navigation, Link, State, Multi State, Addition, Toggle).

**Beschriftung**

- **Ausrichtung** – waagerechte Ausrichtung von Icon und Text in der Spalte:
  links, Mitte (Vorgabe) oder rechts. Die Reihenfolge von Icon und Text steuert
  dagegen **Bildposition** in der Gruppe **Symbol**.
- **Abstand zwischen Text und Bild** – Abstand zwischen Icon und Beschriftung,
  Vorgabe 2 px.
- **Buttontext / Beschriftung True** – Text; im Ein-Zustand kann ein zweiter
  Text erscheinen.

Die **Textbreite** der waagerechten Buttons gibt es hier nicht — in der Spalte
läuft der Text über die volle Breite.

**Symbol**

- **Bild** – Material-Design-Iconname oder Bildquelle, dazu **aktives Bild** für
  den Ein-Zustand.
- **Bildfarbe / aktive Bildfarbe** – einfarbiges Icon umfärben, mit eigener
  Farbe für den Ein-Zustand.
- **Bildposition** – `oben` (Vorgabe) oder `unten`, also Icon über oder unter
  dem Text.
- **Bildhöhe** – Icongröße, Vorgabe 26 px.

Die Gruppen **Farben** und **Verriegeln** erscheinen erst, wenn in **Allgemein**
der Schalter **Erweiterte Optionen anzeigen** gesetzt ist. Vibration und
Klickton stehen nicht in einer eigenen Gruppe, sondern unten in **Allgemein**.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die vertikalen Varianten
filled, tonal, elevated, outlined und text, Toggle im Ein-Zustand, read only und
gesperrt.

<img src="../../media/vis2_buttons_vertical_styles.png" alt="Vertikale Buttons im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_buttons_vertical_styles_dark.png" alt="Vertikale Buttons im klassischen und im Material-3-Stil, dunkel">
