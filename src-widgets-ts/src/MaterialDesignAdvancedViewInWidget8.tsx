import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import {
  advancedViewInfo,
  MaterialDesignAdvancedView,
} from "./MaterialDesignAdvancedView";
export default class MaterialDesignAdvancedViewInWidget8 extends MaterialDesignAdvancedView {
  constructor(props: any) {
    super(props, "state8");
  }
  static getWidgetInfo(): RxWidgetInfo {
    return advancedViewInfo("state8");
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignAdvancedViewInWidget8.getWidgetInfo();
  }
}
