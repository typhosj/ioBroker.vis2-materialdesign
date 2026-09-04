# Wertanzeige

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/value.md)

Zeigt einen ioBroker-Zustand als Text, Zahl, Bool-Wert oder verknüpften Wert an –
mit Formatierung, Präfix/Suffix und optionalem Icon. Template-ID:
`tplVis2-materialdesign-value`.

Ein Widget zeigt genau einen State. Für mehrere Werte untereinander in einem
Widget die [Liste](list.md) mit Bindungen in den Zeilentexten benutzen, siehe
[Werte in Texten anzeigen](../README.md#werte-in-texten-anzeigen).

<img src="../../media/vis2_value_runtime.png" alt="Material-Design-Wertanzeige in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Gruppen, die die Ausgabe bestimmen. Nicht
aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_value_editor_overview.png" width="340" alt="Wertanzeige Allgemein und Zahlenformat">

**Allgemein**

- **Zieltyp** – wie der State interpretiert wird: `automatisch`, `Zahl`, `string`, `boolean` oder `verknüpft` (klickbarer Wert, der das Objekt öffnet).
- **Text überschreiben** – ersetzt die fertige Ausgabe durch einen eigenen Text, in dem `#value` für den formatierten Wert steht, z. B. `Zähler: #value`. Enthält die Ausgabe Pipe-Zeichen, sind die Teile einzeln als `#value[0]`, `#value[1]`, … verfügbar.

**Layout**

- **Text vorangestellt / angehängter Text** – fester Text vor bzw. nach dem Wert (Einheit, Beschriftung), je mit eigener Farbe, Schriftart und -größe.
- **Textausrichtung** – `Anfang`, `Mitte` oder `Ende`.
- **Abstand Beschriftung** – Abstand in Pixel zwischen Symbol, Text und Wert (Vorgabe 4).

**Zahlenformatierung**

- **minimale / maximale Nachkommastellen** – Anzahl der angezeigten Dezimalstellen.
- **Einheit** – an die Zahl angehängter Einheitentext.
- **Berechnung** – mathematischer Ausdruck, der vor der Anzeige auf den Wert angewendet wird. Der Wert steht als `#value` im Ausdruck, z. B. `#value/1000` für Wh → kWh. Ein Ausdruck ohne `#value` wird nicht ausgewertet.
- **Sekunden in Dauer umwandeln** – Vorlage aus den Zeichen `d`, `h`, `m`, `s` (doppelt = zweistellig), z. B. `hh:mm:ss`. Die größte verwendete Einheit sammelt den Überlauf: `mm:ss` zeigt bei 2 Stunden `120:00`. Text in eckigen Klammern bleibt wörtlich stehen — nötig für Einheitenwörter, deren Buchstaben sonst als Vorlage gelten: `hh:mm [Std]`. Der Sonderwert `humanize` schreibt die Dauer in der Sprache der Oberfläche aus, gerundet auf die größte passende Einheit („2 Stunden“, „45 Sekunden“).
- **Zeitstempel in Datum / Uhrzeit konvertieren** – erwartet **Sekunden** seit 1970, nicht Millisekunden. Vorlage aus `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `M`, `DD`, `D`, `dddd`, `ddd`, `dd`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A`, `a`; eckige Klammern wieder wörtlich. Leer gelassen gilt das Datums- und Zeitformat des Browsers.

<img src="../../media/vis2_value_editor_2.png" width="340" alt="Wertanzeige Symbol-Optionen">

**Symbol**

- **Bild** – Material-Design-Iconname, Bildpfad/URL oder Data-URL neben dem Wert.
- **Bildposition** – vor oder nach dem Wert.
- **Bildfarbe / Bildhöhe** – Umfärben (einfarbiges SVG) und Größe des Icons.

**Logikwert Formatierung**

- **Text wenn wahr / Text wenn falsch** – was statt `true` und `false` erscheint.
- **Bedingung** – Ausdruck mit demselben Platzhalter `#value` wie die Berechnung, der bei nicht-booleschen Eingaben über den true/false-Zustand entscheidet, z. B. `#value > 20`. Ohne `#value` wird nichts ausgewertet; ohne Bedingung gelten `true`, `"true"`, `1` und `"1"` als wahr.

**Verknüpfter Wert**

- **Beim Laden versteckt** – das Widget bleibt unsichtbar, bis der State das erste Mal geliefert hat.

**Wertänderungseffekt**

- **aktiviert** – hebt den Wert bei jeder Änderung kurz hervor, mit eigener **Schriftfarbe**, **Schriftgröße** und **Effektdauer** (Vorgabe 750 ms). Die Effektfarbe gewinnt, solange sie läuft.

Die Gruppen **Layout**, **Logikwert Formatierung**, **Verknüpfter Wert** und
**Wertänderungseffekt** erscheinen erst über **Erweiterte Optionen anzeigen** —
unabhängig vom gewählten Zieltyp. Ein Widget, das solche Werte bereits enthält,
zeigt sie auch ohne den Schalter.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): Zahl mit Einheit, Boolean als
Text, Text mit Präfix, Wert mit Symbol, rechtsbündig sowie das Icon-Widget
klein, groß und eingefärbt.

<img src="../../media/vis2_value_styles.png" alt="Wertanzeige und Symbol im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_value_styles_dark.png" alt="Wertanzeige und Symbol im klassischen und im Material-3-Stil, dunkel">
