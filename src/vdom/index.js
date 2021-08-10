export function createElement(vm,tag, props = {}, children) {
    return vnode(vm, tag, props, children,undefined, props.key)
}

export function createTextElement(vm,text) {
    return vnode(vm, undefined, undefined, undefined, text)
}

export function isSameVnode(oldVnode, newVnode) {
  return oldVnode.tag == newVnode.tag && oldVnode.key === newVnode.key;
}

function vnode(vm, tag, props, children, text, key) {
    return {
        vm,
        tag,
        props,
        children,
        text,
        key
    }
}