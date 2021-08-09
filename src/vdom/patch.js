export function patch(oldVnode, vnode) {

    if (oldVnode.nodeType === 1) {
        // 初始化渲染操作
        // 根据虚拟节点创造真实节点, 先根据虚拟节点创建一个真实节点，将节点插入到页面中在将老节点删除 
        // 为什么$mount('body | html')
        const parentElm = oldVnode.parentNode; // 获取父元素
        const elm = createElm(vnode)
        // 直接扔到body里不行吗？
        parentElm.insertBefore(elm, oldVnode.nextSibling)
        parentElm.removeChild(oldVnode);

        return elm;
    }
}

function createElm(vnode) {
    const { tag, props, children, text } = vnode;
    if (typeof tag == 'string') {
        vnode.el = document.createElement(tag); // 把创建的真实dom和虚拟dom映射在一起方便后续更新和复用
        children.forEach(child=>{
            vnode.el.appendChild(createElm(child))
        });
        // 样式稍后处理  diff算法的时候需要比较新老的属性进行更新？？？？？？
    }else{
        vnode.el = document.createTextNode(text);
    }
    return vnode.el;
}