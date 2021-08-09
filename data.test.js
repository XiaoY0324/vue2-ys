function Vue(){}
Vue.extend = function(options){
    function Sub(){
        this.data = Sub.options.data()
    }
    Sub.options = options
    return Sub
}

let Sub = Vue.extend({ // 通过此方法可以返回组件的一个子类
    data(){
        return {name:'ys'}
    }
})
let s1 = new Sub();
let s2 = new Sub();

console.log(s1.data);
s1.data.name = 'sy';
console.log(s2.data)