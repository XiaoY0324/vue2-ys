import { generate } from "./generate";
import { parserHTML } from "./parser";

export function compileToFunction(html) {
    // 编译流程有三个部分 1.把模板变成ast语法树   2.优化标记静态节点 （patchFlag,BlockTree） 3.把ast变成render函数
    const ast = parserHTML(html);
    // console.log(ast);
    
    // 2.优化标记静态节点


    // 3.将ast变成render函数  你要把刚才这棵树 用字符串拼接的方式 变成render函数
    const code = generate(ast); // 根据ast生成一个代码字符串

    const render = new Function(`with(this){return ${code}}`);
    return render;
}


// 第一种 一个个的进行词法解析 <  {  （状态机 随着状态的扭转把结果进行解析） Vue3
// 第二种 采用的是正则
// <div id="app">hello{{age}}</div>