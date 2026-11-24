import type { FamilyExamples } from '../example';

export const views: FamilyExamples = {
    MaterialDesignDialogView: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { showDialogOid: '0_userdata.0.demo.general.value', buttontext: 'Open media', contains_view: 'demo-media', title: 'Media' } },
        { id: 'open-button', label: { en: 'Open button', de: 'Open button' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Open media', contains_view: 'demo-media', title: 'Media' } },
        { id: 'outlined', label: { en: 'Outlined button', de: 'Outlined button' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Open media', contains_view: 'demo-media', title: 'Media', buttonStyle: 'outlined' } },
        { id: 'data-point', label: { en: 'Opened by a data point', de: 'Opened by a data point' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Open media', contains_view: 'demo-media', title: 'Media', showDialogMethod: 'datapoint', showDialogOid: '0_userdata.0.demo.general.flag' } },
    ],
    MaterialDesignDialogIFrame: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { showDialogOid: '0_userdata.0.demo.general.value' } },
        { id: 'window', label: { en: 'In a window', de: 'In a window' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Open page', src: './iframe-demo.html', title: 'iFrame demo' } },
        { id: 'fullscreen', label: { en: 'Fullscreen', de: 'Fullscreen' }, purpose: { en: '', de: '' }, size: { width: 170, height: 44 }, data: { buttontext: 'Open page', src: './iframe-demo.html', title: 'iFrame demo', fullscreenResolutionLower: 100000 } },
    ],
    MaterialDesignMasonryViews: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 900, height: 520 }, data: { visibilityOid0: '0_userdata.0.demo.general.value', visibilityOid1: '0_userdata.0.demo.general.value', visibilityOid2: '0_userdata.0.demo.general.value', visibilityOid3: '0_userdata.0.demo.general.value', countCols: 2, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
        { id: 'two-columns', label: { en: 'Two columns', de: 'Two columns' }, purpose: { en: '', de: '' }, size: { width: 900, height: 520 }, data: { countCols: 2, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
        { id: 'three-columns', label: { en: 'Three columns', de: 'Three columns' }, purpose: { en: '', de: '' }, size: { width: 1200, height: 520 }, data: { countCols: 3, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
    ],
    MaterialDesignGridViews: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 900, height: 520 }, data: { visibilityOid0: '0_userdata.0.demo.general.value', visibilityOid1: '0_userdata.0.demo.general.value', visibilityOid2: '0_userdata.0.demo.general.value', visibilityOid3: '0_userdata.0.demo.general.value', viewColSpan: 6, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
        { id: 'two-columns', label: { en: 'Two columns', de: 'Two columns' }, purpose: { en: '', de: '' }, size: { width: 900, height: 520 }, data: { viewColSpan: 6, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
        { id: 'three-columns', label: { en: 'Three columns', de: 'Three columns' }, purpose: { en: '', de: '' }, size: { width: 1200, height: 520 }, data: { viewColSpan: 4, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
    ],
    MaterialDesignAdvancedViewInWidget: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.viewName', View0: 'demo-lights' } },
        { id: 'by-name', label: { en: 'View chosen by a state', de: 'View chosen by a state' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.viewName' } },
        { id: 'pre-rendered', label: { en: 'Views rendered in advance', de: 'Views rendered in advance' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.viewName', renderAlways: true, countRenderViewsOnLoad: 3, View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' } },
        { id: 'quiet', label: { en: 'Without error message', de: 'Without error message' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.viewName', hideErrorMessage: true, fadeInDuration: 300, fadeOutDuration: 300 } },
    ],
    MaterialDesignAdvancedViewInWidget8: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { count: 3, oid: '0_userdata.0.demo.general.view', contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media' } },
        { id: 'three-views', label: { en: 'Three views by index', de: 'Three views by index' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.view', count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media' } },
        { id: 'two-views', label: { en: 'Two views', de: 'Two views' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.view', count: 2, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate' } },
        { id: 'slow-fade', label: { en: 'Slow fade', de: 'Slow fade' }, purpose: { en: '', de: '' }, size: { width: 400, height: 300 }, data: { oid: '0_userdata.0.demo.general.view', count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media', fadeInDuration: 400, fadeOutDuration: 400 } },
    ],
};
