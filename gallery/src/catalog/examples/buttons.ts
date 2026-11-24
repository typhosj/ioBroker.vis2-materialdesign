import type { FamilyExamples } from '../example';

export const buttons: FamilyExamples = {
    MaterialDesignButtonNavigationVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { nav_view: 'demo-climate' } },
        { id: 'text-only', label: { en: 'Text only', de: 'Text only' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Climate', image: '', nav_view: 'demo-climate' } },
        { id: 'with-icon', label: { en: 'With icon', de: 'With icon' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Climate', image: 'thermometer', nav_view: 'demo-climate' } },
        { id: 'outlined', label: { en: 'Outlined', de: 'Outlined' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Climate', image: 'thermometer', buttonStyle: 'outlined', nav_view: 'demo-climate' } },
    ],
    MaterialDesignButtonLinkVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'text-only', label: { en: 'Text only', de: 'Text only' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Switch widget', image: '', href: '#/widget/Switch' } },
        { id: 'with-icon', label: { en: 'With icon', de: 'With icon' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Switch widget', image: 'link-variant', href: '#/widget/Switch' } },
        { id: 'outlined', label: { en: 'Outlined', de: 'Outlined' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Switch widget', image: 'link-variant', buttonStyle: 'outlined', href: '#/widget/Switch' } },
    ],
    MaterialDesignButtonStateVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'filled-raised', label: { en: 'filled ↔ raised', de: 'filled ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'tonal-raised', label: { en: 'tonal ↔ raised', de: 'tonal ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'tonal' } },
        { id: 'elevated-raised', label: { en: 'elevated ↔ raised', de: 'elevated ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'elevated' } },
        { id: 'outlined', label: { en: 'outlined', de: 'outlined' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'outlined' } },
        { id: 'text', label: { en: 'text', de: 'text' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'text' } },
        { id: 'read-only-disabled', label: { en: 'Read only (disabled)', de: 'Read only (disabled)' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'locked-lock', label: { en: 'Locked (lock)', de: 'Locked (lock)' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', lockEnabled: true, autoLockAfter: 600 } },
    ],
    MaterialDesignButtonStateMultiVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid0: '0_userdata.0.demo.general.value', oid1: '0_userdata.0.demo.general.value' } },
        { id: 'two-targets', label: { en: 'Scene with two targets', de: 'Scene with two targets' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Night', countOids: 2, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false' } },
        { id: 'four-targets', label: { en: 'Scene with four targets', de: 'Scene with four targets' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'All off', countOids: 4, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false', oid2: '0_userdata.0.demo.kitchen.light', value2: 'false', oid3: '0_userdata.0.demo.hall.light', value3: 'false' } },
    ],
    MaterialDesignButtonAditionVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'step-plus-1', label: { en: 'Step +1', de: 'Step +1' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: '+1', oid: '0_userdata.0.demo.general.counter', value: 1 } },
        { id: 'step-minus-5', label: { en: 'Step -5', de: 'Step -5' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: '-5', image: 'minus', oid: '0_userdata.0.demo.general.counter', value: -5 } },
        { id: 'with-lock', label: { en: 'With lock', de: 'With lock' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: '+1', oid: '0_userdata.0.demo.general.counter', value: 1, lockEnabled: true } },
    ],
    MaterialDesignButtonToggleVertical: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'toggle-on', label: { en: 'Toggle (on)', de: 'Toggle (on)' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { oid: '0_userdata.0.demo.terrace.light' } },
        { id: 'lock-pin', label: { en: 'With lock and PIN 1234', de: 'With lock and PIN 1234' }, purpose: { en: '', de: '' }, size: { width: 120, height: 96 }, data: { buttontext: 'Light', image: 'lightbulb', oid: '0_userdata.0.demo.living.light', lockEnabled: true, lockPin: '1234' } },
    ],
    MaterialDesignButtonNavigation: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { nav_view: 'demo-climate' } },
        { id: 'text-only', label: { en: 'Text only', de: 'Text only' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Climate', image: '', nav_view: 'demo-climate' } },
        { id: 'with-icon', label: { en: 'With icon', de: 'With icon' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Climate', image: 'thermometer', nav_view: 'demo-climate' } },
        { id: 'outlined', label: { en: 'Outlined', de: 'Outlined' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Climate', image: 'thermometer', buttonStyle: 'outlined', nav_view: 'demo-climate' } },
    ],
    MaterialDesignButtonLink: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'text-only', label: { en: 'Text only', de: 'Text only' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Switch widget', image: '', href: '#/widget/Switch' } },
        { id: 'with-icon', label: { en: 'With icon', de: 'With icon' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Switch widget', image: 'link-variant', href: '#/widget/Switch' } },
        { id: 'outlined', label: { en: 'Outlined', de: 'Outlined' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Switch widget', image: 'link-variant', buttonStyle: 'outlined', href: '#/widget/Switch' } },
    ],
    MaterialDesignButtonState: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'filled-raised', label: { en: 'filled ↔ raised', de: 'filled ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'tonal-raised', label: { en: 'tonal ↔ raised', de: 'tonal ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'tonal' } },
        { id: 'elevated-raised', label: { en: 'elevated ↔ raised', de: 'elevated ↔ raised' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'elevated' } },
        { id: 'outlined', label: { en: 'outlined', de: 'outlined' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'outlined' } },
        { id: 'text', label: { en: 'text', de: 'text' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', md3ButtonVariant: 'text' } },
        { id: 'label-only', label: { en: 'Label only', de: 'Label only' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Scene', image: '', oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'read-only-disabled', label: { en: 'Read only (disabled)', de: 'Read only (disabled)' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5' } },
        { id: 'locked-lock', label: { en: 'Locked (lock)', de: 'Locked (lock)' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', lockEnabled: true, autoLockAfter: 600 } },
        { id: 'custom-color-override', label: { en: 'Custom color (override)', de: 'Custom color (override)' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { oid: '0_userdata.0.demo.general.counter', value: '5', colorBgFalse: '#00696d', labelColorFalse: '#ffffff' } },
    ],
    MaterialDesignButtonStateMulti: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid0: '0_userdata.0.demo.general.value', oid1: '0_userdata.0.demo.general.value' } },
        { id: 'two-targets', label: { en: 'Scene with two targets', de: 'Scene with two targets' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Night', countOids: 2, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false' } },
        { id: 'four-targets', label: { en: 'Scene with four targets', de: 'Scene with four targets' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'All off', countOids: 4, oid0: '0_userdata.0.demo.general.scene', value0: 'night', oid1: '0_userdata.0.demo.living.light', value1: 'false', oid2: '0_userdata.0.demo.kitchen.light', value2: 'false', oid3: '0_userdata.0.demo.hall.light', value3: 'false' } },
    ],
    MaterialDesignButtonAdition: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'step-plus-1', label: { en: 'Step +1', de: 'Step +1' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: '+1', oid: '0_userdata.0.demo.general.counter', value: 1 } },
        { id: 'step-minus-5', label: { en: 'Step -5', de: 'Step -5' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: '-5', image: 'minus', oid: '0_userdata.0.demo.general.counter', value: -5 } },
        { id: 'with-lock', label: { en: 'With lock', de: 'With lock' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: '+1', oid: '0_userdata.0.demo.general.counter', value: 1, lockEnabled: true } },
    ],
    MaterialDesignButtonToggle: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'text', label: { en: 'Text', de: 'Text' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Light', image: '', oid: '0_userdata.0.demo.living.light' } },
        { id: 'icon', label: { en: 'Icon', de: 'Icon' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Light', image: 'lightbulb', oid: '0_userdata.0.demo.living.light' } },
        { id: 'lock-pin', label: { en: 'With lock and PIN 1234', de: 'With lock and PIN 1234' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Light', image: 'lightbulb', oid: '0_userdata.0.demo.living.light', lockEnabled: true, lockPin: '1234' } },
    ],
};
