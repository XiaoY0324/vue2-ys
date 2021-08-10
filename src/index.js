import { compileToFunction } from "./compile";
import { initMixin } from "./init";
import { initGlobalAPI } from "./initGlobalAPI/index";
import { lifeCycleMixin } from "./lifecycle";
import { createElm, patch } from "./vdom/patch";

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


// const template1 = `<ul a=1>
// <li style="background:red" key="A">A</li>
// <li style="background:yellow" key="B">B</li>
// <li style="background:green" key="C">C</li>
// <li style="background:purple" key="D">D</li>
// </ul>`

// // 手动将模板渲染成render函数 
// const render1 = compileToFunction(template1);
// const vm1 = new Vue({ data: {} })
// let oldVnode = render1.call(vm1); // 虚拟节点

// const el1 = createElm(oldVnode); // 产生了一个真实的节点
// document.body.appendChild(el1);


// // 更新会再次生成ast？ 只会重新生成一次， 产生一个render函数，render函数根据不同的数据渲染内容 （render函数返回的前后虚拟节点可能是不一样的，所以我们需要做一个diff算法）
// const template2 = `<ul a=2>
// <li style="background:yellow" key="B">B</li>
// <li style="background:purple" key="D">D</li>
// <li style="background:red" key="E">E</li>
// <li style="background:purple" key="M">M</li>
// <li style="background:green" key="P">P</li>
// </ul>`
// const render2 = compileToFunction(template2);
// let newVnode = render2.call(vm1); // 虚拟节点

// setTimeout(() => {
//     // 产生了一个真实的节点
//     patch(oldVnode, newVnode)
// }, 1000);


