# Buttons

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/buttons.md)

Sechs native VIS-2-Buttonvarianten für Navigation, Links, Zustandswerte,
mehrere Zustände, numerische Addition und Ein/Aus-Umschaltung.

Template-IDs: `tplVis2-materialdesign-Button-Navigation`, `-Link`, `-State`,
`-State-Multi`, `-Adition` und `-Toggle`.

<img src="../../media/vis2_buttons_runtime.png" alt="Material-Design-Buttons in VIS 2">

## Editor-Einstellungen

Variante im Widget-Set **Material Design** wählen, markieren und den Reiter
**WIDGET** öffnen. Die Screenshots nutzen die Varianten *State* und
*Multi State*. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_buttons_editor_overview.png" width="340" alt="Button Allgemein und Beschriftung">

**Allgemein** – die Aktionsfelder hängen von der Variante ab:

- **Navigation** – zu öffnende VIS-2-Zielansicht.
- **Link** – URL und *in neuem Fenster öffnen*.
- **State** – Objekt-ID und der beim Klick geschriebene Wert.
- **Addition** – *Wert* ist die Schrittweite, als Zahl ohne Vorzeichen für aufwärts und mit `-` für abwärts. *Min/Max* begrenzt das Ergebnis: `0;100` setzt beide Enden, eine einzelne Zahl begrenzt die Richtung der Schrittweite – bei `5` als Schritt ist `50` das Maximum, bei `-1` als Schritt ist `5` das Minimum. Leer heißt unbegrenzt.
- **Toggle** – *Umschalttyp* (`boolean` oder eigene Aus-/Ein-Werte) und *Taster* (bei Drücken und Loslassen schreiben).

**Beschriftung**

- **Buttontext / Beschriftung true** – Text; im Ein-Zustand kann ein zweiter Text erscheinen.
- **Ausrichtung** – Anordnung von Icon/Text im Button.

Die Variante **Multi State** ersetzt den einzelnen Wert durch indizierte
Objekt-/Wert-Zeilen mit jeweils eigener Verzögerung:

<img src="../../media/vis2_buttons_editor_2.png" width="340" alt="Multi-State indizierter Objekt-/Wert-Eintrag">

Die Gruppe **Bild / Icon** nimmt einen Material-Design-Iconnamen oder eine
Bildquelle (mit eigener Ein-Zustand-Farbe), **Farben** überschreibt das Thema,
**Feedback** ergänzt Haptik und Klicksound, und **Verriegeln** verlangt einen
Entsperr-Klick vor der Aktion.

**Schaltflächenstil** (nur Stil *Klassisch*)

- **raised** – gefüllte Fläche mit Schatten.
- **unelevated** – dieselbe gefüllte Fläche ohne Schatten.
- **outlined** – nur Rahmen, Fläche transparent.
- **text** – nur Beschriftung, weder Rahmen noch Fläche.

**Ein-Zustand** – *Beschriftung true*, *Beschriftungsfarbe für true*, *aktiver
Hintergrund*, *aktives Bild* und *aktive Bildfarbe* gelten, solange der Button
aktiv ist. Aktiv heißt bei *State* „das Objekt hat den geschriebenen Wert", bei
*Toggle* „eingeschaltet" und bei *Navigation* „die Zielansicht ist gerade
geöffnet" – damit lässt sich in einer Navigationsleiste die aktuelle Seite
hervorheben. *Link*, *Addition* und *Multi State* haben keinen Ein-Zustand.

**Farb-Vorrang** – dieselbe Fläche lässt sich aus zwei Gruppen einfärben, die
Farbe aus **Farben** gewinnt:

- *Primärfarbe* überschreibt *Hintergrund*, im aktiven Zustand gewinnt *aktiver Hintergrund*.
- *sekundäre Farbe* überschreibt *Bildfarbe* (und die Beschriftungsfarbe, solange keine gesetzt ist).

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Container-Varianten filled,
tonal, elevated, outlined und text, reines Label, read only, gesperrt und eine
eigene Farbe.

<img src="../../media/vis2_buttons_styles.png" alt="Buttons im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_buttons_styles_dark.png" alt="Buttons im klassischen und im Material-3-Stil, dunkel">
