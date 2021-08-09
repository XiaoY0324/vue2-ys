const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // {{  asdasd  }}

function genProps(attrs) {
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') {
            let style = {} // color:red;background:blue
            attr.value.replace(/([^;:]+)\:([^;:]+)/g, function() {
                style[arguments[1]] = arguments[2]
            }); // 如果是sytle 我要将style转换成一个对象
            attr.value = style;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`
    }
    return `{${str.slice(0,-1)}}`
}

function gen(el) {
    if (el.type == 1) {
        return generate(el)
    } else {
        let text = el.text
        if (!defaultTagRE.test(text)) {
            return `_v("${text}")`
        } else {  
            let tokens = []; // 杨帅 {{age}} 杨帅
            // _v(_s(name) + '杨帅' + _s(age))
            let match;
            let lastIndex = defaultTagRE.lastIndex = 0; // 保证每次正则都是从0 开始匹配的
            while (match = defaultTagRE.exec(text)) { // 如果exec + 全局匹配每次执行的时候 都需要还原lastIndex
                let index = match.index; // 匹配到后将前面一段放到tokens中
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))
                }
                tokens.push(`_s(${match[1].trim()})`);   // 把当前这一段放到tokens中
                lastIndex = index + match[0].length
            }
            if(lastIndex < text.length){
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        }
    }
}


function genChildren(ast) {
    let children = ast.children; // _c('div',{},'xxx')  _c('div',{},[])
    if (children && children.length > 0) {
        return children.map(child => gen(child)).join(',')
    }
    return false;
}
export function generate(ast) {
    let children = genChildren(ast)
    let code = `_c("${ast.tag}",${
        ast.attrs.length? genProps(ast.attrs) : 'undefined'
    }${
        children? ',['+children+']' : ''
    })`
    return code;
}

// _c('div', {
//     "id": "app",
//     "a": "1",
//     "b": "2",
// }, [_v("hello" + _s(age) + "\n        "), _c('span', [_v(_s(name))])])