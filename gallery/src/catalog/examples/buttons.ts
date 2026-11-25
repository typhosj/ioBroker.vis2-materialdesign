import type { Example, FamilyExamples } from '../example';

const H = { width: 160, height: 48 };
const V = { width: 96, height: 96 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const textOnly = { id: 'text-only', label: { en: 'Text only', de: 'Nur Text' }, purpose: { en: 'An emptied icon field leaves a plain text button.', de: 'Ein geleertes Icon-Feld ergibt einen reinen Text-Button.' } };
const outlined = { id: 'outlined', label: { en: 'Outlined', de: 'Umrandet' }, purpose: { en: 'Outline only, for a secondary action next to a filled button.', de: 'Nur Umrandung, für eine Nebenaktion neben einem gefüllten Button.' } };

const navigation = (size: typeof H, label: string) => [
    { ...typical('Opens the climate view; the icon tells the target at a glance.', 'Öffnet die Klima-Ansicht; das Icon zeigt das Ziel auf einen Blick.'), size, data: { buttontext: label, image: 'thermometer', nav_view: 'demo-climate' } },
    { ...textOnly, size, data: { buttontext: label, image: '', nav_view: 'demo-climate' } },
    { ...outlined, size, data: { buttontext: label, image: 'thermometer', buttonStyle: 'outlined', md3ButtonVariant: 'outlined', nav_view: 'demo-climate' } },
];

const link = (size: typeof H, extra: Example[] = []) => [
    { ...typical('Opens a web page in a new window, for example a camera or the router.', 'Öffnet eine Webseite in einem neuen Fenster, etwa eine Kamera oder den Router.'), size, data: { buttontext: 'ioBroker', image: 'open-in-new', href: 'https://www.iobroker.net', openNewWindow: true } },
    ...extra,
    { ...outlined, size, data: { buttontext: 'ioBroker', image: 'open-in-new', buttonStyle: 'outlined', md3ButtonVariant: 'outlined', href: 'https://www.iobroker.net', openNewWindow: true } },
];

const scene = { oid: `${D}general.scene`, value: 'night', buttontext: 'Night', image: 'weather-night' };
const active = { id: 'active', label: { en: 'Highlights the current value', de: 'Hebt den aktuellen Wert hervor' }, purpose: { en: 'The scene is already "evening", so the button shows its on color and icon.', de: 'Die Szene steht schon auf „evening“, daher zeigt der Button Ein-Farbe und Ein-Icon.' } };
const locked = { id: 'locked', label: { en: 'Locked', de: 'Gesperrt' }, purpose: { en: 'The first tap unlocks, the second one writes; it locks again after 10 s.', de: 'Der erste Tipp entsperrt, der zweite schreibt; nach 10 s sperrt er wieder.' } };
const tonal = { id: 'tonal', label: { en: 'Tonal', de: 'Tonal' }, purpose: { en: 'Material 3 tonal button: less weight than filled, more than outlined.', de: 'Material-3-Tonal-Button: weniger Gewicht als gefüllt, mehr als umrandet.' }, designStyle: 'material3' as const };

const allOff = { buttontext: 'All off', image: 'lightbulb-group-off', countOids: 3, oid0: `${D}living.light`, value0: 'false', oid1: `${D}kitchen.light`, value1: 'false', oid2: `${D}terrace.light`, value2: 'false' };
const goodNight = { buttontext: 'Good night', image: 'weather-night', countOids: 3, oid0: `${D}general.scene`, value0: 'night', oid1: `${D}living.light`, value1: 'false', oid2: `${D}living.blind`, value2: '0', delayInMs2: 2000 };
const delayed = { id: 'delayed', label: { en: 'Scene with a delay', de: 'Szene mit Verzögerung' }, purpose: { en: 'Sets the scene and the light at once and closes the blind two seconds later.', de: 'Setzt Szene und Licht sofort und schließt den Rollladen zwei Sekunden später.' } };

const setpointUp = { buttontext: '+0.5 °C', image: 'thermometer-plus', oid: `${D}climate.setpoint`, value: 0.5, minmax: '16;26' };
const stepDown = { id: 'step-down', label: { en: 'Step down', de: 'Schritt abwärts' }, purpose: { en: 'A negative step counts down; 16 °C is the lower bound.', de: 'Ein negativer Schritt zählt abwärts; 16 °C ist die Untergrenze.' } };

const light = { buttontext: 'Light', image: 'lightbulb-outline', imageTrue: 'lightbulb-on', oid: `${D}living.light` };
const off = { id: 'off', label: { en: 'Off state', de: 'Aus-Zustand' }, purpose: { en: 'The same button on a light that is off: outline icon instead of the lit bulb.', de: 'Derselbe Button an einem ausgeschalteten Licht: Umriss-Icon statt leuchtender Birne.' } };
const pin = { id: 'lock-pin', label: { en: 'Lock with PIN', de: 'Sperre mit PIN' }, purpose: { en: 'Unlocking asks for the PIN 1234, for a door or an alarm system.', de: 'Das Entsperren fragt die PIN 1234 ab, etwa für eine Tür oder Alarmanlage.' } };

export const buttons: FamilyExamples = {
    MaterialDesignButtonNavigation: navigation(H, 'Climate'),
    MaterialDesignButtonLink: link(H, [{ ...textOnly, size: H, data: { buttontext: 'ioBroker', image: '', href: 'https://www.iobroker.net', openNewWindow: true } }]),
    MaterialDesignButtonState: [
        { ...typical('Writes a fixed value, here the scene "night".', 'Schreibt einen festen Wert, hier die Szene „night“.'), size: H, data: scene },
        { ...active, size: H, data: { ...scene, buttontext: 'Evening', value: 'evening', image: 'weather-sunset', imageTrue: 'check', colorBgTrue: '#2e7d32', labelColorTrue: '#ffffff', imageTrueColor: '#ffffff' } },
        { ...outlined, size: H, data: { ...scene, buttonStyle: 'outlined', md3ButtonVariant: 'outlined' } },
        { id: 'text', label: { en: 'Text', de: 'Text' }, purpose: { en: 'Label only, for a quiet action in a dense row.', de: 'Nur Beschriftung, für eine leise Aktion in einer dichten Reihe.' }, size: H, data: { ...scene, buttonStyle: 'text', md3ButtonVariant: 'text' } },
        { ...tonal, size: H, data: { ...scene, md3ButtonVariant: 'tonal' } },
        { ...textOnly, size: H, data: { ...scene, image: '' } },
        { ...locked, size: H, data: { ...scene, lockEnabled: true } },
        { id: 'custom-color', label: { en: 'Own colors', de: 'Eigene Farben' }, purpose: { en: 'Explicit colors win over the theme, for a warning or a brand color.', de: 'Eigene Farben schlagen das Theme, etwa für eine Warnung oder eine Markenfarbe.' }, size: H, data: { ...scene, buttontext: 'Alarm', image: 'alarm-light', colorBgFalse: '#b3261e', labelColorFalse: '#ffffff', imageColor: '#ffffff' } },
    ],
    MaterialDesignButtonStateMulti: [
        { ...typical('Writes several data points with one tap, here all lights off.', 'Schreibt mehrere Datenpunkte mit einem Tipp, hier alle Lichter aus.'), size: H, data: allOff },
        { ...delayed, size: H, data: goodNight },
    ],
    MaterialDesignButtonAdition: [
        { ...typical('Raises the set temperature by 0.5 °C, at most to 26 °C.', 'Erhöht die Solltemperatur um 0,5 °C, höchstens auf 26 °C.'), size: H, data: setpointUp },
        { ...stepDown, size: H, data: { ...setpointUp, buttontext: '−0.5 °C', image: 'thermometer-minus', value: -0.5 } },
        { id: 'hold-repeat', label: { en: 'Repeat while held', de: 'Wiederholt beim Halten' }, purpose: { en: 'Holding the button keeps raising the volume in steps of 5.', de: 'Gedrückt halten erhöht die Lautstärke laufend in Schritten von 5.' }, size: H, data: { buttontext: 'Volume', image: 'volume-plus', oid: `${D}media.volume`, value: 5, minmax: '0;100', repeatOnHold: true } },
    ],
    MaterialDesignButtonToggle: [
        { ...typical('Switches a light; icon and color follow the state.', 'Schaltet ein Licht; Icon und Farbe folgen dem Zustand.'), size: H, data: light },
        { ...off, size: H, data: { ...light, oid: `${D}kitchen.light` } },
        { id: 'value', label: { en: 'Between two values', de: 'Zwischen zwei Werten' }, purpose: { en: 'Toggles a mode number between Comfort (1) and Eco (2) instead of true/false.', de: 'Schaltet eine Modus-Zahl zwischen Komfort (1) und Eco (2) statt true/false.' }, size: H, data: { buttontext: 'Eco', labelTrue: 'Comfort', image: 'leaf', imageTrue: 'sofa', oid: `${D}climate.mode`, toggleType: 'value', valueOn: '1', valueOff: '2' } },
        { id: 'read-only', label: { en: 'Read only', de: 'Nur Anzeige' }, purpose: { en: 'Shows the state of the door lock without switching it.', de: 'Zeigt den Zustand des Türschlosses, ohne es zu schalten.' }, size: H, data: { buttontext: 'Unlocked', labelTrue: 'Locked', image: 'lock-open-variant', imageTrue: 'lock', oid: `${D}contacts.lock`, readOnly: true } },
        { ...pin, size: H, data: { ...light, lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignButtonNavigationVertical: navigation(V, 'Climate'),
    MaterialDesignButtonLinkVertical: link(V),
    MaterialDesignButtonStateVertical: [
        { ...typical('Writes a fixed value, here the scene "night".', 'Schreibt einen festen Wert, hier die Szene „night“.'), size: V, data: scene },
        { ...active, size: V, data: { ...scene, buttontext: 'Evening', value: 'evening', image: 'weather-sunset', imageTrue: 'check', colorBgTrue: '#2e7d32', labelColorTrue: '#ffffff', imageTrueColor: '#ffffff' } },
        { ...outlined, size: V, data: { ...scene, buttonStyle: 'outlined', md3ButtonVariant: 'outlined' } },
        { ...tonal, size: V, data: { ...scene, md3ButtonVariant: 'tonal' } },
        { ...locked, size: V, data: { ...scene, lockEnabled: true } },
    ],
    MaterialDesignButtonStateMultiVertical: [
        { ...typical('Writes several data points with one tap, here all lights off.', 'Schreibt mehrere Datenpunkte mit einem Tipp, hier alle Lichter aus.'), size: V, data: allOff },
        { ...delayed, size: V, data: goodNight },
    ],
    MaterialDesignButtonAditionVertical: [
        { ...typical('Raises the set temperature by 0.5 °C, at most to 26 °C.', 'Erhöht die Solltemperatur um 0,5 °C, höchstens auf 26 °C.'), size: V, data: setpointUp },
        { ...stepDown, size: V, data: { ...setpointUp, buttontext: '−0.5 °C', image: 'thermometer-minus', value: -0.5 } },
    ],
    MaterialDesignButtonToggleVertical: [
        { ...typical('Switches a light; icon and color follow the state.', 'Schaltet ein Licht; Icon und Farbe folgen dem Zustand.'), size: V, data: light },
        { ...off, size: V, data: { ...light, oid: `${D}kitchen.light` } },
        { ...pin, size: V, data: { ...light, lockEnabled: true, lockPin: '1234' } },
    ],
};
