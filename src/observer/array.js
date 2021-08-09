let oldArrayPrototype = Array.prototype;
export const proto = Object.create(oldArrayPrototype);

// proto.__proto__ = oldArrayPrototype
// arr.push()
// 函数劫持 让vue中的数组 可以拿到重写后的原型，如果找不到调用数组本身的方法
[
    'push', 'pop', 'unshfit', 'shift', 'reverse', 'sort', 'splice'
].forEach(method => {
    proto[method] = function(...args) { // args 可能是对象，我们需要对新增的对象也增加劫持操作
        // 调用老的方法
        let r = oldArrayPrototype[method].call(this, ...args);
        let ob = this.__ob__
        let inserted;
        // 我们需要对能新增的功能 再次做拦截 将新增的属性进行代理
        switch (method) {
            case 'push':
            case 'unshift': // 前后新增
                inserted = args
                break;
            case 'splice': // arr.splice(0,1,新增的内容)
                inserted = args.slice(2)
            default:
                break;
        }
        // 找到数组的dep 让数组更新
        // 我需要循环数组对他进行每一项的拦截
        ob.dep.notify(); // 告诉用户该更新页面了

        if(inserted)  ob.observeArray(inserted);
        return r;
    }
})