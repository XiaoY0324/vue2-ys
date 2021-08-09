# 截止到 2021.08.09，代码重新构建完成，分布在分支 v-20210809
```python
- examples  # 测试用例的模板的文件夹
  - 1.observe.html
  - 2.update.html
  - 3.update.html
  - 4.mixin.html
  - 5.watch.html
  - 6.diff.html
- src
  - compile
    - generate.js  # 将 ast 生成 render 内部使用的代码片段
    - index.js     # 提供 compileToFunction，模板编译为 render 函数
    - parser.js    # 模板 -> ast 语法树
  - initGlobalAPI
    - index.js     # 初始化全局属性 Vue.options 和 Vue 静态方法
  - observer
    - array.js     # 重写数组方法
    - dep.js       # 观察者收集器
    - index.js     # 提供 Observer 类，进行变量劫持
    - watcher.js   # 观察者类和异步更新的逻辑
  - vdom   
    - index.js
    - patch.js     # dom diff，虚拟 dom -> 真实节点
.babelrc
package-lock.json
package.json
rollup.config.js
```
# 安装包
npm i

# 启动服务
npm start