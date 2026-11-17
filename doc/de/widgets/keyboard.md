# Bildschirmtastatur

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/keyboard.md)

Eine Tastatur innerhalb der vis-Seite für Wandtablets, auf denen die Android-Tastatur den halben
Bildschirm verdeckt. Sie bedient die Textfelder ihrer View, hält die System-Tastatur für diese
Felder geschlossen und erscheint nur, solange eines davon den Fokus hat.
Template-ID: `tplVis2-materialdesign-Keyboard`.

## Editor-Einstellungen

**Allgemein**

- **bediente Widgets (IDs, leer: alle Felder der View)** – Widget-IDs (zum Beispiel
  `w000012 w000013`); leer bedient jedes Textfeld der View, in der die Tastatur platziert ist.
  Checkboxen, native Datums- und Zeitfelder sowie schreibgeschützte und deaktivierte Felder werden
  nie bedient.
- **Layout** – `automatisch (nach Feld)` zeigt den Ziffernblock für Zahlenfelder und Felder, die
  Ziffern verlangen (das tun die Datums- und 24-h-Zeitfelder des Eingabe-Widgets), sonst die
  Buchstaben; `Text` und `Zahlen` erzwingen eines davon.
- **Tastaturbelegung** – `automatisch (vis-Sprache)` folgt der vis-Sprache: Deutsch bekommt QWERTZ
  mit ä, ö, ü und ß, jede andere Sprache QWERTY; `Deutsch (QWERTZ)` und `Englisch (QWERTY)`
  erzwingen eine Belegung.
- **Großbuchstabe am Anfang** – die Umschalttaste ist in einem leeren Feld und nach `. `
  eingeschaltet.
- **Enter-Taste** – `übernehmen und schließen`, `zum nächsten Feld` (schließt nach dem letzten)
  oder `nur übernehmen`. Enter übernimmt auch in einem mehrzeiligen Feld und fügt keinen
  Zeilenumbruch ein. `zum nächsten Feld` folgt der Reihenfolge der Felder in der Seite (der
  Reihenfolge, in der die Widgets angelegt wurden), nicht ihrer Position auf dem Bildschirm.

**Platzierung**

- **Position** – `wie im Editor platziert` (das eigene Rechteck des Widgets), `unten in der View`,
  `oben in der View` (beide mit voller Breite der View und der Höhe des Widgets) oder
  `unten am Bildschirm`.
- **beim Einblenden** – `View überdecken`, `View nach oben schieben` (nur so weit, dass das Feld
  8 px über der Tastatur bleibt) oder `Platz anhängen und scrollen` (der scrollende Container
  bekommt unten Platz und scrollt das Feld ins Sichtfeld; in einer Dialog View **scrollY**
  einschalten, sonst wird der Platz abgeschnitten). Die letzten beiden wirken nur, wenn die
  Tastatur unter dem Feld liegt, sie sind also für die unteren Positionen gedacht; eine Tastatur
  oben in der View überdeckt die View, was auch gewählt ist.
- **Animation** und **Animationsdauer (ms)** – wie die Tastatur erscheint (`keine`, `einblenden`
  oder `hineinschieben`); das Ausblenden geschieht sofort.

**Wortvorschläge**

- **Wortvorschläge anzeigen** – eine Leiste über den Tasten mit den am häufigsten getippten
  Wörtern; solange ein Wort begonnen ist, nur Wörter, die damit beginnen. Antippen setzt das Wort
  ein und hängt ein Leerzeichen an; langes Drücken entfernt das Wort aus der Liste (für gelernte
  Tippfehler).
- **Anzahl Vorschläge** – 1 bis 10.
- **State für die Wörter (leer: dieser Browser)** – ein String-State, der die Liste als JSON hält und
  von allen Geräten geteilt wird, die ihn benutzen. Leer hält die Liste nur in diesem Browser.
  Wörter werden gelernt, wenn ein Feld verlassen wird oder Enter übernimmt, nie aus
  Passwortfeldern oder vom Ziffernblock, höchstens 200 Wörter. Wer Admin-Zugriff hat, kann die
  Wörter im State lesen.

**Aussehen** – Hintergrund, Tastenfarbe, Tastenschrift, Farbe der Sondertasten, Schriftgröße,
Tastenabstand und Eckenradius der Tasten. Nicht gesetzte Farben folgen dem Material-3-Theme.

## Hinweise

- Felder in anderen Views werden nicht bedient; dort ebenfalls eine Tastatur platzieren. Pro View genau eine Tastatur verwenden.
- Ein Zahlenfeld zeigt nichts an, solange nur `.` oder `-` getippt ist; die Ziffern erscheinen,
  sobald eine Ziffer folgt.
- Zahlenfelder zeigen keinen Cursor, solange die Tastatur sie bedient; die Tastatur hängt dort immer am Ende an.
- Lernen zwei Geräte im selben Moment in denselben State, kann ein Zähler verloren gehen.
