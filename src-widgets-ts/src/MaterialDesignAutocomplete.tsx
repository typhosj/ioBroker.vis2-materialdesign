import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import MaterialDesignSelect from './MaterialDesignSelect';

export default class MaterialDesignAutocomplete extends MaterialDesignSelect {
    protected isAutocomplete = true;

    static getWidgetInfo(): RxWidgetInfo {
        const select = MaterialDesignSelect.getWidgetInfo();
        const attrs = select.visAttrs?.map(group => group.name === 'common' ? { ...group, fields: [{ name: 'inputMode', label: 'inputMode', type: 'select' as const, options: ['write', 'select'], default: 'write' }, ...group.fields] } : group);
        return { ...select, id: 'tplVis2-materialdesign-Autocomplete', visName: 'Autocomplete', visAttrs: attrs, visPrev: '<img src="widgets/vis2-materialdesign/img/prev_autocomplete.png"></img>' };
    }

    getWidgetInfo(): RxWidgetInfo { return MaterialDesignAutocomplete.getWidgetInfo(); }
}
