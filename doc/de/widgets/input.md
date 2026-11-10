# Eingabe

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/input.md)

Ein natives VIS-2-Feld zur Eingabe von Text oder Zahlen.
Template-ID: `tplVis2-materialdesign-Input`.

<img src="../../media/vis2_input_runtime.png" alt="Material-Design-Eingabefeld in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein** und **Layout Eingabe**
aufgeklappt. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_input_editor_overview.png" width="340" alt="Eingabe Allgemein und Layout">

**Allgemein**

- **Objekt-ID** – der State, in den die Eingabe geschrieben wird.
- **Eingabetyp** – `Text`, `Zahl`, `Datum`, `Zeit` oder `Maske`. Bei `Zahl` wird
  eine Zahl geschrieben, sonst Text; ein leer gemachtes Zahlenfeld schreibt
  nichts, statt eine 0 in den State zu setzen.
- **Eingabemaske** – nur beim Eingabetyp `Maske`. Platzhalter: `#` Ziffer,
  `S` Buchstabe, `A` Buchstabe groß, `a` Buchstabe klein, `N` Ziffer oder
  Buchstabe, `X` beliebiges Zeichen. Jedes andere Zeichen ist ein fester
  Trenner, `##:##` ergibt also eine Uhrzeit-Eingabe.
- **maximale Länge** – begrenzt die Eingabe und liefert dem Zähler den Wert
  hinter dem Schrägstrich.
- **Auswahlhilfe** – nur bei `Datum` und `Zeit`. `Browser (nativ)` nutzt Feld und
  Auswahl des Browsers; Sprache und 12-/24-Stunden-Format bestimmt dann der Browser.
  `Material-Auswahl` zeigt den Wert im Format der Gerätesprache, das Feld bleibt mit
  passender Maske tippbar (`##.##.####` auf Deutsch, `##/##/####` auf US-Englisch),
  und das Symbol am Feldende öffnet einen Material-3-Kalender bzw. ein Zifferblatt.
  In den State kommt weiterhin `JJJJ-MM-TT` bzw. `HH:MM`.
- **Zeitformat** – bei `Zeit` mit Material-Auswahl: `Gebietsschema` (12 oder 24
  Stunden, wie die Gerätesprache es vorsieht), `24 Stunden` oder `12 Stunden`.

`Text`, `Zahl` und `Maske` schreiben beim Verlassen des Felds oder mit Enter,
`Datum` und `Zeit` sofort nach der Auswahl. Mit Material-Auswahl wird getippter Text
beim Verlassen des Felds oder mit Enter geschrieben und die Auswahl mit OK; Text, der
kein gültiges Datum bzw. keine gültige Uhrzeit ist, wird nicht geschrieben.

**Auswahlhilfe** (nur Material-Auswahl)

- **Hintergrundfarbe, Akzentfarbe, Textfarbe, Textfarbe auf Akzent** – Farben des
  Auswahldialogs. Leer gelten die Material-3-Farben des Themes. Das Kalender- bzw.
  Uhrsymbol im Feld nimmt die Farbe des **Text-Löschen-Symbols**.

**Layout Eingabe**

- **Layout** – `regular`, `solo`, `solo-rounded`, `solo-shaped`, `filled`,
  `filled-rounded`, `filled-shaped`, `outlined`, `outlined-rounded` oder
  `outlined-shaped`.
- **Textausrichtung** – `links`, `Mitte` oder `rechts` für den eingegebenen Text.
- **automatisch fokussieren** – das Feld bekommt beim Laden der Ansicht den Fokus.
- Hintergrund-, Rahmen- und Textfarben gelten je für den normalen, überfahrenen
  und ausgewählten Zustand.

**Beschriftung der Eingabe**

- **Text** – die schwebende Beschriftung über dem Feld.
- **Versatz x / Versatz y** – verschieben sie, wenn sie mit einem Symbol kollidiert.

**Anhänge der Eingabe**

- **vorangestellter Text / angehängter Text** – fester Text links bzw. rechts im
  Feld, etwa eine Einheit. Er wird nicht in den State geschrieben.

**Untertext der Eingabe**

- **Text** – Hinweiszeile unter dem Feld.
- **immer anzeigen** – abgeschaltet erscheint der Hinweis nur, solange das Feld
  den Fokus hat.

**Zählerlayout**

- **Zähler anzeigen** – zeigt unten rechts die Zeichenzahl, mit gesetzter
  **maximaler Länge** als `12 / 30`.

**Symbole**

Für das **Text-Löschen-Symbol**, das **vorangestellte**, das **innere
vorangestellte**, das **angehängte** und das **äußere angehängte Symbol** lässt
sich je ein Icon oder ein Bild samt Größe und Farbe wählen.

<img src="../../media/vis2_input_editor_icons.png" width="340" alt="Eingabe-Symbolfelder">

Für die Auswahl aus einer Werteliste nutze stattdessen das [Select](select.md)-Widget.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Layouts regular, filled,
filled-rounded, outlined, outlined-rounded und solo, Prefix/Suffix, Hinweis und
Zähler, Zahlenfeld mit Clear-Icon und zentrierten Text.

<img src="../../media/vis2_input_styles.png" alt="Eingabefeld im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_input_styles_dark.png" alt="Eingabefeld im klassischen und im Material-3-Stil, dunkel">
