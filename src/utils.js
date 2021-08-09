// 1.合并 拷贝 面试问js 就问这俩 防抖节流柯里化
const strats = {};
['beforeCreate', 'created', 'beforeMount', 'mounted'].forEach(method => {
    strats[method] = function(parentVal,childVal) {
        // 第一次 parentVal 是空的 Vue.options = {beforeCreate:function(){}} , options ={a,beforeCreate:function(){}}
        if(childVal){
            if(parentVal){
                return parentVal.concat(childVal); // 父亲和儿子进行合并
            }else{
                return [childVal]; // 如果儿子有声明周期 父亲没有 就将儿子的变成数组
            }
        }else{
            return parentVal; // 如果儿子没有就直接用父亲的
        }
    }
})
export function mergeOptions(parentVal, childVal) { // 合并的过程是自己定义的策略
    // 1.如果a的有b的没有，那么采用a的
    // 2.如果a的有b的也有，那就采用b的
    // 3.特殊情况 比如说生命周期，我就需要做处理把多个生命周期合并成数组
    const options = {};
    for (let key in parentVal) {
        mergeField(key)
    }
    for (let key in childVal) { // b有的a没有
        if (!parentVal.hasOwnProperty(key)) {
            mergeField(key)
        }
    }
    function mergeField(key) {
        // 针对不同的key进行合并 ?, 将不同的策略定义在对象上，到时候根据不同的策略进行加载
        if (strats[key]) {
            options[key] = strats[key](parentVal[key], childVal[key]);
        } else {
            options[key] = childVal[key] || parentVal[key]; // 新的有优先用新的
        }
    }
    return options;
}