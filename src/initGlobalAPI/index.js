import { mergeOptions } from "../utils";

export function initGlobalAPI(Vue) {
    Vue.options = {}; // 所有的全局属性 都会放到这个变量上
    Vue.mixin = function(options) { // 用户要合并的对象
        this.options = mergeOptions(this.options, options)
    }
}
