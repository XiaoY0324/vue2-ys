const isResrved = tag => { // 判断是否为原生标签
  return ['a', 'div', 'p', 'span', 'ul', 'li', 'button', 'input', 'h1'].includes(tag);
}

function createComponent(vm, tag, props, children, Ctor) {
  if (typeof Ctor == 'object') {
    // 调用 extend，将对象的组件选校继续转为子类
    Ctor = vm.constructor.extend(Ctor); 
  }

  // 专门用来初始化组件的，组件的虚拟节点上还有一个 components，也就是 { Ctor, children }
  props.hook = {
    init(compVnode) { 
      // console.log('sss', compVnode);
      // 创建组件实例
      let child = compVnode.componentInstance = new compVnode.componentOptions.Ctor({});

      // 内部会产生一个真实节点(patch)，挂载到了 child.$el 和 compVnode.componentInstance.$el
      child.$mount(); // 如果没传挂载目标，将组件挂载后的结果放到 $el 属性上
    }
  }

  return vnode(vm, `vue-componet-${ tag }`, props, undefined, undefined, props.key, { Ctor, children });
}

export function createElement(vm, tag, props = {}, children) {
  if (isResrved(tag)) { 
    // 原生标签
    return vnode(vm, tag, props, children, undefined, props.key);
  } else {
    console.log('组件节点 createElement');
    // 根据当前组件的模板，它有两种可能的值，
    //  @1 一种是传入对象 { template: '<button>内部按钮</button>' }，我们需要调用 extend 额外转为当前页面的子类
    //  @2 一种是传入类，我们就不需要处理转为子类了，比如 { 'my-button': Vue.extend({ template: '<button>内部按钮</button>' })}
    const Ctor = vm.$options['components'][tag];

    // 根据组件配置或组件类 生成 vnode
    return createComponent(vm, tag, props, children, Ctor);
  }
}

export function createTextElement(vm, text) {
  return vnode(vm, undefined, undefined, undefined, text);
}

export function isSameVnode(oldVnode, newVnode) {
  return oldVnode.tag == newVnode.tag && oldVnode.key === newVnode.key;
}

function vnode(vm, tag, props, children, text, key, componentOptions) {
  return {
    vm,
    tag,
    props,
    children,
    text,
    key,
    componentOptions
  }
}