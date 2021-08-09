import { proto } from "./array";
import Dep from './dep';

// 这里需要让数组进行依赖收集 ，数组在页面中使用了，应该让数组收集watcher，调用push\shuft\unshift 方法应该触发数组的对应的watcher来更新
class Observer {
    constructor(value) { // 将用户传入的选项 循环进行重写
        this.dep = new Dep(); // 相当于给对象（数组、object）本身增加了一个dep属性
        Object.defineProperty(value, '__ob__', {
            enumerable: false, // 在后续的循环中不可枚举的属性不能被循环出来
            value: this
        })
        if (Array.isArray(value)) {
            // 重写数组的七个方法
            value.__proto__ = proto;
            // 如果数组里放的是对象 要对对象再次代理
            this.observeArray(value);
        } else {
            this.walk(value);
        }
    }
    walk(target) {
        Object.keys(target).forEach(key => {
            defineReactive(target, key, target[key]);
        })
    }
    observeArray(target) {
        for (let i = 0; i < target.length; i++) {
            observe(target[i]);
        }
    }
}

function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
        let c = value[i]; // [[[[[[[[]]]]]]]]
        c.__ob__ && c.__ob__.dep.depend(); // 让数组中的对象或者数组再次依赖收集  [{name:'zzz'},[]]
        if (Array.isArray(c)) {
            dependArray(c); // 保证数组中的对象和数组都能有依赖收集的功能
        }
    }
}

function defineReactive(target, key, value) { // 定义响应式
    let dep = new Dep(); // 这个dep属性是为了key来服务的
    // 不存在的属性不会被defineProperty
    let childOb = observe(value); // 递归对象类型检测 （性能差 默认情况下要对所有的都进行递归操作）

    Object.defineProperty(target, key, { // 将属性重新定在对象上，增加了get和set（性能差）
        get() {
            // console.log('属性获取',36)
            if (Dep.target) {
                // 数组在页面中访问的方式也是通过实例来访问的 vm.arr, 也会执行对应的get方法， 让数组本身的dep收集这个watcher即可
                dep.depend(); // 让属性对应的dep 记住当前的watcher， 我还需要让watcher记住dep ， 要去重
                if (childOb) {
                    childOb.dep.depend(); // 这个就是让对象本身和数组本身进行依赖收集
                    // 还要对数组内部的对象也进行收集
                    if (Array.isArray(value)) { // 因为数组里面可能有对象 可能里面是数组，那我需要让里面的数组也进行依赖收集 
                        dependArray(value)
                    }
                }
            }
            return value;
        },
        set(newValue) {
            if (newValue === value) return
            // console.log('属性设置',41)
            observe(newValue); // 设置的值如果是对象，那么就再次调用observe让对象变成响应式的
            value = newValue;
            debugger;
            dep.notify();
        }
    })
}

export function observe(data) {
    // data 就是我们用户传入的数据 我们需要对他进行观测
    if (typeof data !== 'object' || data == null) {
        return; // 不是对象不能观测
    }
    if (data.__ob__) { // 如果一个数据有__ob__ 属性 说明已经被观测过了
        return;
    }
    // 后续要我们要知道是否这个对象被观测过了
    return new Observer(data); // xxx instanceof Observer
}