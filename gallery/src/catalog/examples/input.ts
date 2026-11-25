import type { Example, FamilyExamples } from '../example';

const FIELD = { width: 280, height: 56 };
const FIELD_HELP = { width: 280, height: 80 };
const TOGGLE = { width: 220, height: 48 };
const KEYBOARD = { width: 'fill' as const, height: 280 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

const note = { oid: `${D}general.text`, inputLayout: 'outlined', inputLabelText: 'Note' };
const scene = { oid: `${D}general.scene`, inputLayout: 'outlined', inputLabelText: 'Scene', listDataMethod: 'multistatesObject' };
const mode = { oid: `${D}climate.mode`, inputLayout: 'outlined', inputLabelText: 'Heating mode', listDataMethod: 'valueList', valueList: '0;1;2;3', valueListLabels: 'Off;Comfort;Eco;Away', valueListIcons: 'power;sofa;leaf;airplane' };
const daypart = { oid: `${D}general.scene`, inputLayout: 'filled', inputLabelText: 'Scene', listDataMethod: 'valueList', valueList: 'morning;day;evening;night', valueListLabels: 'Morning;Day;Evening;Night', valueListIcons: 'weather-sunset-up;white-balance-sunny;weather-sunset;weather-night' };
const keyboard = { keyboardShowOn: 'always', keyboardAnimation: 'none', keyboardWordsOid: `${D}general.keyboardWords` };
const noteField = { module: 'MaterialDesignInput', data: { ...note, autoFocus: true }, size: FIELD };

const toggles = (light: string, label: string, offId: string) => [
    { ...typical('Switches a light; the label says which one.', 'Schaltet ein Licht; die Beschriftung sagt, welches.'), size: TOGGLE, data: { oid: `${D}${light}`, labelFalse: label } },
    { ...text(offId, 'Off state', 'Aus-Zustand', 'The same control on a light that is off.', 'Dasselbe Element an einem ausgeschalteten Licht.'), size: TOGGLE, data: { oid: `${D}kitchen.light`, labelFalse: 'Kitchen light' } },
    { ...text('label-left', 'Label on the left', 'Beschriftung links', 'Label first, control at the end of the row, as in a settings list.', 'Erst die Beschriftung, das Element am Zeilenende, wie in einer Einstellungsliste.'), size: TOGGLE, data: { oid: `${D}${light}`, labelFalse: label, labelPosition: 'left' } },
    { ...text('read-only', 'Status with text per state', 'Status mit Text je Zustand', 'Read only: shows whether the window is open, with its own text for each state.', 'Nur Anzeige: zeigt, ob das Fenster offen ist, mit eigenem Text je Zustand.'), size: TOGGLE, data: { oid: `${D}contacts.kitchenWindow`, labelFalse: 'Window closed', labelTrue: 'Window open', readOnly: true } },
    { ...text('locked', 'Locked', 'Gesperrt', 'The first tap unlocks, the second one switches; it locks again after 10 s.', 'Der erste Tipp entsperrt, der zweite schaltet; nach 10 s sperrt es wieder.'), size: TOGGLE, data: { oid: `${D}${light}`, labelFalse: label, lockEnabled: true } },
];

export const input: FamilyExamples = {
    MaterialDesignCheckbox: toggles('living.light', 'Living room light', 'checkbox-off'),
    MaterialDesignSwitch: [
        ...toggles('terrace.light', 'Terrace light', 'switch-off'),
        { ...text('checkmark', 'With checkmark', 'Mit Häkchen', 'Material 3 switch with an icon in the thumb, readable without color.', 'Material-3-Schalter mit Icon im Griff, auch ohne Farbe lesbar.'), designStyle: 'material3', size: TOGGLE, data: { oid: `${D}terrace.light`, labelFalse: 'Terrace light', md3SwitchIcon: true } },
        { ...text('custom-color', 'Own color', 'Eigene Farbe', 'An explicit on color wins over the theme.', 'Eine eigene Ein-Farbe schlägt das Theme.'), size: TOGGLE, data: { oid: `${D}terrace.light`, labelFalse: 'Terrace light', colorSwitchTrue: '#2e7d32' } },
    ],
    MaterialDesignInput: [
        { ...typical('A text field with a floating label, writes on Enter or when the field loses focus.', 'Ein Textfeld mit schwebender Beschriftung, schreibt bei Enter oder beim Verlassen.'), size: FIELD, data: note },
        { ...text('filled', 'Filled', 'Gefüllt', 'Filled container, stands out on a busy view.', 'Gefüllter Container, hebt sich auf einer vollen Ansicht ab.'), size: FIELD, data: { ...note, inputLayout: 'filled' } },
        { ...text('solo-shaped', 'Solo, shaped', 'Solo, geformt', 'No label line and cut corners, for a search-like field.', 'Ohne Beschriftungslinie und mit abgeschrägten Ecken, für ein suchfeldartiges Feld.'), size: FIELD, data: { ...note, inputLayout: 'solo-shaped' } },
        { ...text('number', 'Number with unit', 'Zahl mit Einheit', 'A number field with its unit as suffix, here the set temperature.', 'Ein Zahlenfeld mit der Einheit als Suffix, hier die Solltemperatur.'), size: FIELD, data: { oid: `${D}climate.setpoint`, inputType: 'number', inputLayout: 'outlined', inputLabelText: 'Set temperature', inputSuffix: '°C' } },
        { ...text('helper', 'Helper text and counter', 'Hilfetext und Zähler', 'A hint below the field and a counter against the maximum length.', 'Ein Hinweis unter dem Feld und ein Zähler gegen die Höchstlänge.'), size: FIELD_HELP, data: { ...note, inputLabelText: 'Room name', inputMessage: 'Shown in the room list', inputMaxLength: 24 } },
        { ...text('read-only', 'Read only', 'Nur Anzeige', 'Shows a text value that must not be changed here.', 'Zeigt einen Textwert, der hier nicht geändert werden darf.'), size: FIELD, data: { oid: `${D}weather.state`, inputLayout: 'outlined', inputLabelText: 'Weather', readOnly: true } },
    ],
    MaterialDesignSelect: [
        { ...typical('Picks one of the states the object defines, here the scene.', 'Wählt einen der Zustände, die das Objekt definiert, hier die Szene.'), size: FIELD, data: scene },
        { ...text('icons', 'Own list with icons', 'Eigene Liste mit Icons', 'Values, labels and icons from three lists; the field shows the icon of the choice.', 'Werte, Beschriftungen und Icons aus drei Listen; das Feld zeigt das Icon der Auswahl.'), size: FIELD, data: mode },
        { ...text('filled', 'Filled', 'Gefüllt', 'Filled container, stands out on a busy view.', 'Gefüllter Container, hebt sich auf einer vollen Ansicht ab.'), size: FIELD, data: { ...scene, inputLayout: 'filled' } },
        { ...text('helper', 'Helper text', 'Hilfetext', 'A hint below the field explains what the choice affects.', 'Ein Hinweis unter dem Feld erklärt, was die Auswahl bewirkt.'), size: FIELD_HELP, data: { ...mode, inputMessage: 'Applies to the whole house', showInputCounter: false } },
    ],
    MaterialDesignAutocomplete: [
        { ...typical('Type to filter the states of the object, or pick from the list.', 'Tippen filtert die Zustände des Objekts, oder aus der Liste wählen.'), size: FIELD, data: { oid: `${D}media.input`, inputLayout: 'outlined', inputLabelText: 'Source', listDataMethod: 'multistatesObject' } },
        { ...text('icons', 'Own list with icons', 'Eigene Liste mit Icons', 'Values, labels and icons from three lists in a filled field.', 'Werte, Beschriftungen und Icons aus drei Listen in einem gefüllten Feld.'), size: FIELD, data: daypart },
    ],
    MaterialDesignKeyboard: [
        { ...typical('Opens below the focused text field, so the tablet keyboard stays closed; the bar above the keys offers the learned words.', 'Öffnet sich unter dem fokussierten Textfeld, damit die Tablet-Tastatur geschlossen bleibt; die Leiste über den Tasten bietet die gelernten Wörter an.'), size: KEYBOARD, data: { ...keyboard, keyboardLanguage: 'en' }, companion: noteField },
        { ...text('german', 'German key map', 'Deutsche Belegung', 'QWERTZ with ä, ö, ü and ß.', 'QWERTZ mit ä, ö, ü und ß.'), size: KEYBOARD, data: { ...keyboard, keyboardLanguage: 'de' }, companion: noteField },
        { ...text('numbers', 'Number pad', 'Ziffernblock', 'A number field gets the number pad on its own.', 'Ein Zahlenfeld bekommt von selbst den Ziffernblock.'), size: KEYBOARD, data: keyboard, companion: { module: 'MaterialDesignInput', data: { oid: `${D}climate.setpoint`, inputType: 'number', inputLayout: 'outlined', inputLabelText: 'Set temperature', inputSuffix: '°C', autoFocus: true }, size: FIELD } },
    ],
};
