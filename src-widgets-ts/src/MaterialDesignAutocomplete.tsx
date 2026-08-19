import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { squarePreview } from './widgetUtils';

import MaterialDesignSelect from './MaterialDesignSelect';

export default class MaterialDesignAutocomplete extends MaterialDesignSelect {
    protected isAutocomplete = true;

    static getWidgetInfo(): RxWidgetInfo {
        const select = MaterialDesignSelect.getWidgetInfo();
        // `inputType` only belongs here: a select has nothing to type into, the autocomplete does.
        const ownFields = [
            { name: 'inputMode', label: 'inputMode', type: 'select' as const, options: ['write', 'select'], default: 'write' },
            { name: 'inputType', label: 'inputType', type: 'select' as const, options: ['text', 'date', 'time'], default: 'text' },
        ];
        const attrs = select.visAttrs?.map(group => group.name === 'common' ? { ...group, fields: [...ownFields, ...group.fields] } : group);
        return { ...select, id: 'tplVis2-materialdesign-Autocomplete', visName: 'Autocomplete', visAttrs: attrs, visPrev: squarePreview('F13B8') };
    }

    getWidgetInfo(): RxWidgetInfo { return MaterialDesignAutocomplete.getWidgetInfo(); }
}
