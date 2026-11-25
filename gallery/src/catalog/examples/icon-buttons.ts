import type { Example, FamilyExamples } from '../example';

const S = { width: 48, height: 48 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const m3 = (variant: 'filled' | 'tonal' | 'outlined', en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose' | 'designStyle'> => ({
    id: variant,
    label: { en: variant[0].toUpperCase() + variant.slice(1), de: { filled: 'Gefüllt', tonal: 'Tonal', outlined: 'Umrandet' }[variant] },
    purpose: { en, de },
    designStyle: 'material3',
});
const locked = { id: 'locked', label: { en: 'Locked', de: 'Gesperrt' }, purpose: { en: 'The first tap unlocks, the second one acts; it locks again after 10 s.', de: 'Der erste Tipp entsperrt, der zweite löst aus; nach 10 s sperrt er wieder.' } };
const pin = { id: 'lock-pin', label: { en: 'Lock with PIN', de: 'Sperre mit PIN' }, purpose: { en: 'Unlocking asks for the PIN 1234, for a door or an alarm system.', de: 'Das Entsperren fragt die PIN 1234 ab, etwa für eine Tür oder Alarmanlage.' } };

const scene = { image: 'weather-night', ariaLabel: 'Night scene', oid: `${D}general.scene`, value: 'night' };
const light = { image: 'lightbulb-outline', imageTrue: 'lightbulb-on', ariaLabel: 'Living room light', oid: `${D}living.light` };
const dimmer = { image: 'lightbulb', ariaLabel: 'Living room dimmer', oid: `${D}living.dimmer`, showAlways: true, sliderWidth: 64 };
const volume = { image: 'volume-plus', ariaLabel: 'Volume up', oid: `${D}media.volume`, value: 5, minmax: '0;100' };
const RING = { width: 72, height: 72 };

