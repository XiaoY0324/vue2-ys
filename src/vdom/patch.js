import { isSameVnode } from ".";

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
  } else {
    // oldVnode 是虚拟节点，代表要做新旧 vnode 的 diff
    // -------------- diff 来啦 -----------------
    // 比较虚拟节点的差异，而且会递归下探到子节点
    patchVnode(oldVnode, vnode);
  }
}


// 新旧 vnode 的 diff 比对
function patchVnode(oldVnode, vnode) {
  // 1. 节点改变直接替换
  if (!isSameVnode(oldVnode, vnode)) {
    // 如果顶层节点不能复用，不用进行 diff 算法比对，newVnode -> newDom -> 替换旧 DOM
    return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
  }

  // 复用 el
  let el = vnode.el = oldVnode.el;

  // 2. 文本节点直接替换(tag 为 undefined)
  if (!oldVnode.tag) {
    // 因为走到这里说明新旧节点相等(一个为 undefined，另一个也是)，不然在 1 就被替换啦，所以这里判断一个即可
    if (oldVnode.text !== vnode.text) {
      return oldVnode.el.textContent = vnode.text;
    }
  }

  // 3. 相同节点，对比 & 更新属性
  updateProperties(vnode, oldVnode.props);

  // 比对完外部标签后，该进行儿子的比对了
  //  @1 两方都有儿子
  //  @2 一方有儿子，一方没儿子
  //  @3 两方都是文本的
  let oldChildren = oldVnode.children || [];
  let newChildren = vnode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 两方都有儿子(可能是文本哦)，开始进行 diff 比对
    updateChildren(el, oldChildren, newChildren);
  } else if (oldChildren.length > 0) {
    // 老节点有儿子，新节点没儿子，给复用的节点干掉子节点
    el.innerHTML = '';
  } else if (newChildren.length > 0) {
    // 新节点有儿子，老节点没儿子, 给复用的节点创建儿子
    newChildren.forEach(child => el.appendChild(createElm(child)));
  }
}

