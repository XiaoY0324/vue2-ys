import { compileToFunction } from "./compile";
import { initMixin } from "./init";
import { initGlobalAPI } from "./initGlobalAPI/index";
import { lifeCycleMixin } from "./lifecycle";

// 给Vue的构造函数 扩展原型方法， 还会扩展一些静态方法
function Vue(options){ // 构造函数
    this._init(options)
}
initGlobalAPI(Vue)
initMixin(Vue);
lifeCycleMixin(Vue);
export default Vue;


// 1. 当new Vue的时候都发生了什么, 默认会进行vue的初始化操作 _init(), 后面组件的初始化也会调用_init
// optionsApi 不知道这些选项哪些能用到  所以无法实现tree-shaking

