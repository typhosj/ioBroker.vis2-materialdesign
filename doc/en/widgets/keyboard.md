# On-screen Keyboard

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/keyboard.md)

A keyboard inside the vis page for wall tablets, where the Android keyboard covers half of the
screen. It serves the text fields of its view, keeps the system keyboard closed for them and
shows itself only while one of them has the focus. Template id: `tplVis2-materialdesign-Keyboard`.

## Editor settings

**Common**

- **served widgets** – widget IDs (for example `w000012 w000013`); empty serves every text field of
  the view the keyboard is placed in. Checkboxes, native date and time fields, read-only and
  disabled fields are never served.
- **layout** – `automatic` shows the number pad for number fields and fields that ask for digits
  (the Input widget's date and 24 h time fields do), the letters otherwise; `text` and `numbers`
  force one.
- **key map** – `automatic` follows the vis language: German gets QWERTZ with ä, ö, ü and ß, every
  other language QWERTY.
- **capital letter at the start** – shift is on in an empty field and after `. `.
- **Enter key** – `commit and close`, `next field` (closes after the last one) or `commit only`.
  Enter commits in a multi-line field as well and does not insert a line break. `next field`
  follows the order of the fields in the page (the order the widgets were created in), not their
  position on the screen.
- **arrow keys** – adds ← ↑ ↓ → keys (on the number pad a fifth column). ← and → move the cursor;
  ↑ and ↓ move through the list of an Autocomplete widget, in any other field they jump to the start
  or the end. Holding a key repeats it.

**placement**

- **position** – `as placed in the editor` (the widget's own rectangle), `bottom of the view`,
  `top of the view` (both the full view width and the widget height) or `bottom of the screen`.
- **on showing** – `cover the view`, `move the view up` (only as far as needed to keep the field
  8 px above the keyboard) or `add room and scroll` (the scrolling container gets room below and
  scrolls the field into sight; in a Dialog View turn on **scrollY**, otherwise the room is cut off).
  The last two only act when the keyboard is below the field, so they are meant for the bottom
  positions; a keyboard at the top of the view covers the view, whatever is chosen.
- **animation** and **animation duration** – how the keyboard appears; hiding is immediate.

**word suggestions**

- **show word suggestions** – a bar above the keys with the most typed words; while a word is
  started, only words that begin with it. Tap fills the word in and adds a space; a long press
  removes the word from the list (for learned typos).
- **number of suggestions** – 1 to 10.
- **state for the words** – a string state that keeps the list as JSON, shared by every device that uses
  it. Empty keeps the list in this browser only. Words are learned when a field is left or Enter
  commits, never from password fields or the number pad, at most 200 words. Anyone with admin
  access can read the words in the state.

**look** – background, key colors, font size, key gap and corner radius. Unset colors follow the
Material 3 theme.

## Notes

- Fields in other views are not served; place a keyboard there too. Use one keyboard per view.
- Two devices learning into the same state at the same moment can lose one count.