// 比较儿子节点，diff 算法的核心
function updateChildren(el, oldChildren, newChildren) {
  // vue2 对常见dom的操作做了一些优化
  // push shift unshift pop reserver sort api经常被用到，我们就考虑对这些特殊的情况做一些优化
  // 内部采用了双指针的方式
  let oldStartIndex = 0;
  let newStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newEndIndex = newChildren.length - 1; // 索引 
  // 当前虚拟节点
  let oldStartVnode = oldChildren[oldStartIndex];
  let newStartVnode = newChildren[newStartIndex];
  let oldEndVnode = oldChildren[oldEndIndex];
  let newEndVnode = newChildren[newEndIndex] // 虚拟节点

  function makeIndexByKey(oldChildren) {
    let map = {};

    oldChildren.forEach((item, index) => {
      map[item.key] = index;
    });

    return map;
  }

  // 将旧 children 做出映射表, ABCD -> {A: 0, B: 1, C: 2, D: 3}
  let map = makeIndexByKey(oldChildren);

  // 从头部开始比，比对结束后移动指针，一方遍历结束 O(n) 的遍历
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) {
      // 防止指针在移动的时候 oldChildren 中的那一项已经被移动走了(重置为 null)，则直接跳过 
      // 比如 ABCDEF -> BDEMP，当遍历到新列表中 D 时候，就把 ABCDEF -> ABC null EF 了。
      // 那么老列表遍历到 null 要直接跳到下一个！
      // 同样后面元素往前移动也需要跳过去(比如移动到某节点前)，如果该节点为null，不处理
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if (!oldEndVnode) {
      // 防止指针在移动的时候 oldChildren 中的那一项已经被移动走了(重置为 null)，则直接跳过
      oldEndVnode = oldChildren[--oldEndIndex]
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {
      // 旧 children 头节点相同，继续比头节点

      // 相同节点直接递归 diff 比对 + 节点更新，标签一致比属性，属性比完比儿子
      patchVnode(oldStartVnode, newStartVnode);

      // 移动指针，继续遍历
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      // 新旧 children 头节点不同，尾结点相同

      // 节点 diff
      patchVnode(oldEndVnode, newEndVnode);

      // 修改下标，继续遍历
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      // 头和头，尾和尾都不同，旧 children 头和新 children 尾相同，头真实 dom 移到尾部

      // 节点 diff
      patchVnode(oldStartVnode, newEndVnode);

      // 元素移位，移动到旧 children 末尾的后面
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);

      // 更新旧 children 的开始节点为下一个，且进行指针移动
      oldStartVnode = oldChildren[++oldStartIndex];
      // 更新新 children 的尾节点为前一个，且进行指针移动
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      // 头和头，尾和尾都不同，旧 children 尾和新 children 头相同，尾移头

      // 节点 diff
      patchVnode(oldEndVnode, newStartVnode);

      // 元素移位，移动到旧 children 开始节点的前面
      el.insertBefore(oldEndVnode.el, oldStartVnode.el);

      // 更新旧 children 的尾节点为前一个，且进行指针移动
      oldEndVnode = oldChildren[--oldEndIndex];
      // 更新新 children 的尾节点为前一个，且进行指针移动
      newStartVnode = newChildren[++newStartIndex];
    } else { // 搞完四种特殊场景的优化后，我们需要来最复杂的乱序比对啦
      // 乱序比对是指，以上四种情况都不满足，头头，头尾互相都不等

      // 拿到当前新 children 中节点的 key 去 map 中寻找，找到代表需要进行真实 dom 移位
      // 当然，列表上也要移位，原位置补 null，为了保下标
      let moveIndex = map[newStartVnode.key];

      if (moveIndex === undefined) { // 老列表不存在，创建 dom 节点，插入到 oldStartIndex 前面
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
      } else {  // 比较并移动
        let moveVnode = oldChildren[moveIndex]; // 获取要移动的虚拟节点

        // 能复用就要比对，更新属性和子节点等~
        patchVnode(moveVnode, newStartVnode);
        el.insertBefore(moveVnode.el, oldStartVnode.el); // 将更新过的真实节点移动出来
        oldChildren[moveIndex] = null; // 列表上把移走的元素置 null
      }

      // 移动到下一个节点做比对，可以理解成这里面不停遍历新列表
      newStartVnode = newChildren[++newStartIndex];
    }
  }

  // 乱序比对完成，把剩余没操作的元素干掉
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      let child = oldChildren[i];

      if (child !== null) {
        el.removeChild(child.el); // 移除老的中心的不需要的元素
      }
    }
  }

  // 针对节点不同的更新情况~
  // 如果是后面或前面追加元素
  //   @1 比如 ABCD -> ABCDEF，需要把尾部新增元素插入
  //   @2 比如 EABCD -> ABCD，需要把头部新增元素插入
  // 具体做法是取尾指针的下一个元素
  //   @2 如果没值，说明尾指针在末尾(后追加元素)，对整个列表进行元素追加即可
  //   @1 如果有值，说明尾指针在前面了(前追加元素)，做下个节点的前插入
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 尾指针的下一个元素！也是参考物，有就是插入，没有就是追加
      let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el;

      el.insertBefore(createElm(newChildren[i]), anchor);
    }
  }
}

// 相同节点，对比 & 更新属性，oldProps 首次渲染不存在
function updateProperties(vnode, oldProps = {}) { // oldProps 可能不存在，如果存在就表示更新
  let newProps = vnode.props || {}; // 获取新的属性
  let el = vnode.el;
  // 比较前后属性是否一致 老的有新的没有，将老的删除掉，
  // 如果新的有 老的 也有，以新的为准
  // 如果新的有老的没有，直接替换成新的
  let oldStyle = oldProps.style || {}; // 如果前后都是样式
  let newStyle = newProps.style || {};
  for (let key in oldStyle) {
    if (!(key in newStyle)) { // 老的有的属性 但是新的没有，我就将他移除掉 
      el.style[key] = ''
    }
  }
  for (let key in oldProps) {
    if (!(key in newProps)) { // 老的有的属性 但是新的没有，我就将他移除掉 
      el.removeAttribute(key)
    }
  }
  for (let key in newProps) { // 以新的为准
    if (key == 'style') {
      for (let styleName in newStyle) {
        el.style[styleName] = newStyle[styleName]; // 对样式的特殊处理
      }
    } else {
      el.setAttribute(key, newProps[key]);
    }
  }
}

export function createElm(vnode) {
  const { tag, props, children, text } = vnode;
  if (typeof tag == 'string') {
    vnode.el = document.createElement(tag); // 把创建的真实dom和虚拟dom映射在一起方便后续更新和复用
    updateProperties(vnode); // 处理样式
    children && children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    });
    // 样式稍后处理  diff算法的时候需要比较新老的属性进行更新？？？？？？
  } else {
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}