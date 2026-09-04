# Top App Bar

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/top-app-bar.md)

VIS-2-Top-App-Bar mit responsivem Navigation Drawer und indizierten Menüeinträgen.
Template-ID: `tplVis2-materialdesign-TopAppBar-Navigation`.

<img src="../../media/vis2_top_app_bar_runtime.png" alt="Material-Design-Top-App-Bar in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Allgemein-/Bar-Gruppen sowie die Menüdaten und einen
Eintrag. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_top_app_bar_editor_overview.png" width="340" alt="Top App Bar Allgemein und Layout">

**Allgemein**

- **Objekt-ID** – erhält den Index des gewählten Eintrags.
- **Objekt-ID für ausgewählte Menüelement-ID oder Name** – optionaler zweiter
  State; er erhält die **Menüpunkt-ID** des Eintrags, ersatzweise dessen
  Beschriftung. Bei einem Untermenü steht dort `Eltern.Kind`.
- **Index der Navigationselemente anzeigen** – stellt jeder Beschriftung im
  Drawer ihren Index als `[0]`, `[1]` … voran. Praktisch beim Verdrahten der
  eingebetteten Ansichten, danach wieder abschalten.
- **Anzahl der Navigationselemente** – Anzahl der indizierten Eintragsgruppen.
- **Vorauswahl, solange die Objekt-ID keinen Wert hat** – der Index, der bis zum
  ersten Menüklick ausgewählt ist; **Vorauswahl deaktivieren** lässt dann nichts
  ausgewählt.

**Top App Bar Layout**

- **Layout** – `standard`, `dense` oder `short`; die Werte stehen im Editor roh da.
- **Titel** – fester Titel, Vorgabe „Material Design Widgets“.
- **Titel des ausgewählten Navigationsleistenelements anzeigen** (Vorgabe an)
  ersetzt ihn durch den aktiven Menüeintrag, **Symbol des ausgewählten
  Navigationsleistenelements anzeigen** stellt dessen Icon davor.
- Farben und Schrift des Balkens setzen die Felder darunter, dazu **z-Index**
  (Vorgabe 998) für die Stapelreihenfolge gegenüber anderen Widgets.

Die Gruppe **Navigationsleiste: Layout** bestimmt das **Layout** des Drawers
(`modal`, `permanent` oder `auto` — `auto` bleibt bis zur unter **Layout 'auto':
automatische Änderung des Layouts bei Auflösung größer** gesetzten Breite modal,
Vorgabe 800 px), **Breite**, **Zeilenüberschrift anzeigen** samt **Kopfzeile
Text**, **Beschriftungen für Listenelemente anzeigen** (aus heißt: nur Symbole)
und den **Trennlinien Stil** (`standard`, `padded`, `inset`, ebenfalls roh).

Die drei Gruppen **Navigationsleiste: Farben**, **Untermenü-Layout** und
**Untermenüfarben** erscheinen erst mit dem Schalter **Erweiterte Optionen
anzeigen** in **Allgemein**.

Die Menüeinträge stammen aus den Daten- und Eintragsgruppen:

<img src="../../media/vis2_top_app_bar_editor_2.png" width="340" alt="Top App Bar Menüdaten und Eintrag">

- **Eingabemethode für die Navigationselemente** – **über den Editor** (die
  indizierte Gruppe **Navigationsleiste: Element**) oder **JSON-String**. Bei
  JSON verschwindet die indizierte Gruppe, und **JSON-Sting für
  Navigationselemente** hält ein Array aus `{ "text", "menuId", "icon",
  "iconColor", "header", "divider", "subMenus" }`.
- **Menüpunkt-ID** – der Wert, den die zweite Objekt-ID für diesen Eintrag
  bekommt. Der Index in der ersten Objekt-ID hängt nicht daran.
- **Beschriftung / Überschrift / Trennlinie** – Eintragstext, ein Abschnittskopf
  über dem Eintrag und eine Trennlinie darunter.
- **Bild** samt Farben und **Untermenüs** – letzteres ein JSON-Array im selben
  Format wie oben. Ein Eintrag mit Untermenü klappt beim Klick nur auf; **Wert
  auch schreiben, wenn Eintrag zum Untermenü umschalten gedrückt wird** schreibt
  zusätzlich seinen Index.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Layouts standard, dense und
short, fester Titel, eigene Farbe, permanenter Drawer und Drawer nur mit
Symbolen.

<img src="../../media/vis2_top_app_bar_styles.png" alt="Top App Bar im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_top_app_bar_styles_dark.png" alt="Top App Bar im klassischen und im Material-3-Stil, dunkel">
## Zwischen Ansichten umschalten

Die Top App Bar navigiert nicht selbst. Sie schreibt nur den Index des gewählten
Eintrags in ihre **Objekt-ID** (Eintrag 0 → `0`, Eintrag 1 → `1`, Untermenüs
zählen in derselben Reihenfolge mit). Den Wechsel der Ansicht übernimmt ein
zweites Widget, das dieselbe Objekt-ID liest:
[Advanced View in Widget](html-widgets.md) in der `8`-Variante, mit einer
eingebetteten Ansicht je Index.

Der übliche Aufbau: die Top App Bar und darunter das Advanced View in Widget 8,
beide auf derselben Ansicht, beide mit derselben Objekt-ID. Das Widget muss so
hoch sein wie der Drawer, den es aufklappen soll — der leere Rest seines Rahmens
lässt Klicks zu den darunterliegenden Widgets durch.
