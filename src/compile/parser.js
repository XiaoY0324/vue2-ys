const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; //
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  match匹配的是标签名
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的 分组里放的就是 "b",'b' ,b  => (b) 3 | 4 | 5


// a = "b"   a = 'b'   a = b
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 <br/>   <div> 
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // {{  asdasd  }}


export function parserHTML(html) {
    function advance(len) {
        html = html.substring(len);
    }

    function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length);
            let attr;
            let end;
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] });
                advance(attr[0].length);
            }
            advance(end[0].length);
            return match;
        }
        return false;

    }
    // 生成一颗树  <div id="app" a=1 b=2>hello{{age}} <span>{{name}}</p>111</div>
    // [div,span]
    // 文本 -》 我的父亲是div
    // span => 我的父亲是div
    // {{name}} => 我的父亲是span
    // 遇到结束标签 就做pop操作 [div]
    // 111 -> 我的父亲是div
    //  就做pop操作
    let root = null;
    let stack = [];
    let parent = null;
    function createAstElement(tag, attrs) {
        return {
            tag,
            type: 1,
            attrs,
            children: [],
            parent: null
        }
    }
    function start(tagName, attrs) { // 匹配到了开始的标签
        let element = createAstElement(tagName, attrs);
        if (!root) {
            root = element
        }
        let parent = stack[stack.length - 1];
        if (parent) {
            element.parent = parent; // 当放入span的时候 我就知道div是他的父亲
            parent.children.push(element);
        }
        stack.push(element);
    }
    function chars(text) { // 匹配到了开始的标签
        let parent = stack[stack.length - 1];
        text = text.replace(/\s/g,''); // 遇到空格就删除掉
        if(text){
            parent.children.push({
                text,
                type:3
            });
        }
    }
    function end(tagName) {
        stack.pop(); // 每次出去就在栈中删除当前这一项, 这里你可以判断标签是否出错
    }
    while (html) { // html只能由一个根节点
        let textEnd = html.indexOf('<');
        if (textEnd == 0) { // 如果遇到< 说明可能是开始标签或者结束标签 <!DOC
            const startTagMatch = parseStartTag();
            // console.log(startTagMatch)
            if (startTagMatch) { // 匹配到了开始标签
                start(startTagMatch.tagName, startTagMatch.attrs);
                continue
            }
            // 如果代码走到这里了 说明是结束标签
            const endTagMatch = html.match(endTag);
            if (endTagMatch) {
                end(endTagMatch[1]);
                advance(endTagMatch[0].length);
            }
        }
        let text;
        if (textEnd > 0) {
            text = html.substring(0, textEnd)
        }
        if (text) {
            chars(text);
            advance(text.length);
        }
    }
    return root;
}

// 虚拟dom是描述dom的对象
{ /*  <span>{{name}}</span></div> */ }

// ast 抽象语法树 ，描述html语法本身的

// {
//     tag:'div',
//     type:1,
//     children:[{text:'hello {{age}}',type:3,parent:'div对象'},{ type:'span',type:1,attrs:[],parent:'div对象'}]
//     attrs:[{name:'id':value:'app'}],
//     parent:null
// }