export const iconButtons: FamilyExamples = {
    MaterialDesignIconButtonNavigation: [
        { ...typical('Opens the climate view from a compact row of view icons.', 'Öffnet die Klima-Ansicht aus einer kompakten Reihe von Ansichts-Icons.'), size: S, data: { image: 'thermometer', ariaLabel: 'Climate', nav_view: 'demo-climate' } },
        { ...m3('filled', 'A filled container marks the main destination, as in a navigation rail.', 'Ein gefüllter Container hebt das Hauptziel hervor, wie in einer Navigationsleiste.'), size: S, data: { image: 'home', ariaLabel: 'Home', nav_view: 'demo-lights', md3IconButtonVariant: 'filled' } },
    ],
    MaterialDesignIconButtonLink: [
        { ...typical('Opens a web page in a new window, for example a camera or the router.', 'Öffnet eine Webseite in einem neuen Fenster, etwa eine Kamera oder den Router.'), size: S, data: { image: 'open-in-new', ariaLabel: 'ioBroker website', href: 'https://www.iobroker.net', openNewWindow: true } },
        { ...m3('outlined', 'An outline sets a link apart from the action buttons beside it.', 'Eine Umrandung hebt einen Link von den Aktions-Buttons daneben ab.'), size: S, data: { image: 'open-in-new', ariaLabel: 'ioBroker website', href: 'https://www.iobroker.net', openNewWindow: true, md3IconButtonVariant: 'outlined' } },
    ],
    MaterialDesignIconButtonState: [
        { ...typical('Writes a fixed value, here the scene "night".', 'Schreibt einen festen Wert, hier die Szene „night“.'), size: S, data: scene },
        { id: 'active', label: { en: 'Highlights the current value', de: 'Hebt den aktuellen Wert hervor' }, purpose: { en: 'The scene is already "evening", so the button shows its on color and icon.', de: 'Die Szene steht schon auf „evening“, daher zeigt der Button Ein-Farbe und Ein-Icon.' }, size: S, data: { ...scene, image: 'weather-sunset', imageTrue: 'check', ariaLabel: 'Evening scene', value: 'evening', colorBgTrue: '#2e7d32', imageTrueColor: '#ffffff' } },
        { ...m3('filled', 'Material 3 filled icon button: the strongest emphasis.', 'Gefüllter Material-3-Icon-Button: die stärkste Betonung.'), size: S, data: { ...scene, md3IconButtonVariant: 'filled' } },
        { ...m3('tonal', 'Material 3 tonal icon button: less weight than filled.', 'Tonaler Material-3-Icon-Button: weniger Gewicht als gefüllt.'), size: S, data: { ...scene, md3IconButtonVariant: 'tonal' } },
        { ...m3('outlined', 'Material 3 outlined icon button: for a secondary action.', 'Umrandeter Material-3-Icon-Button: für eine Nebenaktion.'), size: S, data: { ...scene, md3IconButtonVariant: 'outlined' } },
        { id: 'large', label: { en: 'Large target', de: 'Große Fläche' }, purpose: { en: '56 px and a 32 px icon for a wall tablet that is operated from a distance.', de: '56 px und ein 32-px-Icon für ein Wandtablet, das aus Abstand bedient wird.' }, size: { width: 56, height: 56 }, data: { ...scene, iconHeight: 32 } },
        { ...locked, size: S, data: { ...scene, lockEnabled: true } },
    ],
    MaterialDesignIconButtonStateMulti: [
        { ...typical('Writes several data points with one tap, here all lights off.', 'Schreibt mehrere Datenpunkte mit einem Tipp, hier alle Lichter aus.'), size: S, data: { image: 'lightbulb-group-off', ariaLabel: 'All lights off', countOids: 3, oid0: `${D}living.light`, value0: 'false', oid1: `${D}kitchen.light`, value1: 'false', oid2: `${D}terrace.light`, value2: 'false' } },
        { id: 'delayed', label: { en: 'Scene with a delay', de: 'Szene mit Verzögerung' }, purpose: { en: 'Sets the scene and the light at once and closes the blind two seconds later.', de: 'Setzt Szene und Licht sofort und schließt den Rollladen zwei Sekunden später.' }, size: S, data: { image: 'weather-night', ariaLabel: 'Good night', countOids: 3, oid0: `${D}general.scene`, value0: 'night', oid1: `${D}living.light`, value1: 'false', oid2: `${D}living.blind`, value2: '0', delayInMs2: 2000 } },
    ],
    MaterialDesignIconButtonAdition: [
        { ...typical('Raises the volume by 5, at most to 100.', 'Erhöht die Lautstärke um 5, höchstens auf 100.'), size: S, data: volume },
        { id: 'step-down', label: { en: 'Step down', de: 'Schritt abwärts' }, purpose: { en: 'A negative step counts down; 0 is the lower bound.', de: 'Ein negativer Schritt zählt abwärts; 0 ist die Untergrenze.' }, size: S, data: { ...volume, image: 'volume-minus', ariaLabel: 'Volume down', value: -5 } },
    ],
    MaterialDesignIconButtonToggle: [
        { ...typical('Switches a light; the lit bulb shows that it is on.', 'Schaltet ein Licht; die leuchtende Birne zeigt, dass es an ist.'), size: S, data: light },
        { id: 'off', label: { en: 'Off state', de: 'Aus-Zustand' }, purpose: { en: 'The same button on a light that is off: outline icon instead of the lit bulb.', de: 'Derselbe Button an einem ausgeschalteten Licht: Umriss-Icon statt leuchtender Birne.' }, size: S, data: { ...light, ariaLabel: 'Kitchen light', oid: `${D}kitchen.light` } },
        { id: 'on-color', label: { en: 'Colored when on', de: 'Farbig wenn an' }, purpose: { en: 'An on background makes the state readable from across the room.', de: 'Ein Ein-Hintergrund macht den Zustand quer durch den Raum lesbar.' }, size: S, data: { ...light, colorBgTrue: '#f9a825', imageTrueColor: '#3e2723' } },
        { ...pin, size: S, data: { ...light, image: 'lock-open-variant', imageTrue: 'lock', ariaLabel: 'Door lock', oid: `${D}contacts.lock`, lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignIconButtonSlider: [
        { ...typical('A tap switches the dimmer between 0 and 100 %, the ring sets the level; the ring stays visible for touch screens.', 'Ein Tipp schaltet den Dimmer zwischen 0 und 100 %, der Ring stellt die Helligkeit ein; der Ring bleibt für Touchscreens sichtbar.'), size: RING, data: dimmer },
        { id: 'half-circle', label: { en: 'Half circle', de: 'Halbkreis' }, purpose: { en: 'A 180° arc below the icon, like the dial of a thermostat.', de: 'Ein 180°-Bogen unter dem Icon, wie die Skala eines Thermostats.' }, size: RING, data: { ...dimmer, angleArc: 180, angleOffset: 270 } },
        { id: 'colorize', label: { en: 'Icon dims with the level', de: 'Icon dimmt mit' }, purpose: { en: 'The icon gets darker the lower the level, so the brightness reads without the ring.', de: 'Das Icon wird dunkler, je niedriger der Wert ist, so ist die Helligkeit auch ohne Ring lesbar.' }, size: RING, data: { ...dimmer, image: 'lightbulb-on', ariaLabel: 'Bedroom dimmer', oid: `${D}bedroom.dimmer`, colorize: true } },
    ],
};
