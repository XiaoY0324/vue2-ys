(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{  asdasd  }}

    function genProps(attrs) {
      var str = '';

      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];

        if (attr.name === 'style') {
          (function () {
            var style = {}; // color:red;background:blue

            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
              style[arguments[1]] = arguments[2];
            }); // 如果是sytle 我要将style转换成一个对象

            attr.value = style;
          })();
        }

        str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
      }

      return "{".concat(str.slice(0, -1), "}");
    }

    function gen(el) {
      if (el.type == 1) {
        return generate(el);
      } else {
        var text = el.text;

        if (!defaultTagRE.test(text)) {
          return "_v(\"".concat(text, "\")");
        } else {
          var tokens = []; // 杨帅 {{age}} 杨帅
          // _v(_s(name) + '杨帅' + _s(age))

          var match;
          var lastIndex = defaultTagRE.lastIndex = 0; // 保证每次正则都是从0 开始匹配的

          while (match = defaultTagRE.exec(text)) {
            // 如果exec + 全局匹配每次执行的时候 都需要还原lastIndex
            var index = match.index; // 匹配到后将前面一段放到tokens中

            if (index > lastIndex) {
              tokens.push(JSON.stringify(text.slice(lastIndex, index)));
            }

            tokens.push("_s(".concat(match[1].trim(), ")")); // 把当前这一段放到tokens中

            lastIndex = index + match[0].length;
          }

          if (lastIndex < text.length) {
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }

          return "_v(".concat(tokens.join('+'), ")");
        }
      }
    }

    function genChildren(ast) {
      var children = ast.children; // _c('div',{},'xxx')  _c('div',{},[])

      if (children && children.length > 0) {
        return children.map(function (child) {
          return gen(child);
        }).join(',');
      }

      return false;
    }

    function generate(ast) {
      var children = genChildren(ast);
      var code = "_c(\"".concat(ast.tag, "\",").concat(ast.attrs.length ? genProps(ast.attrs) : 'undefined').concat(children ? ',[' + children + ']' : '', ")");
      return code;
    } // _c('div', {
    //     "id": "app",
    //     "a": "1",
    //     "b": "2",
    // }, [_v("hello" + _s(age) + "\n        "), _c('span', [_v(_s(name))])])

    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*"; //

    var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); //  match匹配的是标签名

    var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 标签开头的正则 捕获的内容是标签名

    var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配标签结尾的 

    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的 分组里放的就是 "b",'b' ,b  => (b) 3 | 4 | 5
    // a = "b"   a = 'b'   a = b

    var startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 <br/>   <div> 

    function parserHTML(html) {
      function advance(len) {
        html = html.substring(len);
      }

      function parseStartTag() {
        var start = html.match(startTagOpen);

        if (start) {
          var match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);
          var attr;

          var _end;

          while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
            advance(attr[0].length);
          }

          advance(_end[0].length);
          return match;
        }

        return false;
      } // 生成一颗树  <div id="app" a=1 b=2>hello{{age}} <span>{{name}}</p>111</div>
      // [div,span]
      // 文本 -》 我的父亲是div
      // span => 我的父亲是div
      // {{name}} => 我的父亲是span
      // 遇到结束标签 就做pop操作 [div]
      // 111 -> 我的父亲是div
      //  就做pop操作


      var root = null;
      var stack = [];

      function createAstElement(tag, attrs) {
        return {
          tag: tag,
          type: 1,
          attrs: attrs,
          children: [],
          parent: null
        };
      }

      function start(tagName, attrs) {
        // 匹配到了开始的标签
        var element = createAstElement(tagName, attrs);

        if (!root) {
          root = element;
        }

        var parent = stack[stack.length - 1];

        if (parent) {
          element.parent = parent; // 当放入span的时候 我就知道div是他的父亲

          parent.children.push(element);
        }

        stack.push(element);
      }

      function chars(text) {
        // 匹配到了开始的标签
        var parent = stack[stack.length - 1];
        text = text.replace(/\s/g, ''); // 遇到空格就删除掉

        if (text) {
          parent.children.push({
            text: text,
            type: 3
          });
        }
      }

      function end(tagName) {
        stack.pop(); // 每次出去就在栈中删除当前这一项, 这里你可以判断标签是否出错
      }

      while (html) {
        // html只能由一个根节点
        var textEnd = html.indexOf('<');

        if (textEnd == 0) {
          // 如果遇到< 说明可能是开始标签或者结束标签 <!DOC
          var startTagMatch = parseStartTag(); // console.log(startTagMatch)

          if (startTagMatch) {
            // 匹配到了开始标签
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          } // 如果代码走到这里了 说明是结束标签


          var endTagMatch = html.match(endTag);

          if (endTagMatch) {
            end(endTagMatch[1]);
            advance(endTagMatch[0].length);
          }
        }

        var text = void 0;

        if (textEnd > 0) {
          text = html.substring(0, textEnd);
        }

        if (text) {
          chars(text);
          advance(text.length);
        }
      }

      return root;
    } // 虚拟dom是描述dom的对象
    // {
    //     tag:'div',
    //     type:1,
    //     children:[{text:'hello {{age}}',type:3,parent:'div对象'},{ type:'span',type:1,attrs:[],parent:'div对象'}]
    //     attrs:[{name:'id':value:'app'}],
    //     parent:null
    // }

    function compileToFunction(html) {
      // 编译流程有三个部分 1.把模板变成ast语法树   2.优化标记静态节点 （patchFlag,BlockTree） 3.把ast变成render函数
      var ast = parserHTML(html); // console.log(ast);
      // 2.优化标记静态节点
      // 3.将ast变成render函数  你要把刚才这棵树 用字符串拼接的方式 变成render函数

      var code = generate(ast); // 根据ast生成一个代码字符串

      var render = new Function("with(this){return ".concat(code, "}"));
      return render;
    } // 第一种 一个个的进行词法解析 <  {  （状态机 随着状态的扭转把结果进行解析） Vue3
    // 第二种 采用的是正则
    // <div id="app">hello{{age}}</div>

    function _typeof(obj) {
      "@babel/helpers - typeof";

      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    function createElement(vm, tag) {
      var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var children = arguments.length > 3 ? arguments[3] : undefined;
      return vnode(vm, tag, props, children, undefined, props.key);
    }
    function createTextElement(vm, text) {
      return vnode(vm, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, props, children, text, key) {
      return {
        vm: vm,
        tag: tag,
        props: props,
        children: children,
        text: text,
        key: key
      };
    }

    function patch(oldVnode, vnode) {
      if (oldVnode.nodeType === 1) {
        // 初始化渲染操作
        // 根据虚拟节点创造真实节点, 先根据虚拟节点创建一个真实节点，将节点插入到页面中在将老节点删除 
        // 为什么$mount('body | html')
        var parentElm = oldVnode.parentNode; // 获取父元素

        var elm = createElm(vnode); // 直接扔到body里不行吗？

        parentElm.insertBefore(elm, oldVnode.nextSibling);
        parentElm.removeChild(oldVnode);
        return elm;
      }
    }

    function createElm(vnode) {
      var tag = vnode.tag;
          vnode.props;
          var children = vnode.children,
          text = vnode.text;

      if (typeof tag == 'string') {
        vnode.el = document.createElement(tag); // 把创建的真实dom和虚拟dom映射在一起方便后续更新和复用

        children.forEach(function (child) {
          vnode.el.appendChild(createElm(child));
        }); // 样式稍后处理  diff算法的时候需要比较新老的属性进行更新？？？？？？
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    var id$1 = 0; // 默认收集依赖调用的是dep.depend方法 核心就是让dep和watcher产生关联
    // 我要记住这个属性依赖了哪个watcher，等会数据变化我要知道哪个watcher要更新了
    // 还要记住watcher对应了那些属性 ...

    var Dep = /*#__PURE__*/function () {
      function Dep() {
        _classCallCheck(this, Dep);

        this.id = id$1++;
        this.subs = [];
      }

      _createClass(Dep, [{
        key: "depend",
        value: function depend() {
          Dep.target.addDep(this); // 让watcher记住dep，同时去重
          // this.subs.push(Dep.target); // 直接让属性记住watcher？
        }
      }, {
        key: "addSub",
        value: function addSub(watcher) {
          this.subs.push(watcher);
        }
      }, {
        key: "notify",
        value: function notify() {
          this.subs.forEach(function (watcher) {
            return watcher.update();
          });
        }
      }]);

      return Dep;
    }();

    Dep.target = null;
     // 每个对象都增加一个dep ， 每个属性都增加一个dep

    var id = 0;

    var Watcher = /*#__PURE__*/function () {
      // 用户的回调 是用户的函数  
      // exprOrFn是监控的属性 name (有可能是渲染watcher) 先取一下vm.name 作为老的值，后续值变化了 才去取一次
      // vm 是当前的实例  
      // options 就是参数列表
      function Watcher(vm, exprOrFn, callback) {
        var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        _classCallCheck(this, Watcher);

        this.deps = []; // watcher对应存放的dep

        this.id = id++;

        if (typeof exprOrFn == 'function') {
          this.getter = exprOrFn; // 将用户传入的fn 保存在getter上
        } else {
          this.getter = function () {
            return vm[exprOrFn];
          }; // 取值的时候会收集watcher

        }

        this.depsId = new Set(); // 去重

        this.value = this.get(); // this.value 就是老的值

        this.callback = callback;
        this.options = options;
      }

      _createClass(Watcher, [{
        key: "get",
        value: function get() {
          Dep.target = this; // 将watcher暴露到全局变量上

          var value = this.getter(); // 第一次渲染会默认调用getter  vm._update(vm._render())  // 取值的逻辑

          Dep.target = null;
          return value;
        }
      }, {
        key: "addDep",
        value: function addDep(dep) {
          var id = dep.id;

          if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep); // 让watcher记住dep

            dep.addSub(this);
          }
        }
      }, {
        key: "update",
        value: function update() {
          console.log('update');
          queueWatcher(this);
        }
      }, {
        key: "run",
        value: function run() {
          // 真实的执行
          var newValue = this.get();
          var oldValue = this.value;
          this.value = newValue;

          if (this.options.user) {
            this.callback(newValue, oldValue);
          }
        }
      }]);

      return Watcher;
    }();

    var watchsId = new Set();
    var queue = [];
    var pending = false;

    function flushShedulerQueue() {
      for (var i = 0; i < queue.length; i++) {
        var watcher = queue[i];
        watcher.run();
      }

      queue = [];
      watchsId.clear();
      pending = false;
    }

    function queueWatcher(watcher) {
      var id = watcher.id; // 取出watcher的id 

      if (!watchsId.has(id)) {
        // 看一下这里有没有这个watcher
        watchsId.add(id); // 如果没有添加watcher到更新队列中

        queue.push(watcher); // 放到队列中

        if (!pending) {
          // vue2 里面要考虑兼容性 vue2里面会优先采用promise但是ie不支持promise 需要降级成 mutationObserver h5提供的一个方法
          // setImmediate 这个方法在ie中性能是比较好的，都不兼容fallback -> setTimeout
          Promise.resolve().then(flushShedulerQueue);
          pending = true;
        }
      }
    }

    function lifeCycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        // 虚拟dom变成真实dom进行渲染的，后续更新也调用此方法
        this.$el = patch(this.$el, vnode); // 渲染  传入一个真实的dom 和 vnode
        // 更新  传入两个虚拟节点  diff算法 
      };

      Vue.prototype._c = function () {
        // _c('div',undefoined,[])
        return createElement.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
      };

      Vue.prototype._v = function (text) {
        // _v(字符串 + name + 'xxx')
        return createTextElement(this, text);
      };

      Vue.prototype._s = function (val) {
        // _s(name)
        if (_typeof(val) === 'object') return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        // 调用编译后的render方法，生成虚拟节点
        var vm = this;
        var render = vm.$options.render;
        var vnode = render.call(vm); // 这里会进行取值操作 触发了get方法 仅需取值 （依赖收集）

        return vnode;
      };
    }
    function mountComponent(vm, el) {
      // vue3 里面靠的是产生一个effect, vue2中靠的是watcher
      var updateComponent = function updateComponent() {
        // 1.产生虚拟节点 2.根据虚拟节点产生真实节点
        vm._update(vm._render());
      };

      new Watcher(vm, updateComponent, function () {
        callHook('beforeUpdate');
      }); // 渲染是通过watcher来进行渲染的
    } // 和Vue3的渲染流程是否一致？

    var oldArrayPrototype = Array.prototype;
    var proto = Object.create(oldArrayPrototype); // proto.__proto__ = oldArrayPrototype
    // arr.push()
    // 函数劫持 让vue中的数组 可以拿到重写后的原型，如果找不到调用数组本身的方法

    ['push', 'pop', 'unshfit', 'shift', 'reverse', 'sort', 'splice'].forEach(function (method) {
      proto[method] = function () {
        var _oldArrayPrototype$me;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // args 可能是对象，我们需要对新增的对象也增加劫持操作
        // 调用老的方法
        var r = (_oldArrayPrototype$me = oldArrayPrototype[method]).call.apply(_oldArrayPrototype$me, [this].concat(args));

        var ob = this.__ob__;
        var inserted; // 我们需要对能新增的功能 再次做拦截 将新增的属性进行代理

        switch (method) {
          case 'push':
          case 'unshift':
            // 前后新增
            inserted = args;
            break;

          case 'splice':
            // arr.splice(0,1,新增的内容)
            inserted = args.slice(2);
        } // 找到数组的dep 让数组更新
        // 我需要循环数组对他进行每一项的拦截


        ob.dep.notify(); // 告诉用户该更新页面了

        if (inserted) ob.observeArray(inserted);
        return r;
      };
    });

    var Observer = /*#__PURE__*/function () {
      function Observer(value) {
        _classCallCheck(this, Observer);

        // 将用户传入的选项 循环进行重写
        this.dep = new Dep(); // 相当于给对象（数组、object）本身增加了一个dep属性

        Object.defineProperty(value, '__ob__', {
          enumerable: false,
          // 在后续的循环中不可枚举的属性不能被循环出来
          value: this
        });

        if (Array.isArray(value)) {
          // 重写数组的七个方法
          value.__proto__ = proto; // 如果数组里放的是对象 要对对象再次代理

          this.observeArray(value);
        } else {
          this.walk(value);
        }
      }

      _createClass(Observer, [{
        key: "walk",
        value: function walk(target) {
          Object.keys(target).forEach(function (key) {
            defineReactive(target, key, target[key]);
          });
        }
      }, {
        key: "observeArray",
        value: function observeArray(target) {
          for (var i = 0; i < target.length; i++) {
            observe(target[i]);
          }
        }
      }]);

      return Observer;
    }();

    function dependArray(value) {
      for (var i = 0; i < value.length; i++) {
        var c = value[i]; // [[[[[[[[]]]]]]]]

        c.__ob__ && c.__ob__.dep.depend(); // 让数组中的对象或者数组再次依赖收集  [{name:'zzz'},[]]

        if (Array.isArray(c)) {
          dependArray(c); // 保证数组中的对象和数组都能有依赖收集的功能
        }
      }
    }

    function defineReactive(target, key, value) {
      // 定义响应式
      var dep = new Dep(); // 这个dep属性是为了key来服务的
      // 不存在的属性不会被defineProperty

      var childOb = observe(value); // 递归对象类型检测 （性能差 默认情况下要对所有的都进行递归操作）

      Object.defineProperty(target, key, {
        // 将属性重新定在对象上，增加了get和set（性能差）
        get: function get() {
          // console.log('属性获取',36)
          if (Dep.target) {
            // 数组在页面中访问的方式也是通过实例来访问的 vm.arr, 也会执行对应的get方法， 让数组本身的dep收集这个watcher即可
            dep.depend(); // 让属性对应的dep 记住当前的watcher， 我还需要让watcher记住dep ， 要去重

            if (childOb) {
              childOb.dep.depend(); // 这个就是让对象本身和数组本身进行依赖收集
              // 还要对数组内部的对象也进行收集

              if (Array.isArray(value)) {
                // 因为数组里面可能有对象 可能里面是数组，那我需要让里面的数组也进行依赖收集 
                dependArray(value);
              }
            }
          }

          return value;
        },
        set: function set(newValue) {
          if (newValue === value) return; // console.log('属性设置',41)

          observe(newValue); // 设置的值如果是对象，那么就再次调用observe让对象变成响应式的

          value = newValue;
          debugger;
          dep.notify();
        }
      });
    }

    function observe(data) {
      // data 就是我们用户传入的数据 我们需要对他进行观测
      if (_typeof(data) !== 'object' || data == null) {
        return; // 不是对象不能观测
      }

      if (data.__ob__) {
        // 如果一个数据有__ob__ 属性 说明已经被观测过了
        return;
      } // 后续要我们要知道是否这个对象被观测过了


      return new Observer(data); // xxx instanceof Observer
    }

    function initState(vm) {
      var options = vm.$options; // 先props 在methods 在data 在 computed 在watch  (检测重名 规则是vue自己定的)

      if (options.data) {
        // 初始化data选项
        initData(vm);
      }

      if (options.computed) ;

      if (options.watch) {
        // 做一个watch选项的初始化
        initWatch(vm);
      }
    }

    function proxy(target, key, property) {
      // vm.xxx -> vm._data.xxx
      Object.defineProperty(target, property, {
        get: function get() {
          return target[key][property];
        },
        set: function set(n) {
          target[key][property] = n;
        }
      });
    }

    function initData(vm) {
      var data = vm.$options.data; // 需要对用户提供的data属性把他的所有属性进行重写增添get和set，只能拦截已经存在的属性

      data = vm._data = typeof data === 'function' ? data.call(vm) : data; // vm._data 和 data是同一个对象，观测的是data 但是vm._data 也是被观测过的
      // 用户使用 vm._data来获取有些麻烦， 我希望可以通过vm.xxx -> vm._data.xxx

      for (var key in data) {
        proxy(vm, '_data', key); // 循环代理属性, 为了用户使用的时候 直接可以通过vm.xxx
      }

      observe(data); // 对数据进行挂测
    }

    function initWatch(vm) {
      var watch = vm.$options.watch; // 给每一个属性都创建一个watcher  （渲染watcher） （用户watcher） （计算属性watcher）

      for (var key in watch) {
        createWatcher(vm, key, watch[key]);
      }
    }

    function createWatcher(vm, key, value) {
      return vm.$watch(key, value); // 监控某个属性 和对应的处理函数
    }

    // 1.合并 拷贝 面试问js 就问这俩 防抖节流柯里化
    var strats = {};
    ['beforeCreate', 'created', 'beforeMount', 'mounted'].forEach(function (method) {
      strats[method] = function (parentVal, childVal) {
        // 第一次 parentVal 是空的 Vue.options = {beforeCreate:function(){}} , options ={a,beforeCreate:function(){}}
        if (childVal) {
          if (parentVal) {
            return parentVal.concat(childVal); // 父亲和儿子进行合并
          } else {
            return [childVal]; // 如果儿子有声明周期 父亲没有 就将儿子的变成数组
          }
        } else {
          return parentVal; // 如果儿子没有就直接用父亲的
        }
      };
    });
    function mergeOptions(parentVal, childVal) {
      // 合并的过程是自己定义的策略
      // 1.如果a的有b的没有，那么采用a的
      // 2.如果a的有b的也有，那就采用b的
      // 3.特殊情况 比如说生命周期，我就需要做处理把多个生命周期合并成数组
      var options = {};

      for (var key in parentVal) {
        mergeField(key);
      }

      for (var _key in childVal) {
        // b有的a没有
        if (!parentVal.hasOwnProperty(_key)) {
          mergeField(_key);
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

    function callHook$1(vm, hook) {
      // 找到对应的处理函数依次执行
      var handlers = vm.$options[hook];

      if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
          handlers[i].call(vm);
        }
      }
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        var vm = this; // 此时options 是用户的 我需要用用户的+全局的 合并出结果来

        vm.$options = mergeOptions(this.constructor.options, options); // 后续所有的原型中都可以通过 vm.$options 拿到用户传递的选项

        callHook$1(vm, 'beforeCreate');
        initState(vm); // 状态的初始化，目的就是初始化用户传入的props  data  computed watch
        // 判断用户是否传入了el ，如果传入了el 要实现页面的挂载

        if (options.el) {
          vm.$mount(options.el);
        }
      };

      Vue.prototype.$mount = function (el) {
        // render -> template -> outerHTML
        var vm = this;
        el = document.querySelector(el);
        vm.$el = el;
        var options = vm.$options;

        if (!options.render) {
          // 没有render
          var template = options.template;

          if (!template) {
            // 如果没有模板 就采用指定元素对应的模板
            template = el.outerHTML;
          }

          options.render = compileToFunction(template); // 模板的编译
        } // 有render直接调用render方法
        // render = options.render;  // 最终拿到编译后的render
        // 根据render方法产生虚拟节点，在将虚拟节点变成真实节点 插入到页面中即可


        mountComponent(vm); // 组件挂载流程 
      };

      Vue.prototype.$watch = function (key, handler) {
        debugger;
        new Watcher(this, key, handler, {
          user: true
        });
      };
    }

    function initGlobalAPI(Vue) {
      Vue.options = {}; // 所有的全局属性 都会放到这个变量上

      Vue.mixin = function (options) {
        // 用户要合并的对象
        this.options = mergeOptions(this.options, options);
      };
    }

    function Vue(options) {
      // 构造函数
      this._init(options);
    }

    initGlobalAPI(Vue);
    initMixin(Vue);
    lifeCycleMixin(Vue);
    // optionsApi 不知道这些选项哪些能用到  所以无法实现tree-shaking

    return Vue;

})));
//# sourceMappingURL=vue.js.map
