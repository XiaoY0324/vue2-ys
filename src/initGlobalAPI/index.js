import { mergeOptions } from "../utils";

export function initGlobalAPI(Vue) {
    Vue.options = {}; // 所有的全局属性 都会放到这个变量上
    Vue.mixin = function(options) { // 用户要合并的对象
        this.options = mergeOptions(this.options, options)
    }

    Vue.options.components = {}; // 放的是全局组件


    /**
     * 创建全局组件的 api
     * @param {*} id  组件名，比如 'card-list'
     * @param {*} componentDef 组件定义，如果为对象，可能有 name，props，template 等属性
     */
    Vue.component = function(id, componentDef) {
      componentDef.name = componentDef.name || id; 

      // 可以看出来，componentDef 会被传入 Vue.extend 方法，并返回一个类
      componentDef = this.extend(componentDef);

      // 把组件的类挂到了全局的 Vue.options.components 上
      this.options.components[id] = componentDef;
    }

    // 组件的核心方法，返回一个子类
    Vue.extend = function (options) {
      const Super = this; // 父类
      const Sub = function vueComponent(opts) {  // 子类
        this._init(opts); // 和 new Vue 一样，进行初始化流程
      }

      // 子类继承父类原型方法
      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
      // 合并 Vue 全局选项和子类初始化选项，把全局挂自己身上
      // 那么可以实现子类中找不到组件定义，可以去找父亲的
      Sub.options = mergeOptions(this.options, options);

      return Sub;
    };
}
