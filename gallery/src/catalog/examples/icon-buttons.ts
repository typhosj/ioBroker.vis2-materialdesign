import type { FamilyExamples } from '../example';

export const iconButtons: FamilyExamples = {
    MaterialDesignIconButtonNavigation: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { nav_view: 'demo-climate' } },
        { id: 'thermometer', label: { en: 'Climate icon', de: 'Climate icon' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'thermometer', nav_view: 'demo-climate' } },
        { id: 'home', label: { en: 'Home icon', de: 'Home icon' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'home', nav_view: 'demo-lights' } },
        { id: 'lock-pin', label: { en: 'With lock and PIN 1234', de: 'With lock and PIN 1234' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'thermometer', nav_view: 'demo-climate', lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignIconButtonLink: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'link', label: { en: 'Link icon', de: 'Link icon' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'link-variant', href: '#/widget/Switch' } },
        { id: 'open', label: { en: 'Open icon', de: 'Open icon' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'open-in-new', href: '#/widget/Switch' } },
        { id: 'lock-pin', label: { en: 'With lock and PIN 1234', de: 'With lock and PIN 1234' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'link-variant', href: '#/widget/Switch', lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignIconButtonState: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'standard', label: { en: 'standard', de: 'standard' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'filled', label: { en: 'filled', de: 'filled' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3IconButtonVariant: 'filled' } },
        { id: 'tonal', label: { en: 'tonal', de: 'tonal' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3IconButtonVariant: 'tonal' } },
        { id: 'outlined', label: { en: 'outlined', de: 'outlined' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3IconButtonVariant: 'outlined' } },
        { id: 'read-only-disabled', label: { en: 'Read only (disabled)', de: 'Read only (disabled)' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3IconButtonVariant: 'filled' } },
        { id: 'large-target-56-px', label: { en: 'Large target (56 px)', de: 'Large target (56 px)' }, purpose: { en: '', de: '' }, size: { width: 56, height: 56 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3IconButtonVariant: 'tonal' } },
    ],
    MaterialDesignIconButtonStateMulti: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid0: '0_userdata.0.demo.general.value', oid1: '0_userdata.0.demo.general.value' } },
        { id: 'two-targets', label: { en: 'Scene with two targets', de: 'Scene with two targets' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'weather-night', countOids: 2, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false' } },
        { id: 'four-targets', label: { en: 'Scene with four targets', de: 'Scene with four targets' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'power', countOids: 4, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false', oid2: '0_userdata.0.demo.kitchen.light', value2: 'false', oid3: '0_userdata.0.demo.hall.light', value3: 'false' } },
    ],
    MaterialDesignIconButtonAdition: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'step-plus-1', label: { en: 'Step +1', de: 'Step +1' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: 1 } },
        { id: 'step-minus-5', label: { en: 'Step -5', de: 'Step -5' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'minus', oid: '0_userdata.0.demo.general.counter', value: -5 } },
        { id: 'with-lock', label: { en: 'With lock', de: 'With lock' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { oid: '0_userdata.0.demo.general.counter', value: 1, lockEnabled: true } },
    ],
    MaterialDesignIconButtonToggle: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'bulb', label: { en: 'Light bulb', de: 'Light bulb' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'lightbulb-outline', imageTrue: 'lightbulb', oid: '0_userdata.0.demo.living.light' } },
        { id: 'power', label: { en: 'Power icon', de: 'Power icon' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'power', oid: '0_userdata.0.demo.living.light' } },
        { id: 'lock-pin', label: { en: 'With lock and PIN 1234', de: 'With lock and PIN 1234' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { image: 'lightbulb', oid: '0_userdata.0.demo.living.light', lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignIconButtonSlider: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'full-circle', label: { en: 'Full circle', de: 'Full circle' }, purpose: { en: '', de: '' }, size: { width: 120, height: 120 }, data: { oid: '0_userdata.0.demo.living.dimmer', image: 'lightbulb' } },
        { id: 'half-circle', label: { en: 'Half circle', de: 'Half circle' }, purpose: { en: '', de: '' }, size: { width: 120, height: 120 }, data: { oid: '0_userdata.0.demo.living.dimmer', image: 'lightbulb', angleArc: 180, angleOffset: 270 } },
        { id: 'slider-only', label: { en: 'Slider only', de: 'Slider only' }, purpose: { en: '', de: '' }, size: { width: 120, height: 120 }, data: { oid: '0_userdata.0.demo.living.dimmer', image: 'lightbulb', sliderOnly: true } },
    ],
};
