let id = 0;

// 默认收集依赖调用的是dep.depend方法 核心就是让dep和watcher产生关联
// 我要记住这个属性依赖了哪个watcher，等会数据变化我要知道哪个watcher要更新了
// 还要记住watcher对应了那些属性 ...
class Dep{
    constructor() {
        this.id = id++;
        this.subs = [];
    }
    depend(){
        Dep.target.addDep(this); // 让watcher记住dep，同时去重
        // this.subs.push(Dep.target); // 直接让属性记住watcher？
    }
    addSub(watcher){
        this.subs.push(watcher);
    }
    notify(){
        this.subs.forEach(watcher=>watcher.update());
    }
}
Dep.target = null;

export default Dep; // 每个对象都增加一个dep ， 每个属性都增加一个dep